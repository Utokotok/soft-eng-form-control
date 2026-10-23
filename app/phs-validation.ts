import { phsGroups, repeatGroups } from "./phs-fields";

export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }
export function phsRules(key: string) {
  const age = key.endsWith("_age"), year = key.endsWith("_year"), count = key === "children_count";
  return { maxLength: key.includes("address") ? 500 : 120, min: 0, max: age ? 125 : count ? 100 : key === "height" ? 300 : key === "weight" ? 500 : undefined, step: age || count ? 1 : "any", year };
}
export function validatePhs(values: Record<string, string>, repeated: Record<string, string[][]>, today: string): { group: number; key: string; message: string } | null {
  for (const [groupIndex, group] of phsGroups.entries()) {
    for (const field of group.fields) {
      const value = (values[field.key] || "").trim(), rules = phsRules(field.key);
      const fail = (message: string) => ({ group: groupIndex, key: field.key, message });
      if (field.required && !value) return fail(`Enter ${field.label.toLowerCase()} before continuing.`);
      if (!value) continue;
      if (value.length > rules.maxLength) return fail(`${field.label} must be ${rules.maxLength} characters or fewer.`);
      if (field.options && !field.options.includes(value)) return fail(`Select a valid option for ${field.label.toLowerCase()}.`);
      if (field.type === "date" && !validDate(value)) return fail(`${field.label} must be a valid calendar date.`);
      if (field.key === "birth_date" && value >= today) return fail("Birth date must be in the past.");
      if (field.type === "tel" && !/^[+0-9 ()-]{7,30}$/.test(value)) return fail(`${field.label} must be a valid phone number (7–30 characters).`);
      if (field.type === "number") {
        const number = Number(value);
        if (!Number.isFinite(number) || number < rules.min || (rules.max !== undefined && number > rules.max) || (rules.step === 1 && !Number.isInteger(number))) return fail(`${field.label} must be ${rules.step === 1 ? "a whole number" : "a number"} from ${rules.min} to ${rules.max ?? "a valid positive value"}.`);
      }
      if (rules.year && (!/^\d{4}$/.test(value) || Number(value) < 1900 || Number(value) > Number(today.slice(0, 4)))) return fail(`${field.label} must be a four-digit year from 1900 to ${today.slice(0, 4)}.`);
    }
  }
  if (values.service_from && values.service_until && values.service_until < values.service_from) return { group: 4, key: "service_until", message: "Service end cannot precede its start." };
  for (const group of repeatGroups) {
    const rows = (repeated[group.key] || []).filter(row => row.some(value => value.trim()));
    for (const row of rows) {
      if (row.length !== group.columns.length || row.some(value => !value.trim() || value.length > 500)) return { group: phsGroups.length, key: group.key, message: `Complete every field in each ${group.title.toLowerCase()} row, or remove unused rows. Use 500 characters or fewer per field.` };
      const ageColumn = group.columns.indexOf("Age");
      if (ageColumn !== -1 && (!/^\d+$/.test(row[ageColumn]) || Number(row[ageColumn]) > 125)) return { group: phsGroups.length, key: group.key, message: `Enter a whole-number age from 0 to 125 in ${group.title.toLowerCase()}.` };
      const dateColumn = group.columns.indexOf("Date graduated");
      if (dateColumn !== -1 && !validDate(row[dateColumn])) return { group: phsGroups.length, key: group.key, message: "Enter a valid graduation date for each training row." };
    }
    if (group.key === "references" && rows.length < 3) return { group: phsGroups.length, key: group.key, message: "Provide at least three complete character references." };
  }
  return null;
}
