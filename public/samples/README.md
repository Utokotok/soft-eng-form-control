# Fictional text documents

All nine `.txt` files are samples, not official documents. Each applicant has a PHS, license, and clearance. Download them from Applicant intake or use the files in this folder.

1. Upload one applicant's `*-phs.txt` under **Select PHS pages**.
2. Open **Verify information**. Compare the original text with the editable fields and history rows, then explicitly confirm verification.
3. Continue, pin a home location, and add a requirement. Choose **Security license — front** or **PNP / NBI clearance**, then upload the matching TXT file. Check the populated metadata.
4. Complete consent and save. The saved application and documents remain pending review. Repeat with a different applicant to demonstrate content-based extraction.

## Format

Use UTF-8 text, one `Label: value` per line. Blank lines and lines starting with `#` are ignored. Dates use `YYYY-MM-DD`. Text files are limited to 256 KB; existing PDF/image limits remain 10 MB.

PHS fields accept the keys in `app/phs-fields.ts` (for example, `first_name`) or their displayed labels (for example, `First name`). Use field keys where a displayed label is repeated, such as `elementary_year` and `secondary_year`. The first occurrence of a field is retained; later duplicates produce a warning. Unknown labels and invalid values produce warnings and are not applied. Missing fields stay blank.

Repeating rows use the group key and pipe-separated cells, in the order shown by the form:

```text
siblings: Name | Age | Address | Occupation
dependents: Name | Relationship | Age
seminars: Inclusive dates | Course title | Date graduated | Awards / commendations
employment: Employer | Inclusive dates | Position | Salary received
references: Name | Address | Occupation
```

Repeat a group line to add another row (up to 50 per group). A pipe cannot appear inside a cell. Regular field values can contain colons.

Supporting documents recognize `Document number`, `Issued on`, and `Expires on`. Other metadata is entered manually. TXT parsing does not authenticate a document or check its owner. PDF/JPG/PNG files still attach and preview as before; their contents require manual entry, with no fixed sample prefill or OCR.

Uploads are read locally using the browser File API, never executed. Verification, administrative remarks, consent, and map pins are never inferred from file contents. Replacing the PHS clears applicant-specific state and supporting attachments.
