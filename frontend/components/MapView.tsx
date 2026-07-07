"use client";

import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import Link from "next/link";
import { STATION_STATUS_COLORS, STATION_STATUS_LABELS, Station } from "@/lib/types";

// A rounded map-pin (matches the lucide "map-pin" glyph used elsewhere in the app) with a
// small bolt glyph inside, colored by reliability status — closer to how dedicated EV apps
// (e.g. Allego) mark chargers than a plain dot.
function statusIcon(station: Station) {
  const color = STATION_STATUS_COLORS[station.current_status];
  const html = `
    <div style="filter: drop-shadow(0 2px 4px rgba(15,23,42,0.35))">
      <svg width="34" height="42" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C6.75 0 2.5 4.24 2.5 9.46 2.5 15.6 12 28 12 28s9.5-12.4 9.5-18.54C21.5 4.24 17.25 0 12 0z"
          fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="9.5" r="5.6" fill="white"/>
        <path transform="translate(8.55,6.05) scale(0.145)"
          d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
          fill="${color}"/>
      </svg>
    </div>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -38],
  });
}

const searchPinIcon = L.divIcon({
  className: "",
  html: `
    <div style="filter: drop-shadow(0 2px 4px rgba(15,23,42,0.35))">
      <svg width="30" height="38" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C6.75 0 2.5 4.24 2.5 9.46 2.5 15.6 12 28 12 28s9.5-12.4 9.5-18.54C21.5 4.24 17.25 0 12 0z"
          fill="#0f172a" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="9.5" r="3" fill="white"/>
      </svg>
    </div>`,
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -34],
});

const youAreHereIcon = L.divIcon({
  className: "",
  html: `
    <div class="relative flex h-5 w-5 items-center justify-center">
      <span class="absolute inset-0 rounded-full bg-sky-500/40 animate-pulse-ring"></span>
      <span class="relative h-3.5 w-3.5 rounded-full bg-sky-500 border-2 border-white shadow-[0_0_0_2px_rgba(14,165,233,0.35)]"></span>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Leaflet measures its container's size once, at creation time. In a Next.js page the
// MapContainer is mounted (via next/dynamic, ssr:false) before the surrounding flex/Tailwind
// layout has necessarily settled into its final size — the map then renders tiles for a
// stale, usually smaller, box, leaving grey/blank corners once the real container grows to
// fill h-[60vh]. invalidateSize() forces Leaflet to re-measure; a ResizeObserver keeps it
// correct across viewport rotation, sidebar toggles, etc., not just the first paint.
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const timeout = setTimeout(() => map.invalidateSize(), 250);

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

interface MapViewProps {
  stations: Station[];
  center: [number, number];
  userPosition?: [number, number] | null;
  searchMarker?: [number, number] | null;
}

export default function MapView({ stations, center, userPosition, searchMarker }: MapViewProps) {
  return (
    <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <ZoomControl position="bottomright" />
      <Recenter center={center} />
      <InvalidateOnResize />
      {userPosition && (
        <Marker position={userPosition} icon={youAreHereIcon} zIndexOffset={-100}>
          <Popup>Vous êtes ici (approximatif)</Popup>
        </Marker>
      )}
      {searchMarker && (
        <Marker position={searchMarker} icon={searchPinIcon}>
          <Popup>Adresse recherchée</Popup>
        </Marker>
      )}
      {stations.map((station) => (
        <Marker key={station.id} position={[station.latitude, station.longitude]} icon={statusIcon(station)}>
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold">{station.name}</p>
              <p className="text-xs text-slate-500">{station.address}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: STATION_STATUS_COLORS[station.current_status] }}
                />
                {STATION_STATUS_LABELS[station.current_status]} · {station.reliability_score}/100
              </p>
              <Link href={`/station/${station.id}`} className="mt-2 inline-block text-sm font-medium text-volt-600">
                Voir la fiche →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
