# Document and ERD alignment review

## Text-document contribution (original PHS prefill retained)

Applicant intake accepts TXT files for preview, while every PHS upload retains the original fixed sample values and repeating sections. PHS contents do not autofill applicant details. Supporting TXT attachments can populate document numbers and dates. Fictional samples are in `public/samples/`. Verification, consent, home pinning, and HR remarks stay manual. New intake provenance remains `dummy`.

## Current form selection update

### Multiple duties and site pinning update

Deployment creation retains the nine original data inputs (plus the deployment selector); duty rows can be added or removed. Choosing an existing deployment displays its guard/site/post/period/DDO as read-only context and adds shifts to that deployment instead of creating another deployment for every shift. One deployment therefore has many `shift_assignments`. Conflict detection uses actual duty intervals across the guard’s deployments and within the submitted batch, not deployment periods. Adjacent shifts are allowed, overnight shifts require the next date, shifts must fit the deployment and DDO assignment, and staffing limits use maximum concurrent occupancy. Saves revalidate against the current local store and append the entire batch together. No automatic recurrence or minimum-rest policy is assumed.

Site registration now requires written `site_address` plus a Leaflet map pin. The frontend stores `site_location: { latitude, longitude }` on the client-site record; map these to the ERD’s site latitude/longitude columns when adding the backend. Existing records without coordinates remain readable. The shared map now uses context-specific Home location / Site location labels, including accessible map instructions. This supersedes the earlier no-site-map decision below.

The latest selection replaces Equipment Issuance with **Staff Account Registration**. The four active forms are now Applicant Intake, Staff Account Registration, Guard Deployment & Scheduling, and Client & Site Registration. The older logistics/attendance reviews below are historical references.

Staff registration follows `person → user → role` in Figure 89 (printed p. 103). It has nine editable native inputs, excluding map controls and buttons: first/middle/last name, suffix, birth date, home address, contact number, email, assigned role. Role options are HR, Finance, Operations and Logistics. The represented operator is Super Admin. New records receive generated identifiers, creation metadata and `pending_email_verification` status; no user can manually activate an unverified account through this form. Duplicate email/name-and-birth-date checks run against existing local staff records. Production role authorization, credential setup and verification-email delivery remain backend work. No email is sent by the UI.

The PHS dummy dataset now populates 78 of 82 fields plus siblings, dependents, seminars/training, employment history and three character references. Identifier values are explicitly fictional SAMPLE values. An unused name suffix and non-applicable military-service dates stay blank. Prefill never checks the admin verification/consent checkboxes or writes HR remarks. Uploading replacement source pages resets prefill, repeating rows, the home pin, and verification so the previous applicant's values do not leak into the new upload.

Per the latest user request, Equipment Return and Guard Attendance were replaced in the active UI by **Guard Deployment & Scheduling** and **Client & Site Registration**. Applicant Intake and Equipment Issuance remain available. Attendance/return details below describe the earlier implementation and are retained as reference, not the current navigation.

Deployment has **9 editable input controls**, excluding buttons: guard, client site, post, DDO, deployment start/end, shift start/end, rest-day checkbox. Client/site registration has **10 editable input controls**, excluding buttons: company name, business address, contact person, phone, email, site name, site address, region code, post name, required guards. No extra hidden or read-only inputs were introduced to reach those counts.

These forms follow Figure 91 (printed p. 105) and Figure 92 (printed p. 106): `client → client_site → post → deployment → shift_assignments`, with `ddo_assignment` linking the deployment to `duty_detail_orders`. Client registration creates the client/site/post together in the local shared store. Deployment saves a deployment, one shift assignment and a DDO assignment together. The new site and post are immediately selectable in the deployment form and survive page reloads.

The deployment end is optional because the ERD allows `end_at` to be null. All input dates are interpreted explicitly as Philippine time. The guard must be active with a valid security license; the post must belong to the selected site; shifts must lie inside the deployment; DDO validity must cover the assignment; conflicting active guard deployments and fully staffed overlapping shifts are blocked. DDO options are existing seeded records, not newly created DDOs. Production validation still belongs on the backend.

Site latitude/longitude are nullable in the ERD and are not forced into this ten-input registration form. The user's separately requested home-address map remains in applicant intake.

