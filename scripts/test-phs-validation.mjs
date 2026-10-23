import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`;
const fieldsUrl = moduleUrl(await readFile(new URL("../app/phs-fields.ts", import.meta.url), "utf8"));
const rulesSource = (await readFile(new URL("../app/phs-validation.ts", import.meta.url), "utf8")).replace('"./phs-fields"', JSON.stringify(fieldsUrl));
const { validatePhs } = await import(moduleUrl(rulesSource));
const { samplePhsValues, samplePhsRows } = await import(moduleUrl(await readFile(new URL("../app/phs-sample.ts", import.meta.url), "utf8")));
const check = (patch = {}, rows = samplePhsRows()) => validatePhs({ ...samplePhsValues, ...patch }, rows, "2026-10-23");
assert.equal(check(), null);
for (const patch of [
  { first_name: "   " }, { birth_date: "2026-10-24" }, { birth_date: "2026-02-30" },
  { contact_number: "abc" }, { emergency_phone: "abc" }, { height: "-1" },
  { children_count: "1.5" }, { father_age: "126" }, { elementary_year: "next year" },
  { college_year: "2099" }, { civil_status: "Unknown" }, { first_name: "a".repeat(121) },
  { service_from: "2020-01-01", service_until: "2019-01-01" },
]) assert.ok(check(patch), JSON.stringify(patch));
const fewReferences = samplePhsRows(); fewReferences.references.pop(); assert.ok(check({}, fewReferences));
const partial = samplePhsRows(); partial.siblings[0][0] = ""; assert.ok(check({}, partial));
const wrongAge = samplePhsRows(); wrongAge.dependents[0][2] = "-5"; assert.ok(check({}, wrongAge));
const wrongDate = samplePhsRows(); wrongDate.seminars[0][2] = "2025-02-30"; assert.ok(check({}, wrongDate));
const emptyOptionalRow = samplePhsRows(); emptyOptionalRow.siblings.push(["", "", "", ""]); assert.equal(check({}, emptyOptionalRow), null);
console.log("19 PHS validation checks passed.");
