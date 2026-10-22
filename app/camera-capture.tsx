"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import type { CaptureMetadata } from "./domain";
import { Facts, Notice } from "./form-ui";
import { encodeCapture } from "./capture-metadata";
export type CapturedPhoto = { blob: Blob; url: string; metadata: CaptureMetadata };

export function CameraCapture({ value, onChange }: { value: CapturedPhoto | null; onChange: (photo: CapturedPhoto | null) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function stop() { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setActive(false); }
  useEffect(() => { alive.current = true; return () => { alive.current = false; stream.current?.getTracks().forEach(track => track.stop()); }; }, []);
  useEffect(() => { if (active && video.current) video.current.srcObject = stream.current; }, [active]);
  useEffect(() => { const url = value?.url; return () => { if (url) URL.revokeObjectURL(url); }; }, [value]);

  async function open() {
    setError(""); setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access requires HTTPS or localhost and a supported browser.");
      const source = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (!alive.current) { source.getTracks().forEach(track => track.stop()); return; }
      stream.current = source; onChange(null); setActive(true);
    } catch (e) { setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Camera access was denied. Enable camera access for this site and try again." : e instanceof Error ? e.message : "Unable to open the camera."); }
    finally { if (alive.current) setBusy(false); }
  }
  async function capture() {
    if (!video.current?.videoWidth) { setError("Wait for the camera image before capturing."); return; }
    setError(""); setBusy(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Location is unavailable in this browser."));
        navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("Location could not be captured. Enable location access and retry.")), { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
      });
      if (!alive.current || !video.current || !stream.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.current.videoWidth; canvas.height = video.current.videoHeight;
      const context = canvas.getContext("2d"); if (!context) throw new Error("Camera capture is unavailable.");
      context.drawImage(video.current, 0, 0);
      const capturedAt = new Date();
      const settings = stream.current.getVideoTracks()[0].getSettings();
      const camera = stream.current.getVideoTracks()[0].label || "Browser camera";
      const { latitude, longitude, accuracy } = position.coords;
      const { blob, parsed } = await encodeCapture(canvas.toDataURL("image/jpeg", .9), { capturedAt, latitude, longitude, camera, width: canvas.width, height: canvas.height });
      const metadata: CaptureMetadata = { captured_at: capturedAt.toISOString(), latitude: parsed.latitude, longitude: parsed.longitude, location_accuracy_m: accuracy, device_metadata: { camera_label: camera, width: settings.width, height: settings.height, facing_mode: settings.facingMode, browser: navigator.userAgent }, photo_metadata: { ...parsed, metadata_source: "application_written_exif", timestamp_timezone: "UTC", capture_timestamp: capturedAt.toISOString(), geolocation_sample_at: new Date(position.timestamp).toISOString(), location_accuracy_m: accuracy } };
      if (alive.current) onChange({ blob, url: URL.createObjectURL(blob), metadata });
      stop();
    } catch (e) { setError(e instanceof Error ? e.message : "Capture failed. Please try again."); }
    finally { if (alive.current) setBusy(false); }
  }
  return <div className="camera-widget"><Notice message={error}/>{value ? <>
    <img className="capture-image" src={value.url} alt="Captured duty photo"/>
    <Facts items={[["Captured at", new Date(value.metadata.captured_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })], ["Location", `${value.metadata.latitude.toFixed(6)}, ${value.metadata.longitude.toFixed(6)}`], ["Location accuracy", `±${Math.round(value.metadata.location_accuracy_m)} m`]]}/>
    <button type="button" className="button secondary" onClick={open}><RotateCcw size={16}/>Retake photo</button>
  </> : active ? <><video ref={video} autoPlay muted playsInline className="capture-image"/><div className="camera-actions"><button type="button" className="button secondary" onClick={stop} disabled={busy}>Close camera</button><button type="button" className="button primary" onClick={capture} disabled={busy}><Camera size={16}/>{busy ? "Capturing location…" : "Capture photo"}</button></div></> : <div className="camera-empty"><Camera size={30}/><strong>Capture your duty photo</strong><p>Your capture time and location are recorded automatically.</p><button type="button" className="button secondary" onClick={open} disabled={busy}><Camera size={16}/>{busy ? "Opening camera…" : "Open camera"}</button></div>}</div>;
}