Reviewed against the supplied SGS SOFT ENG 1.pdf, the three supplied PHS examples, and the subsequent user instructions. References below use printed document page numbers, not PDF page indexes. Scope: the four implemented UI modules and their links to Operations, Security, and Payroll.

## Applicant intake

Source: printed pp. 11, 36–39; Figures 6, 6.1, 7, 8, 89 and 90 (ERD pp. 103–104).

- The previous intake began with manual fields. It now starts with the original PHS upload, then admin verification alongside the original pages, followed by home-location pinning, supporting requirements, and HR remarks.
- Per the user's latest instruction, uploading a PHS supplies fixed sample values. No Tesseract, OCR execution, model download, or extraction service is present. The UI identifies the sample prefill, and the stored intake metadata identifies its source as `dummy`.
- Original PHS files are retained locally in IndexedDB. Editing verification fields does not alter the original images.
- The verification fields follow the sample PHS: application and identification; personal details; family and emergency contact; education and skills; employment and military/police service; declarations; and repeating siblings, dependents, seminars, employment history, and character references.
- `person` core fields are kept separate from the application, PHS details, supporting documents, and admin remarks. Names include middle name and suffix; birth date and contact number follow the ERD. Age is not entered separately because it can be derived from birth date.
- An intake submission creates a submitted application, not an employee or an activated account. It does not automatically endorse or reject an applicant. Uploaded documents remain pending verification. Account creation/email verification belongs to Super Admin after the relevant review flow.
- The requirements list now includes the previously omitted drug test, neuro-psychiatric test, prior employment certificate, seminar/achievement certificates, consent document, and separate license front/back pages. Requirements may be added progressively; the application is submitted, not marked complete/verified just because it was saved.
- HR remarks are separate from applicant declarations. Fingerprints and the handwritten signature remain in the original scan; the UI does not manufacture or extract biometric records.

### Schema additions needed

The `person` ERD stores `home_address` as text. The user's map requirement needs coordinate fields or an address/location child table. The frontend keeps the new coordinates explicitly in `home_location`; a backend migration is still required.

The ERD also lacks structured storage for many fields printed on the supplied PHS, including family, education, emergency contacts, government IDs, employment history, character references, and declarations. The frontend retains them in `phs_data`. Decide between a versioned PHS JSON record and normalized child tables before wiring a backend. They should not be silently discarded or stored in unrelated `person` columns.

Original document storage also needs the file entity referenced by `file_id`. That entity is referenced across the diagrams but not defined on the ERD pages reviewed here.

## Attendance

Source: printed pp. 12, 17, 62–64; Figure 31 and Guard ERD Figure 93 (p. 107).

- Guard identity is derived from the current guard context, not a selector for another employee.
- Site/post and scheduled start/end derive from `shift_assignments → deployment → post → client_site`. The guard does not edit these or invent a shift.
- Date, time, location, and device details are no longer typed into the form. The next action derives from the current shift's event history: time in, then time out, then completed. Duplicate/out-of-order submissions are checked again when saving.
- Per the user's explicit change to the document's image-upload flow, duty evidence uses live camera capture only. There is no duty-photo file picker.
- Camera capture obtains a fresh browser location sample, then records a JPEG frame. The app writes capture timestamp, GPS coordinates, camera label, and image dimensions into EXIF and reads the embedded metadata back. Metadata source is recorded as application-written EXIF, not native camera firmware EXIF.
- Accuracy, location sample time, browser/device settings, the image blob, and parsed photo metadata are preserved. Camera/location failures are shown and submission remains blocked. A capture older than five minutes must be retaken (an implementation freshness rule, not a numeric rule specified in the PDF).
- Attendance remains pending verification. Verified hours, lateness, overtime, and payroll eligibility are not calculated from an unverified local capture.
- Corrections and attendance disputes require an authorized review flow; no guard-editable historical timestamp is supplied.

### Server work still needed

The browser uses fixture session/assignment data and local records. It is not an authentication or authorization service. A backend must resolve employee/shift ownership from authenticated identity, validate the active deployment and shift, store the canonical `dtr_records` and `dtr_events`, issue `received_at`, enforce duplicate/sequence checks transactionally, and perform attendance verification before Payroll uses a DTR.

