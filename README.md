# Red Eagle Security Management System

React application for applicant intake, administrative staff registration, client and site registration, and guard deployment and scheduling.

## Requirements

- Node.js 22.13 or later
- pnpm 11.25

## Development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed in the terminal.

## Checks and build

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

## Forms

- Applicant intake: upload PHS pages, review and correct the applicant information, confirm verification, pinpoint the home address, attach supporting documents, and save the application.
- Staff registration: record personal and contact details, select an administrative role, pinpoint the home address, and save a pending-verification account.
- Client and site registration: create linked client, site and post records with a written address, map coordinates and required guard count.
- Deployment and scheduling: create a deployment or select an existing one and add multiple duty shifts. Validation checks authorization, date ranges, overlaps and post capacity.

The forms provide labels, helper text, required and format validation, keyboard navigation and modal save confirmations. Map tiles use Leaflet and OpenStreetMap with attribution.

## Data storage

Records are stored in browser localStorage and uploaded files in IndexedDB. The application does not connect to a production database or send verification emails.

The current local version uses predefined applicant, guard, site and Duty Detail Order records. PHS uploads retain the predefined applicant values for manual review; image OCR is not implemented. Supporting TXT documents can supply document numbers and dates. This behavior is retained for the existing intake workflow.

## Project structure

- `app/`: forms, shared UI, validation, map selection and browser storage.
- `scripts/`: validation tests and required development/runtime helpers.
- `tests/fixtures/`: text documents used by automated parser tests; not publicly served.
- `public/`: browser assets.
- `worker/`: server request handler.
- `docs/`: project testing and submission notes.

The database examples, unused connector preview and downloadable sample library are not part of the application.
