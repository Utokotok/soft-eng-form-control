"use client";
import { useState } from "react";
import { CameraCapture, type CapturedPhoto } from "./camera-capture";
import { GUARD, shiftForToday, stamp, useStore, updateStore, saveFiles, uid, type AttendanceEvent } from "./domain";
import { Heading, Section, Facts, Notice } from "./form-ui";

export function AttendanceForm() {
  const store = useStore();
  const shift = shiftForToday();
  const events = store.events.filter(event => event.employee_id === GUARD.employee_id && event.shift_assignment_id === shift.shift_assignment_id && event.is_current);
  const timedIn = events.some(event => event.event_type === "time_in");
  const timedOut = events.some(event => event.event_type === "time_out");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setError(""); setSuccess("");
    if (timedOut) return setError("Attendance for this shift is already complete.");
    if (!photo) return setError("Capture a duty photo with location before submitting.");
    if (!acknowledged) return setError("Confirm that the photo represents your attendance.");
    if (Date.now() - Date.parse(photo.metadata.captured_at) > 5 * 60 * 1000) return setError("The photo is more than five minutes old. Capture a new duty photo.");
    setBusy(true);
    try {
      const photoId = uid("PHOTO");
      await saveFiles([{ id: photoId, blob: photo.blob }]);
      const metadata = photo.metadata;
      updateStore(current => {
        const currentEvents = current.events.filter(event => event.shift_assignment_id === shift.shift_assignment_id && event.is_current);
        if (currentEvents.some(event => event.event_type === "time_out") || timedIn !== currentEvents.some(event => event.event_type === "time_in")) throw new Error("Attendance changed in another window. Refresh and capture again.");
        if (currentEvents.length && Date.parse(metadata.captured_at) <= Date.parse(currentEvents[0].occurred_at)) throw new Error("Time out must be later than time in.");
        const event: AttendanceEvent = { dtr_event_id: uid("EVT"), dtr_id: `DTR-${shift.shift_assignment_id}`, shift_assignment_id: shift.shift_assignment_id, employee_id: GUARD.employee_id, event_type: timedIn ? "time_out" : "time_in", occurred_at: metadata.captured_at, received_at: null, photo_file_id: photoId, latitude: metadata.latitude, longitude: metadata.longitude, location_accuracy_m: metadata.location_accuracy_m, device_metadata: metadata.device_metadata, photo_metadata: metadata.photo_metadata, verification_status: "pending", is_current: true, supersedes_event_id: null };
        return { ...current, events: [...current.events, event] };
      });
      setSuccess(`${timedIn ? "Time out" : "Time in"} recorded. Pending attendance verification.`); setPhoto(null); setAcknowledged(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Attendance could not be saved."); }
    finally { setBusy(false); }
  }
  return <><Heading title="My attendance">Capture your duty photo to record time in or time out.</Heading><div className="production-form form-main">
    <Section title="Today’s assignment"><div className="assignment-banner"><div className="guard-avatar">RD</div><div><strong>{GUARD.name}</strong><span>{GUARD.employee_number}</span></div><span className="status-pill success">{timedOut ? "Completed" : timedIn ? "On duty" : "Not timed in"}</span></div><Facts items={[["Deployment site", shift.site], ["Post", shift.post], ["Shift starts", stamp(shift.scheduled_start)], ["Shift ends", stamp(shift.scheduled_end)]]}/></Section>
    <Notice message={error}/><Notice message={success} success/>
    {!timedOut && <Section title={timedIn ? "Time out" : "Time in"}><CameraCapture value={photo} onChange={setPhoto}/><label className="native-check"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>I confirm this photo reflects my actual duty attendance.</span></label><div className="form-actions"><button className="button primary" type="button" disabled={busy || !photo || !acknowledged} onClick={submit}>{busy ? "Saving…" : timedIn ? "Record time out" : "Record time in"}</button></div></Section>}
    {events.length > 0 && <Section title="Shift activity"><div className="activity-list">{events.map(event => <div key={event.dtr_event_id}><strong>{event.event_type === "time_in" ? "Time in" : "Time out"}</strong><span>{stamp(event.occurred_at)}</span><span className="neutral-status">Pending verification</span></div>)}</div></Section>}
  </div></>;
}
