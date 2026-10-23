import { phsGroups, repeatGroups } from "./phs-fields";

export const textDocumentAccept = "application/pdf,image/jpeg,image/png,text/plain,.txt";
export function isTextDocument(file: Pick<File, "name" | "type">) {
  return file.type === "text/plain" || /\.txt$/i.test(file.name);
}
export function intakeFileError(file: File) {
  if (file.size > (isTextDocument(file) ? 256 * 1024 : 10 * 1024 * 1024)) return isTextDocument(file) ? "Text files must be 256 KB or smaller." : "Files must be 10 MB or smaller.";
  return isTextDocument(file) || ["application/pdf", "image/jpeg", "image/png"].includes(file.type) ? "" : "Use a TXT, PDF, JPG, or PNG file.";
}

// Only allow declared fields; uploaded text never becomes code or HTML.
const normalize = (label: string) => label.trim().toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const fields = new Map(phsGroups.flatMap(group => group.fields.flatMap(field => [[normalize(field.key), field], [normalize(field.label), field]] as const)));
const metadataKeys = new Map([["document_number", "document_number"], ["issued_on", "issued_on"], ["expires_on", "expires_on"]] as const);
export function validTextDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function parseTextDocument(text: string, kind: "phs" | "attachment") {
  const values: Record<string, string> = {};
  const repeated: Record<string, string[][]> = {};
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 0) { warnings.push("A line without a field label was skipped."); continue; }
    const label = normalize(line.slice(0, separator));
    const value = line.slice(separator + 1).trim();
    const group = kind === "phs" ? repeatGroups.find(group => normalize(group.key) === label) : undefined;
    if (group) {
      const cells = value.split("|").map(cell => cell.trim());
      if (cells.length !== group.columns.length || cells.some(cell => cell.length > 500) || (repeated[group.key]?.length || 0) >= 50) { warnings.push(`Invalid ${group.title} row skipped.`); continue; }
      (repeated[group.key] ||= []).push(cells);
      continue;
    }
    const field = kind === "phs" ? fields.get(label) : undefined;
    const key = kind === "phs" ? field?.key : metadataKeys.get(label as "document_number");
    if (!key) { warnings.push(`Unknown field: ${line.slice(0, separator).slice(0, 80)}.`); continue; }
    if (seen.has(key)) { warnings.push(`Duplicate ${key} skipped; first value retained.`); continue; }
    seen.add(key);
    const limit = kind === "attachment" ? 80 : key.includes("address") ? 500 : 120;
    if (value.length > limit || (value && ((field?.type === "date" || key === "issued_on" || key === "expires_on") && !validTextDate(value))) || (value && field?.options && !field.options.includes(value)) || (value && field?.type === "number" && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      warnings.push(`Invalid ${key} skipped; enter it manually.`); continue;
    }
    values[key] = value;
  }
  if (!Object.keys(values).length && !Object.keys(repeated).length) warnings.push("No supported fields found. Enter the details manually.");
  if (kind === "attachment" && values.issued_on && values.expires_on && values.expires_on < values.issued_on) {
    delete values.expires_on;
    warnings.push("Expiry precedes issue date; enter expiry manually.");
  }
  return { values, repeated, warnings };
}
