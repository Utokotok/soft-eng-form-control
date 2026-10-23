"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Heading, Section, InputField, Notice, Facts, SuccessDialog } from "./form-ui";
import { uid, updateStore, useStore, stamp } from "./domain";
import { operations, guards, ddos, validateDutyBatch, isoLocal, type ScheduleValues, type DutyRow } from "./operations-domain";

const blank: ScheduleValues = { deploymentId: "", guard: "", site: "", post: "", deploymentStart: "", deploymentEnd: "", shiftStart: "", shiftEnd: "", ddo: "", restDay: false };
const newDuty = (): DutyRow => ({ id: uid("ROW"), shiftStart: "", shiftEnd: "", restDay: false });
const localInput = (iso: string | null) => iso ? new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 16) : "";

export function DeploymentForm() {
  const store = useStore(), data = operations(store);
  const [values, setValues] = useState<ScheduleValues>({ ...blank });
  const [rows, setRows] = useState<DutyRow[]>([{ id: "initial", shiftStart: "", shiftEnd: "", restDay: false }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const existing = data.deployments.find(row => row.deployment_id === values.deploymentId);
  const scheduled = data.shifts.filter(row => row.deployment_id === existing?.deployment_id && row.status === "assigned").sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
  const clearMessages = () => { setErrors({}); setSuccess(""); setSaveError(""); };
  function reset() { setValues({ ...blank }); setRows([newDuty()]); clearMessages(); }
  function chooseDeployment(id: string) {
    clearMessages(); setRows([newDuty()]);
    const deployment = data.deployments.find(row => row.deployment_id === id);
    if (!deployment) { setValues({ ...blank }); return; }
    const post = data.posts.find(row => row.post_id === deployment.post_id);
    const authorization = data.ddoAssignments.find(row => row.deployment_id === id && row.status === "active");
    setValues({ ...blank, deploymentId: id, guard: String(deployment.employee_id), site: post?.site_id || "", post: deployment.post_id, deploymentStart: localInput(deployment.start_at), deploymentEnd: localInput(deployment.end_at), ddo: authorization?.ddo_id || "" });
  }
  function change(key: keyof ScheduleValues, value: string) { clearMessages(); setValues(current => ({ ...current, [key]: value, ...(key === "site" ? { post: "" } : {}) })); }
  function changeDuty(id: string, patch: Partial<DutyRow>) { clearMessages(); setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row)); }
  function field(key: string, label: string, control: ReactElement, required = true, hint?: string) {
    return <div className={errors[key] ? "field-error" : ""}><InputField label={label} required={required} hint={errors[key] || hint}>{control}</InputField></div>;
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    const form = event.currentTarget;
    const problems = validateDutyBatch(values, rows, data);
    if (Object.keys(problems).length) {
      setErrors(problems);
      requestAnimationFrame(() => { const input = form.elements.namedItem(Object.keys(problems)[0]); if (input instanceof HTMLElement) input.focus(); });
      return;
    }
    try {
      const deploymentId = values.deploymentId || uid("DEP");
      updateStore(current => {
        const latest = operations(current), changed = validateDutyBatch(values, rows, latest);
        if (Object.keys(changed).length) { setErrors(changed); throw new Error("Schedule availability changed. Review the highlighted duties."); }
        const start = isoLocal(values.deploymentStart), end = values.deploymentEnd ? isoLocal(values.deploymentEnd) : null;
        return { ...current, operations: { ...latest,
          deployments: values.deploymentId ? latest.deployments : [...latest.deployments, { deployment_id: deploymentId, employee_id: Number(values.guard), post_id: values.post, start_at: start, end_at: end, status: "active" }],
          shifts: [...latest.shifts, ...rows.map(row => ({ shift_assignment_id: uid("SHIFT"), deployment_id: deploymentId, scheduled_start: isoLocal(row.shiftStart), scheduled_end: isoLocal(row.shiftEnd), rest_day_indicator: row.restDay, status: "assigned" as const }))],
          ddoAssignments: values.deploymentId ? latest.ddoAssignments : [...latest.ddoAssignments, { ddo_assignment_id: uid("DDOA"), ddo_id: values.ddo, deployment_id: deploymentId, assignment_from: start, assignment_until: end || ddos.find(row => row.ddo_id === values.ddo)!.valid_until, status: "active" }],
        } };
      });
      setValues(current => ({ ...current, deploymentId })); setRows([newDuty()]);
      setSuccess(`${rows.length} duty ${rows.length === 1 ? "shift" : "shifts"} saved to deployment ${deploymentId}.`);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Unable to save the schedule."); }
  }
  return <><Heading title="Guard deployment & scheduling">Assign a guard to a post and manage their duty shifts.</Heading>
    <form className="production-form form-main" onSubmit={submit} noValidate>
      <Notice message={saveError || (Object.keys(errors).length ? "Review the highlighted duty details." : "")}/><SuccessDialog title="Duty schedule saved" message={success} onDismiss={() => setSuccess("")}/>
      <Section title="Deployment">
        {field("deploymentId", "Deployment", <select name="deploymentId" value={values.deploymentId} aria-invalid={Boolean(errors.deploymentId)} onChange={event => chooseDeployment(event.target.value)}><option value="">Create a new deployment</option>{data.deployments.filter(row => row.status === "active").map(row => <option key={row.deployment_id} value={row.deployment_id}>{guards.find(guard => guard.employee_id === row.employee_id)?.name || row.employee_id} · {data.posts.find(post => post.post_id === row.post_id)?.post_name} · {row.deployment_id}</option>)}</select>, false)}
        {existing ? <Facts items={[["Guard", guards.find(row => row.employee_id === existing.employee_id)?.name || "—"], ["Client site", data.sites.find(row => row.site_id === values.site)?.site_name || "—"], ["Assigned post", data.posts.find(row => row.post_id === existing.post_id)?.post_name || "—"], ["Deployment period", `${stamp(existing.start_at)} – ${existing.end_at ? stamp(existing.end_at) : "Ongoing"}`], ["Duty Detail Order", values.ddo || "Not assigned"]]}/> : <div className="field-grid deployment-fields">
          {field("guard", "Guard", <select name="guard" value={values.guard} onChange={event => change("guard", event.target.value)}><option value="">Select a guard</option>{guards.filter(row => row.employment_status === "active").map(row => <option key={row.employee_id} value={row.employee_id}>{row.name} · {row.employee_number}</option>)}</select>)}
          {field("site", "Client site", <select name="site" value={values.site} onChange={event => change("site", event.target.value)}><option value="">Select a site</option>{data.sites.filter(row => row.status === "active").map(row => <option key={row.site_id} value={row.site_id}>{row.site_name}</option>)}</select>)}
          {field("post", "Assigned post", <select name="post" value={values.post} disabled={!values.site} onChange={event => change("post", event.target.value)}><option value="">Select a post</option>{data.posts.filter(row => row.site_id === values.site && row.status === "active").map(row => <option key={row.post_id} value={row.post_id}>{row.post_name}</option>)}</select>)}
          {field("ddo", "Duty Detail Order", <select name="ddo" value={values.ddo} onChange={event => change("ddo", event.target.value)}><option value="">Select a DDO</option>{ddos.filter(row => row.status === "active").map(row => <option key={row.ddo_id} value={row.ddo_id}>{row.ddo_number}</option>)}</select>)}
          {field("deploymentStart", "Deployment starts", <input name="deploymentStart" type="datetime-local" value={values.deploymentStart} onInput={event => change("deploymentStart", event.currentTarget.value)}/>)}
          {field("deploymentEnd", "Deployment ends", <input name="deploymentEnd" type="datetime-local" value={values.deploymentEnd} onInput={event => change("deploymentEnd", event.currentTarget.value)}/>, false, "Leave blank for an ongoing deployment.")}
        </div>}
      </Section>
      <Section title="Duty schedule">
        <p className="time-zone-note">Add one row per duty. Use the next date when a shift ends after midnight. Philippine time (UTC+8).</p>
        {rows.map((row, index) => <fieldset className="duty-row" key={row.id}><legend>Duty {index + 1}</legend>
          <div className="field-grid">{field(`duty-${row.id}-shiftStart`, "Shift starts", <input name={`duty-${row.id}-shiftStart`} type="datetime-local" value={row.shiftStart} aria-invalid={Boolean(errors[`duty-${row.id}-shiftStart`])} onInput={event => changeDuty(row.id, { shiftStart: event.currentTarget.value })}/>)}
          {field(`duty-${row.id}-shiftEnd`, "Shift ends", <input name={`duty-${row.id}-shiftEnd`} type="datetime-local" value={row.shiftEnd} aria-invalid={Boolean(errors[`duty-${row.id}-shiftEnd`])} onInput={event => changeDuty(row.id, { shiftEnd: event.currentTarget.value })}/>)}</div>
          <div className="duty-row-actions"><label className="native-check"><input type="checkbox" checked={row.restDay} onChange={event => changeDuty(row.id, { restDay: event.target.checked })}/><span>Duty on scheduled rest day</span></label><button className="button secondary" type="button" disabled={rows.length === 1} aria-label={`Remove duty ${index + 1}`} onClick={() => { clearMessages(); setRows(current => current.filter(item => item.id !== row.id)); }}>Remove</button></div>
          {["guard", "post", "ddo"].map(key => errors[`duty-${row.id}-${key}`] && <p className="error-text" role="alert" key={key}>{errors[`duty-${row.id}-${key}`]}</p>)}
        </fieldset>)}
        <button className="button secondary" type="button" onClick={() => { clearMessages(); setRows(current => [...current, newDuty()]); }}>Add another duty</button>
      </Section>
      <div className="form-actions"><button type="button" className="button secondary" onClick={reset}>Clear form</button><button type="submit" className="button primary">{existing ? "Save duty shifts" : "Save deployment & duties"}</button></div>
      {existing && <Section title="Scheduled duties">{scheduled.length ? <ul className="scheduled-duties">{scheduled.map(row => <li key={row.shift_assignment_id}><span>{stamp(row.scheduled_start)} — {stamp(row.scheduled_end)}</span>{row.rest_day_indicator && <small>Rest-day duty</small>}</li>)}</ul> : <p>No duties scheduled yet.</p>}</Section>}
    </form>
  </>;
}
