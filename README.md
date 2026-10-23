# Red Eagle management UI

React interface for applicant intake, staff account registration, guard deployment and scheduling, and client/site registration. Uses the existing Vinext/Vite scaffold. Node 22.13+ and pnpm are required.

## Run locally

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by the server. The current workspace preview uses http://127.0.0.1:3000/.

```sh
pnpm exec tsc --noEmit
pnpm build
```

## Implemented flows

Successful saves in all four active forms open an accessible native modal confirmation instead of an inline success banner. Client/site save details appear inside the dialog rather than adding a summary card to the page. Done or Escape dismisses the dialog; background interaction is blocked and page scrolling is locked while it is open. Validation errors remain in the form. Applicant submission remains protected against repeat saves after dismissing its confirmation.

- Applicant intake: upload PHS pages or labeled text documents, autofill supported TXT fields and repeating sections, manually verify alongside the original, pin home location, attach supporting requirements, and save the application. No Tesseract or OCR integration is included. Unspecified fields remain blank; administrative remarks and verification remain manual.
- Deployment and scheduling: create a deployment or select an existing one, then add multiple dated duty rows (start, end and rest-day indicator). Existing deployment details are displayed as context, not re-entered. Validates DDO authorization, license validity, deployment containment, overlaps with saved duties across all posts, conflicts within new rows, and concurrent post capacity. Adjacent shifts and overnight shifts with an explicit next-day end are supported. An overlapping deployment period alone does not block a duty. Saved duties appear beneath the form; the form can append further duties to the same deployment without duplicating it.
- Client/site registration: ten editable inputs plus required site map pinning create a linked client, first site and initial post. The pin is saved in `site_location` as latitude/longitude alongside the written address. The new site/post become available for deployment. Validates required fields, location selection, email, contact number, duplicate company names and guard counts. Clearing or saving resets the map pin.
- Staff account registration: nine editable fields cover person details, email and assigned administrative role; home-location pinning is additional. Rejects invalid/future birth dates, malformed contacts/emails, duplicate staff identity/email and missing map pins. Records remain pending email verification. No verification email is actually sent by this local implementation.
- Equipment issuance, equipment return and guard attendance have been removed from the active navigation, as requested. Their earlier source files remain available for future reuse.

## Data and integration

Fixtures in `app/domain.ts` supply session, Operations, DDO, requests and initial inventory data. Browser-local records share one versioned localStorage store; image/document blobs use IndexedDB. No production API, actual authentication/RBAC, PostgreSQL or server-side verification has been connected.

Camera and location need browser permission and HTTPS (or localhost). The application embeds capture metadata into the JPEG and extracts it back for the attendance event. This is application-written EXIF, not firmware EXIF. Server receipt time and verification must be added before use for payroll.

The map uses Leaflet and OpenStreetMap tiles with attribution. No typed home address is sent to a geocoding service.

Read `DOCUMENT-ALIGNMENT.md` for source references, ERD mappings, schema gaps, implementation decisions and remaining backend work. The original generated npm lockfile was replaced by the authoritative `pnpm-lock.yaml` so installs use a single package manager.
# soft-eng-form-control

## Text-document samples and autofill

Applicant intake now reads labeled `.txt` documents locally, including PHS fields/history rows and supporting-document numbers and dates. Three fictional applicant sets are downloadable from the upload screen. See [sample instructions and format](public/samples/README.md). PDF/image uploads remain supported for manual entry; uploads no longer insert the same fixed sample applicant.

Run `pnpm test` for text-document regression tests and the existing scheduling checks. No new dependency is required. Existing saved records with `dummy` provenance remain readable; new intakes record `text` or `manual` provenance.
