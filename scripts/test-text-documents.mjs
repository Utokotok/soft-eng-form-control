import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`;
const fieldsUrl = moduleUrl(await readFile(new URL("../app/phs-fields.ts", import.meta.url), "utf8"));
const source = (await readFile(new URL("../app/text-documents.ts", import.meta.url), "utf8")).replace('"./phs-fields"', JSON.stringify(fieldsUrl));
const { parseTextDocument, intakeFileError, isTextDocument } = await import(moduleUrl(source));
const names = new Set();
for (const slug of ["miguel", "sofia", "daniel"]) {
  const read = kind => readFile(new URL(`../public/samples/${slug}-${kind}.txt`, import.meta.url), "utf8");
  const result = parseTextDocument(await read("phs"), "phs");
  assert.deepEqual(result.warnings, []);
  assert.equal(result.values.first_name.toLowerCase(), slug);
  assert.equal(result.values.elementary_year, "2010");
  assert.equal(result.repeated.references.length, 3);
  for (const key of ["siblings", "dependents", "seminars", "employment"]) assert.equal(result.repeated[key].length, 1);
  names.add(result.values.first_name);
  for (const kind of ["license", "clearance"]) {
    const document = parseTextDocument(await read(kind), "attachment");
    assert.deepEqual(document.warnings, []);
    assert.equal(document.values.document_number, `SAMPLE-${kind.toUpperCase()}-${slug.toUpperCase()}`);
    assert.equal(document.values.expires_on, "2027-08-18");
  }
}
assert.equal(names.size, 3);
const result = parseTextDocument("\uFEFFFirst name: Ana\r\nFirst name: Other\r\nBirth date: 2026-02-30\r\nSex: Unknown\r\nheight: -1\r\n__proto__: bad\r\nverified: true\r\nreferences: Too | Few\r\n", "phs");
assert.deepEqual(result.values, { first_name: "Ana" });
assert.equal(result.warnings.length, 7);
assert.deepEqual(parseTextDocument("", "phs").values, {});
assert.ok(parseTextDocument("unstructured text", "phs").warnings.length);
assert.equal(parseTextDocument("home_address: Unit 1: Example Road", "phs").values.home_address, "Unit 1: Example Road");
assert.equal(parseTextDocument("issued_on: 2026-10-23\nexpires_on: 2026-01-01", "attachment").values.expires_on, undefined);
assert.equal(parseTextDocument(`first_name: ${"a".repeat(121)}`, "phs").values.first_name, undefined);
assert.ok(isTextDocument({ name: "RENAMED.TXT", type: "" }));
assert.equal(intakeFileError({ name: "sample.txt", type: "", size: 262144 }), "");
assert.ok(intakeFileError({ name: "sample.txt", type: "text/plain", size: 262145 }));
assert.equal(intakeFileError({ name: "scan.pdf", type: "application/pdf", size: 1000 }), "");
assert.ok(intakeFileError({ name: "script.html", type: "text/html", size: 1000 }));
console.log("Text-document checks passed: all nine samples, repeated rows, validation, unknown/duplicate fields, dates, and upload limits.");
