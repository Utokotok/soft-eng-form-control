"use client";

import { useState, type FormEvent } from "react";
import { Heading, Section, InputField, Notice, Facts, SuccessDialog } from "./form-ui";
import { uid, updateStore } from "./domain";
import { operations, type Client, type ClientSite, type Post } from "./operations-domain";
import { AddressMap, type Pin } from "./address-map";
export { DeploymentForm } from "./deployment-form";


export function ClientSiteForm() {
  const [pin, setPin] = useState<Pin | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saved, setSaved] = useState<{ company: string; site: string; post: string; guards: number; location: string } | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = event.currentTarget; if (!form.reportValidity()) return;
    if (!pin || !Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude) || Math.abs(pin.latitude) > 90 || Math.abs(pin.longitude) > 180) { setError("Pin the site’s location on the map before registering."); return; }
    const payload = new FormData(form);
    const text = (name: string) => String(payload.get(name) || "").trim();
    for (const name of ["client_name", "business_address", "contact_name", "contact_number", "site_name", "site_address", "region_code", "post_name"]) if (!text(name)) { setError("Complete the required client, site, and post details."); const input = form.elements.namedItem(name); if (input instanceof HTMLElement) input.focus(); return; }
    const requiredGuards = Number(payload.get("required_guards"));
    if (!Number.isInteger(requiredGuards) || requiredGuards < 1 || requiredGuards > 999) return setError("Required guards must be a whole number between 1 and 999.");
    try {
      const clientId = uid("CLIENT"), siteId = uid("SITE"), postId = uid("POST");
      const client: Client = { client_id: clientId, client_name: text("client_name"), business_address: text("business_address"), contact_name: text("contact_name"), contact_number: text("contact_number"), contact_email: text("contact_email") || null, status: "active", created_at: new Date().toISOString() };
      const site: ClientSite = { site_id: siteId, client_id: clientId, site_name: text("site_name"), site_address: text("site_address"), site_location: pin, region_code: text("region_code"), status: "active" };
      const post: Post = { post_id: postId, site_id: siteId, post_name: text("post_name"), required_guards: requiredGuards, status: "active" };
      updateStore(current => {
        const latest = operations(current);
        if (latest.clients.some(row => row.client_name.trim().toLowerCase() === client.client_name.toLowerCase())) throw new Error("A client with this company name already exists. Review the existing client record.");
        return { ...current, operations: { ...latest, clients: [...latest.clients, client], sites: [...latest.sites, site], posts: [...latest.posts, post] } };
      });
      setSaved({ company: client.client_name, site: site.site_name, post: post.post_name, guards: post.required_guards, location: `${pin.latitude.toFixed(6)}, ${pin.longitude.toFixed(6)}` });
      setSuccess(`${client.client_name} registered. The new site and post are available for guard deployment.`);
      form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to register this client."); }
  }
  return <><Heading title="Client & site registration">Register a new client, their first site, and its guard post.</Heading><form className="production-form form-main" onSubmit={submit} onReset={() => { setPin(null); setMapKey(current => current + 1); }}>
    <Notice message={error}/><SuccessDialog title="Client & site registered" message={success} onDismiss={() => setSuccess("")}>{saved && <Facts items={[["Client", saved.company], ["Site", saved.site], ["Post", saved.post], ["Required guards", saved.guards], ["Site coordinates", saved.location]]}/>}</SuccessDialog>
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
      <div className="field-span"><AddressMap key={mapKey} label="Site location" value={pin} onChange={setPin}/></div>
      <InputField label="Post name" required><input name="post_name" required maxLength={100} placeholder="e.g. Main entrance"/></InputField>
      <InputField label="Required guards" required><input name="required_guards" type="number" required min={1} max={999} step={1} placeholder="Number of guards for this post"/></InputField>
    </div></Section>
    <div className="form-actions"><button type="reset" className="button secondary" onClick={() => { setError(""); setSuccess(""); }}>Clear form</button><button type="submit" className="button primary">Register client & site</button></div>
  </form></>;
}