`received_at` is deliberately null in the local event because no server received the record. It must be a server timestamp when connected; the ERD marks it NOT NULL. Browser timestamps and application-written GPS/EXIF alone are not proof against device clock or location tampering.

Figure 93 calls the entity `dtr_records`; Figure 95 calls it `dtr_record` and adds verification/hour fields. Reconcile the canonical table name and field set before database implementation. Capture timestamps and EXIF strings retain their UTC source; the UI displays Philippine time.

## Equipment issuance

Source: printed pp. 12, 57–58; Figures 25, 25.1, 91, 92, 94.

- Issuance now begins with `equipment_request`/`equipment_request_items`, linked to `ddo_assignment` and the authorized deployment. Guard, DDO, site/post, requested quantity, and assignment schedule derive from that request context.
- No assignment schedule, guard, or site is presented as an already-selected unrelated default. Context remains blank until a request is selected.
- Assets filter by request category and current availability. Serial number and condition come from the asset, not a free-text replacement.
- Guard/license, DDO, availability, and firearm-registration/personnel-license checks determine whether confirmation is blocked. An expired firearm registration and missing verified personnel firearm license hold the firearm fixture. The previous unconditional 4/4 success panel was removed.
- The three-month expiry warning is represented for near-expiry registrations. Persistence of notifications to Operations/Super Admin still requires the backend/notification module.
- Issued time is generated at confirmation and is distinct from the Operations shift schedule. Receipt number and a signed receipt are collected. Acknowledgment is not prechecked.
- Each serialized equipment issuance represents one asset. The previous arbitrary quantity, editable deployment, and expected-return-date input were removed because those do not map to the illustrated `equipment_issuance` entity.
- The fixture inventory changes to issued when an issuance is stored, and fulfilled requests disappear from the pending list. Return processing uses the same issuance/inventory state.

The diagram contains `receipt_number`, but no `receipt_file_id` on equipment issuance. Retaining the signed receipt requires an explicit file relation or document attachment entity; the frontend keeps that relation as a proposed extension.

## Equipment return

Source: printed p. 59, Figure 26, and Logistics ERD Figure 94 (p. 108).

- The form starts with an outstanding issuance. Guard, asset, serial, issue date, and receipt derive from it.
- The operator enters `observed_asset_tag`, `observed_condition`, condition/incident notes, and ammunition returned when a firearm applies. Processing identity/time derive from the officer context and confirmation.
- Disposition is derived: intact → available; damaged → damaged/incident review; lost → missing/incident review. An observed asset mismatch is held for review and the original asset is not returned to available stock.
- Non-intact or mismatched returns require details. Incident records remain pending review. Negligence, repair actions, and financial charges are not automatically decided by the form.
- Original issuance references and return IDs are retained; already-processed returns cannot be submitted again.

## UI and implementation limits

- This is the local React implementation. Fixtures supply the session, deployment, DDO, request, and inventory records. The header reflects the role represented by each module but switching modules does not implement real RBAC.
- Records use local browser storage and files use IndexedDB. No Django/PostgreSQL API, secure production file store, server transaction, or audit/notification service has been connected.
- Map tiles use OpenStreetMap with attribution. Pinning stores coordinates without sending the typed home address to a geocoding service.
- Existing school/control-count annotations remain removed. Derived context is displayed as context rather than editable controls merely to inflate a control count. The original assignment's count may require instructor clarification for a self-service attendance flow with automatic capture.

## Verification

- TypeScript and production build checked after implementation.
- Browser checked PHS upload with a supplied blank example, dummy prefill, original-page preview, verification-to-requirements progression, and map pin placement.
- Browser checked blank issuance context before request selection, automatic DDO/guard/schedule derivation, expired firearm registration and missing-license hold, and asset-mismatch return disposition. These checks did not issue real equipment or submit real personnel records.
- JPEG metadata encoding/decoding was tested with a generated fixture: timestamp, camera label, dimensions, and latitude/longitude round-trip correctly in both hemispheres. This checks the metadata implementation, not physical camera permission or GPS hardware.
- Physical camera/location permission and end-to-end real-device photo capture require a user-controlled device check; they are not claimed as completed hardware tests.
