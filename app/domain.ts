"use client";

import { useEffect, useState } from "react";
import type { OperationsData } from "./operations-domain";

export const GUARD = { employee_id: 182, employee_number: "GD-0182", name: "Roberto Dela Cruz", employment_status: "active", license_expires_on: "2027-08-18" };
export const OFFICER = { user_id: 12, name: "Jamie Mendoza" };
export function today() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); }
export function stamp(value: string) { return new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
export type Issuance = { issuance_id: string; request_item_id: number; equipment_id: number; employee_id: number; issued_at: string; receipt_number: string; receipt_file_id?: string };
export type ReturnRecord = { equipment_return_id: string; issuance_id: string; processed_by: number; processed_at: string; observed_asset_tag: string; observed_condition: string; ammunition_returned: number | null; decision: string; notes: string };
export type AttendanceEvent = { dtr_event_id: string; dtr_id: string; shift_assignment_id: string; employee_id: number; event_type: "time_in" | "time_out"; occurred_at: string; received_at: null; photo_file_id: string; latitude: number; longitude: number; location_accuracy_m: number; device_metadata: Record<string, unknown>; photo_metadata: Record<string, unknown>; verification_status: "pending"; is_current: boolean; supersedes_event_id: null };
export type Application = { application_id: string; person_id: string; application_number: string; status: "submitted"; submitted_at: string; person: Record<string, string>; personnel_documents: { document_type: string; file_id: string; document_number: string; issued_on: string; expires_on: string; verification_status: "pending" }[]; home_location: { latitude: number; longitude: number }; phs_data: Record<string, unknown>; intake_metadata: { prefill_source: "dummy" | "text" | "manual"; manually_checked_by: number; manually_checked_at: string }; decision_notes: string };
export type Incident = { equipment_incident_id: string; equipment_return_id: string; incident_type: string; details: string; status: "pending_review"; negligence_decision: null; approved_charge: null; repair_action: null };
export type StaffAccount = { person_id: string; user_id: string; person: { first_name: string; middle_name: string; last_name: string; name_suffix: string; birth_date: string; home_address: string; contact_number: string; status: "active" }; email: string; role_id: string; status: "pending_email_verification"; home_location: { latitude: number; longitude: number }; created_at: string; created_by: number };
export type Store = { issuances: Issuance[]; returns: ReturnRecord[]; events: AttendanceEvent[]; applications: Application[]; incidents: Incident[]; operations?: OperationsData; staffAccounts?: StaffAccount[] };
const KEY = "red-eagle-domain-v2";
const initial: Store = { issuances: [{ issuance_id: "ISS-0921", request_item_id: 103, equipment_id: 48, employee_id: 182, issued_at: "2026-10-21T05:30:00+08:00", receipt_number: "RCPT-0921" }], returns: [], events: [], applications: [], incidents: [] };
export function readStore(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || "null") || initial; } catch { return initial; }
}
export function updateStore(change: (current: Store) => Store) { const next = change(readStore()); localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new Event("red-eagle-data")); return next; }
export function useStore() {
  const [store, setStore] = useState<Store>(initial);
  useEffect(() => { const sync = () => setStore(readStore()); sync(); window.addEventListener("red-eagle-data", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("red-eagle-data", sync); window.removeEventListener("storage", sync); }; }, []);
  return store;
}
export function uid(prefix: string) { return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }

function openFiles(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { const request = indexedDB.open("red-eagle-files", 1); request.onupgradeneeded = () => request.result.createObjectStore("files"); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("File storage is unavailable.")); });
}
export async function saveFiles(files: { id: string; blob: Blob }[]) {
  const db = await openFiles();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction("files", "readwrite"); files.forEach(file => tx.objectStore("files").put(file.blob, file.id)); tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error("Unable to store files. Please try again.")); tx.onabort = () => reject(new Error("Unable to store files.")); });
  db.close();
}
