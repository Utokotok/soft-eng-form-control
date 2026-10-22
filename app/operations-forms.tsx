"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Heading, Section, InputField, Notice, Facts } from "./form-ui";
import { uid, updateStore, useStore, stamp } from "./domain";
import { operations, guards, ddos, validateSchedule, isoLocal, type ScheduleValues, type Client, type ClientSite, type Post } from "./operations-domain";

const blankSchedule: ScheduleValues = { guard: "", site: "", post: "", deploymentStart: "", deploymentEnd: "", shiftStart: "", shiftEnd: "", ddo: "", restDay: false };

export function DeploymentForm() {
  const store = useStore();
  const data = operations(store);
  const [values, setValues] = useState<ScheduleValues>({ ...blankSchedule });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [lastSaved, setLastSaved] = useState<{ guard: string; site: string; post: string; start: string; end: string } | null>(null);
  const change = (key: keyof ScheduleValues, value: string | boolean) => { setValues(current => ({ ...current, [key]: value, ...(key === "site" ? { post: "" } : {}) })); setErrors({}); setSuccess(""); setSaveError(""); };
  function field(key: keyof ScheduleValues, label: string, control: ReactElement, required = true, hint?: string) {
    return <div className={errors[key] ? "field-error" : ""}><InputField label={label} required={required} hint={errors[key] || hint}>{control}</InputField></div>;
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSuccess(""); setSaveError("");
    const form = event.currentTarget;
    const problems = validateSchedule(values, data);
    setErrors(problems);
    if (Object.keys(problems).length) {
      requestAnimationFrame(() => { const input = form.elements.namedItem(Object.keys(problems)[0]); if (input instanceof HTMLElement) input.focus(); });
      return;
    }
    try {
      const deploymentId = uid("DEP");
      const shiftId = uid("SHIFT");
      const selectedDdo = ddos.find(row => row.ddo_id === values.ddo)!;
      updateStore(current => {
        const latest = operations(current);
        const changed = validateSchedule(values, latest);
        if (Object.keys(changed).length) { setErrors(changed); throw new Error("Assignment availability changed. Review the highlighted fields."); }
        const start = isoLocal(values.deploymentStart), end = values.deploymentEnd ? isoLocal(values.deploymentEnd) : null;
        return { ...current, operations: { ...latest,
          deployments: [...latest.deployments, { deployment_id: deploymentId, employee_id: Number(values.guard), post_id: values.post, start_at: start, end_at: end, status: "active" }],
          shifts: [...latest.shifts, { shift_assignment_id: shiftId, deployment_id: deploymentId, scheduled_start: isoLocal(values.shiftStart), scheduled_end: isoLocal(values.shiftEnd), rest_day_indicator: values.restDay, status: "assigned" }],
          ddoAssignments: [...latest.ddoAssignments, { ddo_assignment_id: uid("DDOA"), ddo_id: values.ddo, deployment_id: deploymentId, assignment_from: start, assignment_until: end || selectedDdo.valid_until, status: "active" }],
        } };
      });
      setLastSaved({ guard: guards.find(row => row.employee_id === Number(values.guard))!.name, site: data.sites.find(row => row.site_id === values.site)!.site_name, post: data.posts.find(row => row.post_id === values.post)!.post_name, start: isoLocal(values.shiftStart), end: isoLocal(values.shiftEnd) });
      setSuccess(`Deployment ${deploymentId} and shift ${shiftId} saved.`);
      setValues({ ...blankSchedule });
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Unable to save this assignment."); }
  }
  return <><Heading title="Guard deployment & scheduling">Assign a guard to a client post and schedule their duty.</Heading><form className="production-form form-main" onSubmit={submit} noValidate>
    <Notice message={saveError || (Object.keys(errors).length ? "Review the highlighted assignment details." : "")}/><Notice message={success} success/>
    <Section title="Deployment"><div className="field-grid">
      {field("guard", "Guard", <select name="guard" value={values.guard} aria-invalid={Boolean(errors.guard)} onChange={event => change("guard", event.target.value)}><option value="">Select a guard</option>{guards.filter(row => row.employment_status === "active").map(row => <option key={row.employee_id} value={row.employee_id}>{row.name} · {row.employee_number}</option>)}</select>)}
      {field("site", "Client site", <select name="site" value={values.site} aria-invalid={Boolean(errors.site)} onChange={event => change("site", event.target.value)}><option value="">Select a site</option>{data.sites.filter(row => row.status === "active").map(row => <option key={row.site_id} value={row.site_id}>{row.site_name}</option>)}</select>)}
      {field("post", "Assigned post", <select name="post" value={values.post} disabled={!values.site} aria-invalid={Boolean(errors.post)} onChange={event => change("post", event.target.value)}><option value="">Select a post</option>{data.posts.filter(row => row.site_id === values.site && row.status === "active").map(row => <option key={row.post_id} value={row.post_id}>{row.post_name}</option>)}</select>)}
      {field("ddo", "Duty Detail Order", <select name="ddo" value={values.ddo} aria-invalid={Boolean(errors.ddo)} onChange={event => change("ddo", event.target.value)}><option value="">Select a DDO</option>{ddos.filter(row => row.status === "active").map(row => <option key={row.ddo_id} value={row.ddo_id}>{row.ddo_number}</option>)}</select>)}
      {field("deploymentStart", "Deployment starts", <input name="deploymentStart" type="datetime-local" value={values.deploymentStart} aria-invalid={Boolean(errors.deploymentStart)} onChange={event => change("deploymentStart", event.target.value)}/>)}
      {field("deploymentEnd", "Deployment ends", <input name="deploymentEnd" type="datetime-local" value={values.deploymentEnd} aria-invalid={Boolean(errors.deploymentEnd)} onChange={event => change("deploymentEnd", event.target.value)}/>, false, "Leave blank for an ongoing deployment.")}
    </div></Section>
    <Section title="Duty schedule"><div className="field-grid">
      {field("shiftStart", "Shift starts", <input name="shiftStart" type="datetime-local" value={values.shiftStart} aria-invalid={Boolean(errors.shiftStart)} onChange={event => change("shiftStart", event.target.value)}/>)}
      {field("shiftEnd", "Shift ends", <input name="shiftEnd" type="datetime-local" value={values.shiftEnd} aria-invalid={Boolean(errors.shiftEnd)} onChange={event => change("shiftEnd", event.target.value)}/>)}
    </div><label className="native-check"><input name="restDay" type="checkbox" checked={values.restDay} onChange={event => change("restDay", event.target.checked)}/><span>This shift falls on the guard’s scheduled rest day.</span></label><p className="time-zone-note">All dates and times are in Philippine time (UTC+8).</p></Section>
    <div className="form-actions"><button type="button" className="button secondary" onClick={() => { setValues({ ...blankSchedule }); setErrors({}); setSuccess(""); setSaveError(""); }}>Clear form</button><button type="submit" className="button primary">Save deployment & shift</button></div>
    {success && lastSaved && <Section title="Assignment saved"><Facts items={[["Guard", lastSaved.guard], ["Site / post", `${lastSaved.site} / ${lastSaved.post}`], ["Shift starts", stamp(lastSaved.start)], ["Shift ends", stamp(lastSaved.end)]]}/></Section>}
  </form></>;
}

export function ClientSiteForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saved, setSaved] = useState<{ company: string; site: string; post: string; guards: number } | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = event.currentTarget; if (!form.reportValidity()) return;
    const payload = new FormData(form);
    const text = (name: string) => String(payload.get(name) || "").trim();
    for (const name of ["client_name", "business_address", "contact_name", "contact_number", "site_name", "site_address", "region_code", "post_name"]) if (!text(name)) { setError("Complete the required client, site, and post details."); const input = form.elements.namedItem(name); if (input instanceof HTMLElement) input.focus(); return; }
    const requiredGuards = Number(payload.get("required_guards"));
    if (!Number.isInteger(requiredGuards) || requiredGuards < 1 || requiredGuards > 999) return setError("Required guards must be a whole number between 1 and 999.");
    try {
      const clientId = uid("CLIENT"), siteId = uid("SITE"), postId = uid("POST");
      const client: Client = { client_id: clientId, client_name: text("client_name"), business_address: text("business_address"), contact_name: text("contact_name"), contact_number: text("contact_number"), contact_email: text("contact_email") || null, status: "active", created_at: new Date().toISOString() };
      const site: ClientSite = { site_id: siteId, client_id: clientId, site_name: text("site_name"), site_address: text("site_address"), region_code: text("region_code"), status: "active" };
      const post: Post = { post_id: postId, site_id: siteId, post_name: text("post_name"), required_guards: requiredGuards, status: "active" };
      updateStore(current => {
        const latest = operations(current);
        if (latest.clients.some(row => row.client_name.trim().toLowerCase() === client.client_name.toLowerCase())) throw new Error("A client with this company name already exists. Review the existing client record.");
        return { ...current, operations: { ...latest, clients: [...latest.clients, client], sites: [...latest.sites, site], posts: [...latest.posts, post] } };
      });
      setSaved({ company: client.client_name, site: site.site_name, post: post.post_name, guards: post.required_guards });
      setSuccess(`${client.client_name} registered. The new site and post are available for guard deployment.`);
      form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to register this client."); }
  }
  return <><Heading title="Client & site registration">Register a new client, their first site, and its guard post.</Heading><form className="production-form form-main" onSubmit={submit}>
    <Notice message={error}/><Notice message={success} success/>
    <Section title="Client information"><div className="field-grid">
      <InputField label="Company name" required><input name="client_name" required maxLength={160} autoComplete="organization" placeholder="Registered company name"/></InputField>
      <InputField label="Contact person" required><input name="contact_name" required maxLength={160} autoComplete="name" placeholder="Full name"/></InputField>
      <InputField label="Contact number" required><input name="contact_number" type="tel" required pattern="[+0-9 ()-]{7,30}" maxLength={30} autoComplete="tel" placeholder="e.g. +63 912 345 6789"/></InputField>
      <InputField label="Contact email"><input name="contact_email" type="email" maxLength={254} autoComplete="email" placeholder="contact@company.com"/></InputField>
      <div className="field-span"><InputField label="Business address" required><textarea name="business_address" required rows={2} maxLength={1000} autoComplete="street-address" placeholder="Street, barangay, city, province"/></InputField></div>
    </div></Section>
    <Section title="Site & guard post"><div className="field-grid">
      <InputField label="Site name" required><input name="site_name" required maxLength={120} placeholder="e.g. Corporate headquarters"/></InputField>
      <InputField label="Region code" required><input name="region_code" required maxLength={30} placeholder="e.g. NCR or Region IV-A"/></InputField>
      <div className="field-span"><InputField label="Site address" required><textarea name="site_address" required rows={2} maxLength={1000} placeholder="Deployment site’s full address"/></InputField></div>
      <InputField label="Post name" required><input name="post_name" required maxLength={100} placeholder="e.g. Main entrance"/></InputField>
      <InputField label="Required guards" required><input name="required_guards" type="number" required min={1} max={999} step={1} placeholder="Number of guards for this post"/></InputField>
    </div></Section>
    <div className="form-actions"><button type="reset" className="button secondary" onClick={() => { setError(""); setSuccess(""); }}>Clear form</button><button type="submit" className="button primary">Register client & site</button></div>
    {success && saved && <Section title="Registration saved"><Facts items={[["Client", saved.company], ["Site", saved.site], ["Post", saved.post], ["Required guards", saved.guards]]}/></Section>}
  </form></>;
}
