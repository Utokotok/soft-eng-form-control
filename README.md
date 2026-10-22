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

- Applicant intake: upload PHS pages, insert dummy sample values into 78 of 82 fields and all five repeating sections, manually verify alongside the original, pin home location, attach supporting requirements, and save the application. No Tesseract or OCR integration is included. Non-applicable military-service dates and the sample's unused suffix remain blank; administrative remarks and verification remain manual.
- Deployment and scheduling: nine editable inputs collect guard, site, post, DDO, deployment dates, shift dates, and a rest-day indicator. Validates DDO coverage, date containment, overlapping deployments and staffing limits.
- Client/site registration: ten editable inputs create a linked client, first site and initial post. The new site/post become available for deployment. Validates required fields, email, contact number, duplicate company names and guard counts.
- Staff account registration: nine editable fields cover person details, email and assigned administrative role; home-location pinning is additional. Rejects invalid/future birth dates, malformed contacts/emails, duplicate staff identity/email and missing map pins. Records remain pending email verification. No verification email is actually sent by this local implementation.
- Equipment issuance, equipment return and guard attendance have been removed from the active navigation, as requested. Their earlier source files remain available for future reuse.

## Data and integration

Fixtures in `app/domain.ts` supply session, Operations, DDO, requests and initial inventory data. Browser-local records share one versioned localStorage store; image/document blobs use IndexedDB. No production API, actual authentication/RBAC, PostgreSQL or server-side verification has been connected.

Camera and location need browser permission and HTTPS (or localhost). The application embeds capture metadata into the JPEG and extracts it back for the attendance event. This is application-written EXIF, not firmware EXIF. Server receipt time and verification must be added before use for payroll.

The map uses Leaflet and OpenStreetMap tiles with attribution. No typed home address is sent to a geocoding service.

Read `DOCUMENT-ALIGNMENT.md` for source references, ERD mappings, schema gaps, implementation decisions and remaining backend work. The original generated npm lockfile was replaced by the authoritative `pnpm-lock.yaml` so installs use a single package manager.
# soft-eng-form-control
