"use client";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import Link from "next/link";
import { STATION_STATUS_COLORS, Station } from "@/lib/types";

function statusIcon(station: Station) {
  const color = STATION_STATUS_COLORS[station.current_status];
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface MapViewProps {
  stations: Station[];
  center: [number, number];
}

export default function MapView({ stations, center }: MapViewProps) {
  return (
    <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      {stations.map((station) => (
        <Marker key={station.id} position={[station.latitude, station.longitude]} icon={statusIcon(station)}>
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold">{station.name}</p>
              <p className="text-xs text-slate-500">{station.address}</p>
              <p className="mt-1 text-xs">Score fiabilité : {station.reliability_score}/100</p>
              <Link href={`/station/${station.id}`} className="mt-2 inline-block text-sm font-medium text-green-600">
                Voir la fiche →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
