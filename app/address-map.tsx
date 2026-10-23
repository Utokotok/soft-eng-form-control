"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
export type Pin = { latitude: number; longitude: number };
export function isValidPin(pin: Pin | null): pin is Pin { return Boolean(pin && Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude) && Math.abs(pin.latitude) <= 90 && Math.abs(pin.longitude) <= 180); }
export function AddressMap({ value, onChange, label = "Home location" }: { value: Pin | null; onChange: (pin: Pin) => void; label?: string }) {
  const id = useId();
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const changed = useRef(onChange);
  changed.current = onChange;
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then(L => {
      if (cancelled || !element.current) return;
      const view = L.map(element.current, { scrollWheelZoom: false }).setView(value ? [value.latitude, value.longitude] : [14.5995, 120.9842], value ? 17 : 11);
      map.current = view;
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(view);
      tiles.on("tileerror", () => setError("Map tiles could not load. Check your connection and retry."));
      const icon = L.divIcon({ className: "address-pin", html: '<span aria-hidden="true">●</span>', iconSize: [30, 38], iconAnchor: [15, 30] });
      const place = (latitude: number, longitude: number) => {
        const normalized = L.latLng(latitude, longitude).wrap(); latitude = Math.max(-90, Math.min(90, normalized.lat)); longitude = normalized.lng;
        if (marker.current) marker.current.setLatLng([latitude, longitude]);
        else { marker.current = L.marker([latitude, longitude], { draggable: true, icon, title: `${label} pin — drag to adjust` }).addTo(view); marker.current.on("dragend", () => { const point = marker.current!.getLatLng().wrap(); place(point.lat, point.lng); }); }
        changed.current({ latitude, longitude });
      };
      view.on("click", event => place(event.latlng.lat, event.latlng.lng));
      if (value) place(value.latitude, value.longitude);
      setReady(true);
    }).catch(() => setError("The map could not be loaded."));
    return () => { cancelled = true; map.current?.remove(); map.current = null; marker.current = null; };
  }, []);
  async function pinCenter() {
    if (!map.current) return;
    const L = await import("leaflet");
    map.current.fire("click", { latlng: L.latLng(map.current.getCenter()) });
  }
  return <div className="address-map"><div className="map-label"><strong id={`${id}-label`}><MapPin size={15}/>{label} <span>*</span></strong><span id={`${id}-help`}>Click or drag. Keyboard: arrows to pan, +/− to zoom, Enter to pin.</span></div><div ref={element} className="map-canvas" tabIndex={0} role="region" aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`} onKeyDownCapture={event => { if (event.target === event.currentTarget && event.key === "Enter") { event.preventDefault(); void pinCenter(); } }}/><div className="map-footer"><span role="status">{value ? `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}` : "No location selected"}</span><button className="button secondary" type="button" disabled={!ready} onClick={pinCenter}>Pin map center</button></div>{error && <p className="error-text" role="alert">{error}</p>}</div>;
}
