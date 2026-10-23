"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
export type Pin = { latitude: number; longitude: number };
export function AddressMap({ value, onChange, label = "Home location" }: { value: Pin | null; onChange: (pin: Pin) => void; label?: string }) {
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
        if (marker.current) marker.current.setLatLng([latitude, longitude]);
        else { marker.current = L.marker([latitude, longitude], { draggable: true, icon, title: `${label} pin — drag to adjust` }).addTo(view); marker.current.on("dragend", () => { const point = marker.current!.getLatLng(); changed.current({ latitude: point.lat, longitude: point.lng }); }); }
        changed.current({ latitude, longitude });
      };
      view.on("click", event => place(event.latlng.lat, event.latlng.lng));
      view.on("keypress", event => { if (event.originalEvent.key === "Enter") { const point = view.getCenter(); place(point.lat, point.lng); } });
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
  return <div className="address-map"><div className="map-label"><strong><MapPin size={15}/>{label} <span>*</span></strong><span>Click the map or drag the pin.</span></div><div ref={element} className="map-canvas" aria-label={`${label} map. Arrow keys to pan, plus and minus to zoom, Enter to place a pin.`}/><div className="map-footer"><span>{value ? `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}` : "No location selected"}</span><button className="button secondary" type="button" disabled={!ready} onClick={pinCenter}>Pin map center</button></div>{error && <p className="error-text" role="alert">{error}</p>}</div>;
}
