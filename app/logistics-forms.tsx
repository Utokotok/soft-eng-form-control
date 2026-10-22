"use client";
import { useState, type FormEvent } from "react";
import { GUARD, OFFICER, equipment, requests, shiftForToday, stamp, today, useStore, updateStore, inventoryStatus, saveFiles, uid, type ReturnRecord, type Issuance } from "./domain";
import { Heading, Section, InputField, Facts, Notice, fileError } from "./form-ui";

export function IssuanceForm() {
  const store = useStore();
  const [requestId, setRequestId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const request = requests.find(row => String(row.equipment_request_id) === requestId);
  const item = equipment.find(row => String(row.equipment_id) === assetId);
  const fulfilled = request && store.issuances.some(row => row.request_item_id === request.request_item_id);
  const guardValid = GUARD.employment_status === "active" && GUARD.license_expires_on >= today();
  const ddoValid = request && request.valid_from <= today() && request.valid_until >= today();
  const registrationValid = item?.equipment_category !== "Firearm" || Boolean(item.registration_expires_on && item.registration_expires_on >= today());
  const firearmLicenseValid = item?.equipment_category !== "Firearm"; // No verified firearm license exists in the current fixture.
  const available = item && inventoryStatus(item, store) === "available";
  const blocked = !guardValid || !ddoValid || !registrationValid || !firearmLicenseValid || !available || fulfilled;
  const nearExpiry = item?.registration_expires_on && (Date.parse(item.registration_expires_on) - Date.now()) / 86400000 <= 92 && registrationValid;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!request || !item || blocked) return setError("Issuance is on hold. Resolve the eligibility checks before continuing.");
    if (!receipt) return setError("Attach the signed guard receipt.");
    const problem = fileError(receipt); if (problem) return setError(problem);
    setBusy(true);
    try {
      const fileId = uid("RECEIPT"); await saveFiles([{ id: fileId, blob: receipt }]);
      const record: Issuance = { issuance_id: uid("ISS"), request_item_id: request.request_item_id, equipment_id: item.equipment_id, employee_id: request.employee_id, issued_at: new Date().toISOString(), receipt_number: String(new FormData(form).get("receipt_number")).trim(), receipt_file_id: fileId };
      updateStore(current => {
        if (inventoryStatus(item, current) !== "available" || current.issuances.some(row => row.request_item_id === request.request_item_id)) throw new Error("This request or asset was processed in another window. Select an available request.");
        return { ...current, issuances: [...current.issuances, record] };
      });
      setSuccess(`${record.issuance_id} recorded. Asset ${item.asset_tag} is now issued.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to record issuance."); }
    finally { setBusy(false); }
  }
  return <><Heading title="Issue equipment">Fulfil an equipment request for an authorized deployment.</Heading><form className="production-form form-main" onSubmit={submit}>
    <Notice message={error}/><Notice message={success} success/>
    <Section title="Equipment request"><InputField label="Pending request" required><select value={requestId} required onChange={event => { setRequestId(event.target.value); setAssetId(""); setError(""); setSuccess(""); }}><option value="">Select a request</option>{requests.filter(row => !store.issuances.some(issue => issue.request_item_id === row.request_item_id)).map(row => <option key={row.equipment_request_id} value={row.equipment_request_id}>REQ-{row.equipment_request_id} · {row.category} · {GUARD.name}</option>)}</select></InputField><Facts items={[["Guard", request ? `${GUARD.name} · ${GUARD.employee_number}` : "—"], ["Duty Detail Order", request?.ddo_number || "—"], ["Site / post", request ? `${request.site} / ${request.post}` : "—"], ["Assignment schedule", request ? `${stamp(shiftForToday().scheduled_start)} – ${stamp(shiftForToday().scheduled_end)}` : "—"], ["Requested quantity", request?.quantity || "—"]]}/></Section>
    <Section title="Asset and receipt"><div className="field-grid">
      <InputField label="Available asset" required><select value={assetId} required disabled={!request || Boolean(fulfilled)} onChange={event => setAssetId(event.target.value)}><option value="">Select an asset</option>{equipment.filter(row => row.equipment_category === request?.category && inventoryStatus(row, store) === "available").map(row => <option key={row.equipment_id} value={row.equipment_id}>{row.asset_tag} · {row.brand_model}</option>)}</select></InputField>
      <InputField label="Serial number"><input readOnly value={item?.serial_number || ""} placeholder="From the selected asset"/></InputField>
      <InputField label="Condition"><input readOnly value={item?.condition || ""} placeholder="From the inventory record"/></InputField>
      <InputField label="Receipt number" required><input name="receipt_number" required maxLength={80} placeholder="Enter receipt reference"/></InputField>
      <div className="field-span"><InputField label="Signed guard receipt" required hint="PDF, JPG or PNG · Up to 10 MB"><input type="file" required accept="application/pdf,image/jpeg,image/png" onChange={event => setReceipt(event.target.files?.[0] || null)}/></InputField></div>
    </div>{request && <div className="eligibility-inline"><strong>Eligibility</strong><ul><li>{guardValid ? "✓" : "✕"} Guard status and security license</li><li>{ddoValid ? "✓" : "✕"} DDO covers this deployment</li>{item && <><li>{available ? "✓" : "✕"} Asset availability</li>{item.equipment_category === "Firearm" && <><li>{registrationValid ? "✓" : "✕"} Firearm registration {registrationValid ? "valid" : "expired"}</li><li>{firearmLicenseValid ? "✓" : "✕"} Verified personnel firearm license {firearmLicenseValid ? "valid" : "missing"}</li></>}</>}</ul>{nearExpiry && <p className="error-text">Registration expires within three months. Flag for Operations / Super Admin review.</p>}{item && blocked && !fulfilled && <p className="error-text">On hold — issuance cannot proceed until the failed checks are resolved.</p>}</div>}</Section>
    <div className="form-actions"><span className="action-caption">Issued at confirmation · {OFFICER.name}</span><button className="button primary" type="submit" disabled={busy || !request || !item || Boolean(blocked)}>{busy ? "Saving…" : "Confirm issuance"}</button></div>
  </form></>;
}

export function ReturnForm() {
  const store = useStore();
  const [issuanceId, setIssuanceId] = useState("");
  const [condition, setCondition] = useState("intact");
  const [observed, setObserved] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const issuance = store.issuances.find(row => row.issuance_id === issuanceId);
  const item = equipment.find(row => row.equipment_id === issuance?.equipment_id);
  const mismatch = Boolean(item && condition !== "lost" && observed && observed.trim() !== item.asset_tag);
  const decision = mismatch ? "mismatch_review" : condition === "intact" ? "returned_available" : condition === "damaged" ? "damaged" : "missing";
  const decisionLabel = !issuance ? "Select an issuance to inspect" : mismatch ? "Hold for asset mismatch review" : condition === "intact" ? "Return to available inventory" : condition === "damaged" ? "Mark damaged · incident review" : "Mark missing · incident review";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = event.currentTarget; if (!form.reportValidity() || !issuance || !item) return;
    const data = new FormData(form);
    const notes = String(data.get("notes") || "").trim();
    if ((condition !== "intact" || mismatch) && notes.length < 10) return setError("Describe the damage, loss, or asset mismatch in at least 10 characters.");
    const record: ReturnRecord = { equipment_return_id: uid("RET"), issuance_id: issuance.issuance_id, processed_by: OFFICER.user_id, processed_at: new Date().toISOString(), observed_asset_tag: condition === "lost" ? "" : observed.trim(), observed_condition: condition, ammunition_returned: item.equipment_category === "Firearm" ? Number(data.get("ammunition_returned")) : null, decision, notes };
    try {
      updateStore(current => {
        if (current.returns.some(row => row.issuance_id === issuance.issuance_id)) throw new Error("This issuance has already been processed.");
        const incident = condition !== "intact" || mismatch ? [{ equipment_incident_id: uid("INC"), equipment_return_id: record.equipment_return_id, incident_type: mismatch ? "asset_mismatch" : condition, details: notes, status: "pending_review" as const, negligence_decision: null, approved_charge: null, repair_action: null }] : [];
        return { ...current, returns: [...current.returns, record], incidents: [...(current.incidents || []), ...incident] };
      });
      setSuccess(`${record.equipment_return_id} recorded. ${decisionLabel}.`); setIssuanceId(""); setObserved(""); setCondition("intact"); form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to record the return."); }
  }
  return <><Heading title="Return equipment">Inspect an issued asset and record its disposition.</Heading><form className="production-form form-main" onSubmit={submit}>
    <Notice message={error}/><Notice message={success} success/>
    <Section title="Original issuance"><InputField label="Outstanding issuance" required><select required value={issuanceId} onChange={event => { setIssuanceId(event.target.value); setObserved(""); setError(""); setSuccess(""); }}><option value="">Select an issued asset</option>{store.issuances.filter(row => !store.returns.some(ret => ret.issuance_id === row.issuance_id)).map(row => <option key={row.issuance_id} value={row.issuance_id}>{row.issuance_id} · {equipment.find(asset => asset.equipment_id === row.equipment_id)?.asset_tag} · {GUARD.name}</option>)}</select></InputField><Facts items={[["Guard", issuance ? `${GUARD.name} · ${GUARD.employee_number}` : "—"], ["Equipment", item?.brand_model || "—"], ["Asset tag", item?.asset_tag || "—"], ["Serial number", item?.serial_number || "—"], ["Issued at", issuance ? stamp(issuance.issued_at) : "—"], ["Receipt", issuance?.receipt_number || "—"]]}/></Section>
    <Section title="Return inspection"><fieldset className="choice-field"><legend>Observed condition *</legend><div className="radio-options">{["intact", "damaged", "lost"].map(value => <label key={value}><input type="radio" name="observed_condition" value={value} checked={condition === value} onChange={() => setCondition(value)}/><span>{value.charAt(0).toUpperCase()+value.slice(1)}</span></label>)}</div></fieldset><div className="field-grid evidence-grid">
      <InputField label="Observed asset tag" required={condition !== "lost"} hint={mismatch ? "Does not match the issued asset. Manual review required." : undefined}><input required={condition !== "lost"} disabled={condition === "lost"} value={observed} onChange={event => setObserved(event.target.value)} maxLength={40} placeholder="Read from the returned asset"/></InputField>
      {item?.equipment_category === "Firearm" && <InputField label="Ammunition returned" required><input name="ammunition_returned" type="number" min={0} step={1} required defaultValue={0}/></InputField>}
      <div className="field-span"><InputField label="Inspection notes" required={condition !== "intact" || mismatch}><textarea name="notes" rows={3} required={condition !== "intact" || mismatch} minLength={condition !== "intact" || mismatch ? 10 : undefined} maxLength={1000} placeholder="Record the inspection or incident details"/></InputField></div>
    </div><div className="disposition"><span>Disposition</span><strong>{decisionLabel}</strong></div><label className="native-check"><input type="checkbox" required/><span>I inspected this return against the original issuance.</span></label></Section>
    <div className="form-actions"><span className="action-caption">Processed at confirmation · {OFFICER.name}</span><button className="button primary" type="submit" disabled={!issuance}>Record return</button></div>
  </form></>;
}
