# Fieldbook: functional specification

Harbor & Pine, facilities cooperative. Version 1.2, 15 September 2026. Fictional document, written for the solopilot demo.

## 1. Context

Harbor & Pine looks after about 140 sites for its members (offices, schools, small warehouses) in three regions. Inspectors visit each building on a schedule and fill in paper checklists: fire safety, electrical installations, accessibility, general condition. The sheets are typed in at the office, sometimes weeks later, and findings get lost on the way.

Fieldbook replaces the paper. Inspectors run their checklists on a phone or a tablet, on site, and managers see the findings as soon as they are submitted. Many plant rooms and basements have no network: the app must work there.

The winter inspection campaign starts in December. Fieldbook must be in production before it.

## 2. Users

- **Inspectors** run inspections on site. They work alone, often with gloves, sometimes in poor light.
- **Managers** plan the inspections of their region and follow up on findings.
- **Administrators** (two people at head office) manage checklists and users.

The exact list of roles, and what each one may see, is still to be confirmed with the HR department.

## 3. Accounts

### 3.1 Signing in

No passwords: inspectors forget them, and the devices are shared. A person signs in with a link sent to their work email address. The link expires after 15 minutes.

### 3.2 Access by region

A person only sees the sites of their region, except administrators, who see everything.

### 3.3 Single sign-on

Once the cooperative moves to a single directory, next year, signing in with the members' directory would be welcome. Not needed for the launch.

## 4. Sites and buildings

Each site has an address, a city, a region and one or more buildings. Each building has a type (office, school, warehouse) that decides which checklists apply.

The list of sites and buildings comes from the cooperative's spreadsheet, which Harbor & Pine will send before development starts. Inspectors find a site by its name or its city.

## 5. Checklists and inspections

### 5.1 Checklists

A checklist is a list of items grouped in sections, for a building type. Checklists change every year with the regulations: when a checklist changes, a new version is published.

The current checklists are paper forms. Harbor & Pine will send a sample of the forms used on its three largest sites, filled in, so that the app can be tried on real content.

### 5.2 Running an inspection

The inspector picks a building, starts the inspection and goes through the items. For each item: compliant, not compliant, or not applicable. A non-compliant item becomes a finding, with a severity, a note and photos. The inspector can stop and come back later; nothing is lost if the phone rings or the app is closed. At the end, the inspector submits the inspection.

Photos are taken with the device's camera, several per finding. They are kept with the inspection.

### 5.3 Traceability

Every change to an inspection is recorded: who, when, what. A submitted inspection is final.

During interviews, two managers explained that they sometimes send an inspection back to the inspector for a correction (a wrong severity, a missing photo). How this fits with final inspections was not discussed.

### 5.4 Reminders

Inspectors should be reminded of inspections that are overdue, by a notification on their phone. Nice to have.

## 6. Working offline

Inspectors must be able to run a whole day of inspections without network. Before leaving, the app keeps on the device everything the day needs: the sites, the buildings, the checklists. Inspections and photos taken offline are sent as soon as the network comes back, without the inspector having to think about it. The inspector can see what is still waiting to be sent.

## 7. Reports and follow-up

### 7.1 Inspection report

Each submitted inspection produces a PDF report, sent to the manager of the site. What page one must show is to be decided with the board of the cooperative.

### 7.2 Findings dashboard

Managers see the open findings of their region, by site and by severity.

### 7.3 Exports

Managers can export the findings as a CSV file, for the members' annual meetings. Each manager also receives a monthly summary by email.

## 8. Administration

### 8.1 Checklist editor

Administrators create and edit checklists: sections, items, the building types they apply to. Publishing a checklist creates a new version.

### 8.2 Users

Administrators invite people by email and give them a role and a region.

Raw data (sites, buildings, inspections) must stay editable by administrators in a simple back office, for corrections.

## 9. Hosting and launch

Fieldbook is hosted by the cooperative's IT provider, who will provide a staging server, the domain and its certificate. The design team of Harbor & Pine draws the screens; the sign-in and the site list are ready (see the mockups), the inspection screens will follow.

The app must be usable on a mid-range phone, in poor light, with one hand.

## 10. Out of scope

- Native apps in the app stores: an app installed from the browser is enough.
- Any link with the cooperative's maintenance software. Findings are followed up in Fieldbook only.
- Invoicing the members for inspections.
- Other languages than English.
