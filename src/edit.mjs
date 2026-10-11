// Surgical edits of solopilot.yaml, for the two commands that write it (layout and baseline).
//
// The file is hand-kept: aligned comments, one entry per line, the user's own quoting. Serializing a
// parsed document again would reformat all of it, so each edit replaces only the bytes of the value
// it changes, located through the parser's source ranges. Every edit is also applied to the parsed
// data; the edited text must read back as exactly that data, or nothing is written.
import { isDeepStrictEqual } from 'node:util';
import YAML from 'yaml';

export class EditRefused extends Error {}

const RESERVED = /^(true|false|null|yes|no|on|off|y|n)$/i;
// Written plain, like the rest of the file: dates, ids (T024, F01) and lowercase keywords (todo,
// later, tight). Any other text is double-quoted, as titles and notes always are.
const PLAIN = /^(\d{4}-\d{2}-\d{2}|[A-Z]{1,2}\d{1,4}|[a-z][a-z_]*)$/;

// A value as YAML text, which reads back as the same value.
export function yamlValue(v) {
  if (Array.isArray(v)) return `[${v.map(yamlValue).join(', ')}]`;
  if (v !== null && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${yamlValue(x)}`).join(', ')} }`;
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return String(v);
  const s = String(v);
  return PLAIN.test(s) && !RESERVED.test(s) ? s : JSON.stringify(s);
}

const keyOf = (pair) => pair?.key?.value;

export class BacklogEditor {
  constructor(text) {
    this.eol = text.includes('\r\n') ? '\r\n' : '\n';
    this.src = text.replace(/\r\n/g, '\n');
    this.doc = YAML.parseDocument(this.src);
    if (this.doc.errors.length) throw new EditRefused(`the file does not parse: ${this.doc.errors[0].message}`);
    if (!YAML.isMap(this.doc.contents)) throw new EditRefused('the file is not a map of sections');
    this.expected = this.doc.toJS() ?? {};
    this.edits = [];
  }

  section(key) {
    return this.doc.contents.items.find((p) => keyOf(p) === key);
  }

  lineStart(i) {
    return this.src.lastIndexOf('\n', i - 1) + 1;
  }

  lineEnd(i) {
    const j = this.src.indexOf('\n', i);
    return j < 0 ? this.src.length : j;
  }

  indentOf(i) {
    return ' '.repeat(i - this.lineStart(i));
  }

  // Where a one-line value such as `[]` starts, spaces after its key included: a list turned into
  // lines below its key leaves no trailing space.
  afterKey(node) {
    let i = node.range[0];
    while (i > 0 && this.src[i - 1] === ' ') i--;
    return i;
  }

  edit(start, end, text) {
    // Insertions at the same point follow each other, in the order they were asked for.
    const same = start === end && this.edits.find((e) => !e.made && e.start === start && e.end === start);
    if (same) same.text += text;
    else this.edits.push({ start, end, text });
  }

  projectMap() {
    const project = this.section('project')?.value;
    if (!YAML.isMap(project) || project.flow || !project.items.length) throw new EditRefused('project is not written as a block of keys');
    return project;
  }

  // Sets project.<key>, in place when it exists (an inline comment stays), after the last key otherwise.
  setProject(key, value) {
    const project = this.projectMap();
    const pair = project.items.find((p) => keyOf(p) === key);
    if (pair) {
      if (!pair.value?.range) throw new EditRefused(`project.${key} has no value to replace`);
      this.edit(pair.value.range[0], pair.value.range[1], yamlValue(value));
    } else {
      const last = project.items[project.items.length - 1];
      if (!last.value?.range) throw new EditRefused('the last key of project has no value');
      const at = this.lineEnd(last.value.range[1]);
      this.edit(at, at, `\n${this.indentOf(last.key.range[0])}${key}: ${yamlValue(value)}`);
    }
    this.expected.project[key] = value;
  }

  // Removes the line of project.<key>.
  removeProject(key) {
    const pair = this.projectMap().items.find((p) => keyOf(p) === key);
    if (!pair) return;
    if (!pair.value?.range) throw new EditRefused(`project.${key} has no value`);
    const start = this.lineStart(pair.key.range[0]);
    const end = this.lineEnd(pair.value.range[1]);
    this.edit(start, Math.min(end + 1, this.src.length), '');
    delete this.expected.project[key];
  }

  // Sets one key of a one-line entry, such as a task, found by id. A new key goes after the first of
  // `after` that the entry has, so ids and days stay up front.
  setField(sectionKey, id, key, value, after = ['id']) {
    const seq = this.section(sectionKey)?.value;
    const item = YAML.isSeq(seq) ? seq.items.find((m) => YAML.isMap(m) && m.get('id') === id) : null;
    if (!item) throw new EditRefused(`${id} not found in ${sectionKey}`);
    if (!item.flow) throw new EditRefused(`${id} is not written on one line`);
    const pair = item.items.find((p) => keyOf(p) === key);
    if (pair) {
      if (!pair.value?.range) throw new EditRefused(`${id}: ${key} has no value to replace`);
      this.edit(pair.value.range[0], pair.value.range[1], yamlValue(value));
    } else {
      const anchor = after.map((k) => item.items.find((p) => keyOf(p) === k)).find(Boolean) ?? item.items[item.items.length - 1];
      if (!anchor?.value?.range) throw new EditRefused(`${id}: no place to add ${key}`);
      this.edit(anchor.value.range[1], anchor.value.range[1], `, ${key}: ${yamlValue(value)}`);
    }
    this.expected[sectionKey].find((x) => x?.id === id)[key] = value;
  }

  // Replaces a whole list with one-line entries. A missing list is added before the section `before`
  // and the comment block above it.
  replaceList(key, items, { before } = {}) {
    const lines = items.map(yamlValue);
    const pair = this.section(key);
    if (pair) {
      const seq = pair.value;
      if (!YAML.isSeq(seq) || !seq.range) throw new EditRefused(`${key} is not a list`);
      if (seq.flow) {
        if (lines.length) this.edit(this.afterKey(seq), seq.range[1], lines.map((l) => `\n  - ${l}`).join(''));
        else this.edit(seq.range[0], seq.range[1], '[]');
      } else {
        // Up to the end of the last entry: the list's own range runs on over the blank lines after it.
        const end = seq.items.length ? seq.items[seq.items.length - 1].range[1] : seq.range[1];
        const indent = this.indentOf(seq.range[0]);
        this.edit(seq.range[0], end, lines.length ? lines.map((l) => `- ${l}`).join(`\n${indent}`) : '[]');
      }
    } else {
      const next = before && this.section(before);
      let at = next ? this.lineStart(next.key.range[0]) : this.src.length;
      while (next && at > 0) {
        const prev = this.lineStart(at - 1);
        if (!/^\s*#/.test(this.src.slice(prev, at - 1))) break;
        at = prev;
      }
      const block = `${key}:${lines.length ? lines.map((l) => `\n  - ${l}`).join('') : ' []'}\n`;
      this.edit(at, at, next ? `${block}\n` : `${this.src.endsWith('\n') ? '' : '\n'}\n${block}`);
    }
    this.expected[key] = structuredClone(items);
  }

  // Replaces the one-line entry whose `key` is `value`, or adds it at the end of the list.
  upsert(sectionKey, key, value, item) {
    const seq = this.section(sectionKey)?.value;
    const index = YAML.isSeq(seq) ? seq.items.findIndex((m) => YAML.isMap(m) && String(m.get(key)) === String(value)) : -1;
    if (index < 0) return this.append(sectionKey, item);
    const node = seq.items[index];
    if (!node.flow || !node.range) throw new EditRefused(`the ${sectionKey} entry of ${value} is not written on one line`);
    this.edit(node.range[0], node.range[1], yamlValue(item));
    this.expected[sectionKey][index] = structuredClone(item);
  }

  // Adds a one-line entry at the end of a list, creating the list at the end of the file if needed.
  append(key, item) {
    const pair = this.section(key);
    const seq = pair?.value;
    if (pair && (!YAML.isSeq(seq) || !seq.range)) throw new EditRefused(`${key} is not a list`);
    if (pair && seq.flow && seq.items.length) throw new EditRefused(`${key} is written on one line`);
    this.expected[key] = [...(this.expected[key] ?? []), structuredClone(item)];
    if (pair && !seq.flow) {
      const last = seq.items[seq.items.length - 1];
      const at = this.lineEnd(last.range[1]);
      this.edit(at, at, `\n${this.indentOf(seq.range[0])}- ${yamlValue(item)}`);
      return;
    }
    // A list that is empty (`[]`) or missing: its new lines grow with each entry added in this edit.
    this.made ??= new Map();
    let made = this.made.get(key);
    if (!made) {
      made = pair
        ? { items: [], edit: { start: this.afterKey(seq), end: seq.range[1], made: true }, wrap: (lines) => lines }
        : { items: [], edit: { start: this.src.length, end: this.src.length, made: true }, wrap: (lines) => `${this.src.endsWith('\n') ? '' : '\n'}\n${key}:${lines}\n` };
      this.made.set(key, made);
      this.edits.push(made.edit);
    }
    made.items.push(item);
    made.edit.text = made.wrap(made.items.map((x) => `\n  - ${yamlValue(x)}`).join(''));
  }

  // The edited text, once it reads back as the expected data.
  toString() {
    const edits = [...this.edits].sort((a, c) => a.start - c.start || a.end - c.end);
    for (let i = 1; i < edits.length; i++) {
      if (edits[i].start < edits[i - 1].end || (edits[i].start === edits[i - 1].start && edits[i].end === edits[i - 1].end)) {
        throw new EditRefused('two changes touch the same place in the file');
      }
    }
    let out = this.src;
    for (const e of edits.reverse()) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    let back;
    try { back = YAML.parse(out); } catch (e) { throw new EditRefused(`the edited file would not parse: ${e.message}`); }
    if (!isDeepStrictEqual(back, this.expected)) throw new EditRefused('the edited file would not read back as intended');
    return this.eol === '\n' ? out : out.replace(/\n/g, this.eol);
  }
}
