"use client";
import { useState, type FormEvent } from "react";
import { AddressMap, isValidPin, type Pin } from "./address-map";
import { Heading, Section, InputField, Notice, SuccessDialog } from "./form-ui";
import { updateStore, uid, OFFICER, today, type StaffAccount } from "./domain";

const roles = [{ id: "hr", name: "Human Resources" }, { id: "finance", name: "Finance" }, { id: "operations", name: "Operations" }, { id: "logistics", name: "Logistics" }];

export function StaffRegistrationForm() {
  const [pin, setPin] = useState<Pin | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formKey, setFormKey] = useState(0);
  function clear() { setFormKey(current => current + 1); setPin(null); setError(""); setSuccess(""); requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[name="first_name"]')?.focus()); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) || "").trim();
    for (const name of ["first_name", "last_name", "home_address", "contact_number", "email", "role_id"]) {
      if (!text(name)) { setError("Complete the required staff details."); const input = form.elements.namedItem(name); if (input instanceof HTMLElement) input.focus(); return; }
    }
    if (text("birth_date") >= today()) return setError("Birth date must be in the past.");
    if (!isValidPin(pin)) return setError("Pin the staff member’s home location on the map.");
    if (!roles.some(role => role.id === text("role_id"))) return setError("Select a permitted staff role.");
    try {
      const record: StaffAccount = {
        person_id: uid("PERSON"), user_id: uid("USER"),
        person: { first_name: text("first_name"), middle_name: text("middle_name"), last_name: text("last_name"), name_suffix: text("name_suffix"), birth_date: text("birth_date"), home_address: text("home_address"), contact_number: text("contact_number"), status: "active" },
        email: text("email").toLowerCase(), role_id: text("role_id"), status: "pending_email_verification", home_location: pin,
        created_at: new Date().toISOString(), created_by: OFFICER.user_id,
      };
      updateStore(current => {
        const existing = current.staffAccounts || [];
        if (existing.some(staff => staff.email.toLowerCase() === record.email)) throw new Error("This email address is already registered.");
        if (existing.some(staff => staff.person.first_name.toLowerCase() === record.person.first_name.toLowerCase() && staff.person.last_name.toLowerCase() === record.person.last_name.toLowerCase() && staff.person.birth_date === record.person.birth_date)) throw new Error("A staff record with this name and birth date already exists.");
        return { ...current, staffAccounts: [...existing, record] };
      });
      setSuccess(`${record.person.first_name} ${record.person.last_name} registered as ${roles.find(role => role.id === record.role_id)!.name}. Account pending email verification.`);
      setFormKey(current => current + 1); setPin(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to register this staff member."); }
  }
  return <><Heading title="Staff account registration">Create an administrative staff account and assign its access role.</Heading><form key={formKey} className="production-form form-main" onSubmit={submit}>
    <Notice message={error}/><SuccessDialog title="Staff account registered" message={success} onDismiss={() => setSuccess("")}/>
    <Section title="Personal information"><div className="field-grid">
      <InputField label="First name" required><input name="first_name" required maxLength={80} autoComplete="given-name"/></InputField>
      <InputField label="Last name" required><input name="last_name" required maxLength={80} autoComplete="family-name"/></InputField>
      <InputField label="Middle name"><input name="middle_name" maxLength={80} autoComplete="additional-name"/></InputField>
      <InputField label="Name suffix"><select name="name_suffix" defaultValue=""><option value="">None</option><option>Jr.</option><option>Sr.</option><option>II</option><option>III</option><option>IV</option><option>V</option></select></InputField>
      <InputField label="Birth date" required><input name="birth_date" type="date" required max={today()}/></InputField>
      <InputField label="Contact number" required><input name="contact_number" type="tel" required pattern="[+0-9 ()-]{7,30}" maxLength={30} autoComplete="tel" placeholder="e.g. +63 912 345 6789"/></InputField>
      <div className="field-span"><InputField label="Home address" required><textarea name="home_address" rows={2} required maxLength={1000} autoComplete="street-address" placeholder="House / unit, street, barangay, city, province"/></InputField></div>
      <div className="field-span"><AddressMap key={`staff-map-${formKey}`} value={pin} onChange={setPin}/></div>
    </div></Section>
    <Section title="Account access"><div className="field-grid">
      <InputField label="Email address" required><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="name@company.com"/></InputField>
      <InputField label="Assigned role" required><select name="role_id" required defaultValue=""><option value="">Select a role</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></InputField>
    </div><p className="time-zone-note">Email verification is required before the account can be activated.</p></Section>
    <div className="form-actions"><button type="button" className="button secondary" onClick={clear}>Clear form</button><button type="submit" className="button primary">Register staff account</button></div>
  </form></>;
}
