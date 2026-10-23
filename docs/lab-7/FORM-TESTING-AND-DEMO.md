# Lab 7: From empty fields to saved records

This guide helps the group demonstrate form controls, validation, accessibility, and data handling. It adds documentation only; application behavior is unchanged.

## Before recording

- Use fictional information and the same browser throughout the demo.
- Run the project and confirm all four navigation entries open.
- Prepare an unused fictional staff email and company name to avoid accidental duplicate errors in successful examples.
- Allow time for map tiles to load and select the required location pins.
- PHS uploads deliberately insert the original fixed dummy applicant values. Review and correct them against the uploaded document; do not describe this as OCR or PHS text extraction.
- Records are browser-local: localStorage stores records, and IndexedDB stores attached files. The interface does not send verification emails or implement production authentication.

## Manual acceptance checklist

All cases below are **Not tested** until a group member runs them. Replace the status with Pass or Fail and record the tester, date, and screenshot filename. A written test case is not evidence that a test passed.

| ID | Form | Action | Expected result | Status |
| --- | --- | --- | --- | --- |
| A1 | Applicant intake | Upload a supported PHS file and open verification. | Fixed fictional fields and history rows appear; source document remains available for comparison. | Not tested |
| A2 | Applicant intake | Clear the first name and try to continue. | Required-field error; completion is blocked. | Not tested |
| A3 | Applicant intake | Enter a future birth date. | Validation blocks progression and identifies the date problem. | Not tested |
| A4 | Applicant intake | Leave verification unchecked. | Cannot proceed to completion. | Not tested |
| A5 | Applicant intake | Complete valid details but omit the home pin or consent. | Saving is blocked. | Not tested |
| A6 | Applicant intake | Complete all required details, verification, pin, and consent; save. | Saved confirmation; application remains submitted with documents pending verification. | Not tested |
| S1 | Staff registration | Submit an empty form. | Required inputs prevent saving. | Not tested |
| S2 | Staff registration | Enter an invalid email or contact number. | Invalid format prevents saving. | Not tested |
| S3 | Staff registration | Enter valid fictional details, role, and home pin; save. | Confirmation reports pending email verification; no email delivery is claimed. | Not tested |
| S4 | Staff registration | Reuse the saved staff email. | Duplicate email is rejected. | Not tested |
| D1 | Deployment | Select a site and inspect available posts. | Posts belong to the selected site. | Not tested |
| D2 | Deployment | Enter a duty ending before it starts. | Save is blocked with a time-order error. | Not tested |
| D3 | Deployment | Add two overlapping duty rows for the same guard. | Conflicting duties are rejected. | Not tested |
| D4 | Deployment | Save a valid authorized duty, select its deployment, and add an adjacent duty. | Both duties appear under the same deployment without a duplicate deployment. | Not tested |
| C1 | Client/site | Submit with a required company, contact, site, or post field empty. | Required fields prevent saving. | Not tested |
| C2 | Client/site | Enter an invalid contact email or phone number. | Format validation prevents saving. | Not tested |
| C3 | Client/site | Set required guards to 0, 1.5, or 1000. | Only whole numbers from 1 through 999 are accepted. | Not tested |
| C4 | Client/site | Complete written details without a site pin. | A location error blocks saving. | Not tested |
| C5 | Client/site | Save valid fictional client/site/post details and a pin. | Confirmation appears; new site and post are available in deployment. | Not tested |
| C6 | Client/site | Register the same company name again. | Duplicate company is rejected. | Not tested |

For D4, choose dates covered by the selected DDO and the guard's license. An overnight duty must explicitly end on the next date. Use a post with available staffing capacity.

## Accessibility and persistence checks

| Check | How to verify | Status |
| --- | --- | --- |
| Labels | Each editable input has a meaningful visible label. | Not tested |
| Keyboard | Use Tab and Shift+Tab through controls; use Enter/Space where appropriate and check visible focus. | Not tested |
| Error recovery | Trigger an error, correct it, and submit again without reloading. | Not tested |
| Confirmation dialog | Confirm focus is inside the success dialog, background interaction is blocked, and Done/Escape dismisses it. | Not tested |
| Persistence | After a client/site save, reload and confirm its site/post remain selectable in deployment. | Not tested |
| Responsive layout | Check a narrow viewport for clipped labels, unusable buttons, and horizontal overflow. | Not tested |

## Client and site validation summary

Use this section to complete the missing validation rules in the group's write-up:

1. Company name, business address, contact person/number, site name/address, region code, and post name are required.
2. Contact phone accepts 7–30 characters from digits, spaces, parentheses, plus, and hyphen; email must have a valid format when supplied.
3. Text fields enforce their configured maximum lengths.
4. Required guards must be a whole number between 1 and 999.
5. A site pin must contain finite latitude/longitude within geographic bounds.
6. Company names are checked for duplicates without case differences.
7. A successful save creates the linked client, site, and initial post together in the local store.

## Three-minute demo outline

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:15 | Project title and four navigation entries. | Name the two major and two supporting forms using the group's agreed classification. |
| 0:15–1:00 | Applicant source preview, fixed sample values, one required-field error, and explicit verification. | Uploaded originals support manual review; validation blocks incomplete information. |
| 1:00–1:30 | Staff form, invalid email, then valid registration. | Labels, role selection, location pin, and pending-verification status. |
| 1:30–2:05 | Client/site form, invalid guard count, valid save. | Ten editable data inputs plus map; linked site/post creation. |
| 2:05–2:45 | Deployment using the new site, invalid duty interval, then valid authorized save. | Dependent selections, authorization, schedule validation, and saved duties. |
| 2:45–3:00 | Reload and show persisted site/post; repository contribution history. | Browser-local persistence and group collaboration. |

Prepare valid values in advance, but capture real interactions and outcomes. Do not edit the video to imply an untested action succeeded.

## Submission evidence

- Capture every form plus representative error states and successful results using fictional data.
- List actual individual controls in the PDF; section headings are not input controls. Record maps separately from native HTML controls.
- Include form purposes, controls, validation rules, a directory-structure screenshot, and the repository link in the PDF.
- Include the 2–4 minute video and required screenshots in the group's submission.
- Verify that each member's contribution is represented in Git history and list every member in the submission comments.
- Review filenames and open every deliverable before the group's single Canvas submission.

Suggested evidence filenames: `applicant-verification.png`, `applicant-required-error.png`, `staff-invalid-email.png`, `client-guard-limit.png`, `deployment-time-error.png`, and `saved-record-confirmation.png`.

## Automated checks

Run separately from the project root:

```sh
pnpm test
node scripts/test-phs-validation.mjs
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Record the output and distinguish failures from checks that could not run. Passing automated checks does not replace manual keyboard, map, upload, and browser testing.
