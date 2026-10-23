"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { UploadCloud, ChevronRight, Check, FileText } from "lucide-react";
import { AddressMap, isValidPin, type Pin } from "./address-map";
import { Heading, Section, InputField, Notice, SuccessDialog, fileError } from "./form-ui";
import { saveFiles, updateStore, uid, OFFICER, today, type Application } from "./domain";
import { phsRules, validatePhs } from "./phs-validation";
import { phsGroups, repeatGroups } from "./phs-fields";
import { samplePhsValues, samplePhsRows } from "./phs-sample";

const documentTypes = ["PSA birth certificate", "PNP / NBI clearance", "Drug test", "Neuro-psychiatric test", "Security license — front", "Security license — back", "Prior employment certificate", "Seminar / achievement certificate", "Data privacy consent form"];
type DocumentEntry = { type: string; file: File | null; document_number: string; issued_on: string; expires_on: string };
export function RecruitmentForm() {
  const [step, setStep] = useState(0);
  const [sources, setSources] = useState<File[]>([]);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [repeated, setRepeated] = useState<Record<string, string[][]>>({ references: [["", "", ""], ["", "", ""], ["", "", ""]] });
  const [groupIndex, setGroupIndex] = useState(0);
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState<Pin | null>(null);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invalidKey, setInvalidKey] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const lastPanel = useRef({ step: 0, groupIndex: 0 });
  useEffect(() => {
    const changed = lastPanel.current.step !== step || lastPanel.current.groupIndex !== groupIndex;
    lastPanel.current = { step, groupIndex };
    if (changed && !error) root.current?.querySelector<HTMLElement>(step === 1 ? ".phs-admin h2" : ".production-form h2")?.focus();
  }, [step, groupIndex]);
  useEffect(() => { const urls = sources.map(file => URL.createObjectURL(file)); setSourceUrls(urls); return () => urls.forEach(url => URL.revokeObjectURL(url)); }, [sources]);
  function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.length > 10) return setError("Attach up to 10 PHS pages.");
    for (const file of selected) { const problem = fileError(file); if (problem) return setError(problem); }
    setSources(selected); setSourceIndex(0); setValues({ ...samplePhsValues }); setRepeated(samplePhsRows()); setGroupIndex(0); setPin(null); setVerified(false); setError(""); setSuccess(""); setSubmitted(false);
  }
  function verify() {
    setError("");
    const problem = validatePhs(values, repeated, today());
    if (problem) { setGroupIndex(problem.group); setInvalidKey(problem.key); return setError(problem.message); }
    setInvalidKey("");
    if (!verified) return setError("Confirm that you checked the prefilled information against the uploaded PHS.");
    setStep(2);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (submitted || busy) { event.preventDefault(); return; }
    event.preventDefault(); setError(""); setSuccess("");
    if (!event.currentTarget.reportValidity()) return;
    if (!isValidPin(pin)) return setError("Pin the applicant’s home location on the map.");
    if (!verified || !sources.length) return setError("Complete PHS upload and verification first.");
    const problem = validatePhs(values, repeated, today());
    if (problem) { setStep(1); setGroupIndex(problem.group); setInvalidKey(problem.key); return setError(problem.message); }
    for (const document of documents) {
      if (!document.file) return setError("Attach a file to each document row or remove the unused row.");
      const problem = fileError(document.file); if (problem) return setError(problem);
      if (document.expires_on && document.issued_on && document.expires_on < document.issued_on) return setError("Document expiration cannot precede its issue date.");
    }
    setBusy(true);
    try {
      const id = uid("APP");
      const sourceFiles = sources.map(blob => ({ id: uid("PHS"), blob }));
      const extraFiles = documents.map(document => ({ id: uid("FILE"), blob: document.file! }));
      await saveFiles([...sourceFiles, ...extraFiles]);
      const person: Record<string, string> = {};
      for (const name of ["first_name", "middle_name", "last_name", "name_suffix", "birth_date", "home_address", "contact_number"]) person[name] = values[name]?.trim() || "";
      person.status = "active";
      const application: Application = { application_id: id, application_number: id, person_id: uid("PERSON"), status: "submitted", submitted_at: new Date().toISOString(), person, home_location: pin, personnel_documents: [...sourceFiles.map(file => ({ document_type: "Personal History Statement", file_id: file.id, document_number: "", issued_on: "", expires_on: "", verification_status: "pending" as const })), ...documents.map((document, index) => ({ document_type: document.type, file_id: extraFiles[index].id, document_number: document.document_number, issued_on: document.issued_on, expires_on: document.expires_on, verification_status: "pending" as const }))], phs_data: { ...values, ...repeated }, intake_metadata: { prefill_source: "dummy", manually_checked_by: OFFICER.user_id, manually_checked_at: new Date().toISOString() }, decision_notes: remarks };
      updateStore(store => {
        if (store.applications.some(record => record.person.first_name.toLowerCase() === person.first_name.toLowerCase() && record.person.last_name.toLowerCase() === person.last_name.toLowerCase() && record.person.birth_date === person.birth_date)) throw new Error("An application with the same name and birth date already exists. Review that record first.");
        return { ...store, applications: [...store.applications, application] };
      });
      setSubmitted(true);
      setSuccess(`${id} saved. Application submitted; supporting documents are pending verification.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save application."); }
    finally { setBusy(false); }
  }
  const activeGroup = phsGroups[groupIndex];
  const sourcePanel = <aside className="phs-source"><div className="source-toolbar"><strong>Original PHS</strong><select aria-label="Select PHS page" value={sourceIndex} onChange={event => setSourceIndex(Number(event.target.value))}>{sources.map((file, index) => <option key={index} value={index}>Page {index + 1} · {file.name}</option>)}</select></div>{sources[sourceIndex]?.type === "application/pdf" ? <iframe src={sourceUrls[sourceIndex]} title="Original PHS document"/> : sourceUrls[sourceIndex] ? <a href={sourceUrls[sourceIndex]} target="_blank" rel="noreferrer"><img src={sourceUrls[sourceIndex]} alt={`Original PHS page ${sourceIndex + 1}. Open to enlarge.`}/></a> : null}</aside>;

  return <div ref={root}><Heading title="Applicant intake">Upload the PHS, verify the information, then complete the record.</Heading>
    <div className="intake-progress">{["Upload PHS", "Verify information", "Complete record"].map((label, index) => <button key={label} type="button" disabled={index > step} onClick={() => { setStep(index); setError(""); }} aria-current={step === index ? "step" : undefined} className={step === index ? "current" : ""}><span>{index < step ? <Check size={14}/> : index + 1}</span>{label}{index < 2 && <ChevronRight size={15}/>}</button>)}</div>
    <Notice message={error}/><SuccessDialog title="Applicant record saved" message={success} onDismiss={() => setSuccess("")}/>
    {step === 0 && <div className="production-form form-main"><Section title="Personal History Statement"><p className="section-note">Upload all completed and signed pages in their original order.</p><label className="phs-upload"><UploadCloud size={30}/><strong>Select PHS pages</strong><span>PDF, JPG or PNG · Up to 10 MB per file · Up to 10 files</span><input type="file" multiple accept="application/pdf,image/jpeg,image/png" aria-label="Upload PHS pages" onChange={event => upload(event.target.files)}/></label>{sources.length > 0 && <><div className="source-file-list">{sources.map((file, index) => <div key={index}><FileText size={16}/><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></div>)}</div><p className="prefill-note">Sample values prefilled. Check and correct them against the uploaded PHS.</p></>}</Section><div className="form-actions"><button type="button" className="button primary" disabled={!sources.length} onClick={() => { setStep(1); setError(""); }}>Verify information<ChevronRight size={16}/></button></div></div>}
    {step === 1 && <div className="phs-review-layout">{sourcePanel}<div className="phs-admin"><p className="prefill-note">Sample prefill · Verify every section against the original PHS.</p><div className="phs-group-tabs" aria-label="PHS sections">{phsGroups.map((group, index) => <button key={group.title} type="button" aria-pressed={index === groupIndex} className={index === groupIndex ? "selected" : ""} onClick={() => setGroupIndex(index)}>{group.title}</button>)}<button type="button" aria-pressed={groupIndex === phsGroups.length} className={groupIndex === phsGroups.length ? "selected" : ""} onClick={() => setGroupIndex(phsGroups.length)}>History & references</button></div>
      {activeGroup ? <Section title={activeGroup.title}><div className="field-grid">{activeGroup.fields.map(field => <InputField key={field.key} label={field.label} required={field.required} hint={invalidKey === field.key ? error : undefined}>{field.options ? <select name={field.key} aria-invalid={invalidKey === field.key} value={values[field.key] || ""} onChange={event => { setValues(current => ({ ...current, [field.key]: event.target.value })); setVerified(false); }}><option value="">Not stated</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input name={field.key} aria-invalid={invalidKey === field.key} type={field.type || "text"} value={values[field.key] || ""} maxLength={phsRules(field.key).maxLength} min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? phsRules(field.key).max : field.key === "birth_date" ? today() : undefined} step={field.type === "number" ? phsRules(field.key).step : undefined} pattern={field.type === "tel" ? "[+0-9 ()-]{7,30}" : phsRules(field.key).year ? "[0-9]{4}" : undefined} onInput={event => { const value = event.currentTarget.value; setValues(current => ({ ...current, [field.key]: value })); setVerified(false); setInvalidKey(""); }}/>}</InputField>)}</div></Section> : <div className="form-main">{repeatGroups.map(group => <Section key={group.key} title={group.title}><div className="repeat-rows" data-repeat-group={group.key}>{(repeated[group.key] || []).map((row, rowIndex) => <div className="repeat-row" key={rowIndex}>{group.columns.map((column, columnIndex) => <InputField label={column} key={column}><input name={`${group.key}-${rowIndex}-${columnIndex}`} type={column === "Age" ? "number" : column === "Date graduated" ? "date" : "text"} min={column === "Age" ? 0 : undefined} max={column === "Age" ? 125 : undefined} maxLength={500} value={row[columnIndex] || ""} onInput={event => { const next = event.currentTarget.value; setRepeated(current => ({ ...current, [group.key]: current[group.key].map((entry, i) => i === rowIndex ? entry.map((value, j) => j === columnIndex ? next : value) : entry) })); setVerified(false); }}/></InputField>)}<button type="button" className="clear-button" aria-label={`Remove ${group.title} row ${rowIndex + 1}`} onClick={() => { setRepeated(current => ({ ...current, [group.key]: current[group.key].filter((_, i) => i !== rowIndex) })); setVerified(false); requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-repeat-group="${group.key}"]`)?.closest("section")?.querySelector<HTMLElement>("h2")?.focus()); }}>Remove</button></div>)}</div><button type="button" className="button secondary" onClick={() => { setRepeated(current => ({ ...current, [group.key]: [...(current[group.key] || []), group.columns.map(() => "")] })); setVerified(false); requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-repeat-group="${group.key}"] .repeat-row:last-child input`)?.focus()); }}>Add {group.title.toLowerCase()}</button></Section>)}</div>}
      <label className="native-check"><input type="checkbox" aria-required="true" checked={verified} onChange={event => setVerified(event.target.checked)}/><span>I checked all sections and corrected the information against the original PHS.</span></label><div className="form-actions"><button type="button" className="button secondary" onClick={() => setStep(0)}>Back</button><button type="button" className="button primary" onClick={verify}>Continue<ChevronRight size={16}/></button></div></div></div>}
    {step === 2 && <form className="production-form form-main" onSubmit={submit}><Section title="Home location"><p className="section-note">{values.home_address}</p><AddressMap value={pin} onChange={setPin}/></Section><Section title="Supporting requirements"><p className="section-note">The original PHS is attached. Add the available requirements for document verification.</p><div className="requirement-chips">{documentTypes.map(type => <span key={type} className={documents.some(document => document.type === type && document.file) ? "attached" : ""}>{type}</span>)}</div><div className="document-rows">{documents.map((document, index) => {
      const change = (patch: Partial<DocumentEntry>) => setDocuments(current => current.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
      return <div className="document-entry" key={index}><div className="field-grid"><InputField label="Document type"><select value={document.type} onChange={event => change({ type: event.target.value })}>{documentTypes.map(type => <option key={type}>{type}</option>)}</select></InputField><InputField label="File" required hint="PDF, JPG or PNG · Up to 10 MB"><input type="file" required accept="application/pdf,image/jpeg,image/png" onChange={event => change({ file: event.target.files?.[0] || null })}/></InputField><InputField label="Document number"><input value={document.document_number} maxLength={80} onChange={event => change({ document_number: event.target.value })}/></InputField><InputField label="Issued on"><input type="date" value={document.issued_on} onInput={event => change({ issued_on: event.currentTarget.value })}/></InputField><InputField label="Expires on"><input type="date" value={document.expires_on} onInput={event => change({ expires_on: event.currentTarget.value })}/></InputField></div><button className="clear-button" type="button" onClick={() => setDocuments(current => current.filter((_, i) => i !== index))}>Remove document</button></div>;
    })}</div><button type="button" className="button secondary" onClick={() => setDocuments(current => [...current, { type: documentTypes.find(type => !current.some(doc => doc.type === type)) || documentTypes[0], file: null, document_number: "", issued_on: "", expires_on: "" }])}>Add requirement</button></Section><Section title="Administrative review"><InputField label="HR remarks"><textarea rows={3} value={remarks} onChange={event => setRemarks(event.target.value)} maxLength={2000} placeholder="Internal review notes"/></InputField><label className="native-check"><input type="checkbox" required/><span>The applicant has consented to processing their personal information.</span></label></Section><div className="form-actions"><button type="button" className="button secondary" onClick={() => setStep(1)}>Back</button><button className="button primary" type="submit" disabled={busy || submitted}>{busy ? "Saving…" : submitted ? "Applicant record saved" : "Save applicant record"}</button></div></form>}
  </div>;
}
