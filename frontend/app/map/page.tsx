"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LocateFixed } from "lucide-react";
import StationCard from "@/components/StationCard";
import { api } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Station } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];
const NEARBY_RADIUS_KM = 30;

export default function MapPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [center, setCenter] = useState<[number, number]>(PARIS_CENTER);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const data = await api.get<Station[]>("/stations");
      setStations(data);
    } catch {
      setError("Impossible de charger les bornes.");
    } finally {
      setLoading(false);
    }
  }

  async function loadNearby(lat: number, lng: number) {
    setLoading(true);
    try {
      const data = await api.get<Station[]>(
        `/stations/nearby?lat=${lat}&lng=${lng}&radius_km=${NEARBY_RADIUS_KM}`
      );
      setCenter([lat, lng]);

      if (data.length === 0) {
        // No demo/real station within range of the visitor's actual position:
        // fall back to showing every station rather than an empty map, which
        // otherwise reads as "the map is broken".
        setNotice(
          `Aucune borne trouvée à moins de ${NEARBY_RADIUS_KM} km de votre position. Voici toutes les bornes disponibles.`
        );
        const all = await api.get<Station[]>("/stations");
        setStations(all);
      } else {
        setNotice(null);
        setStations(data);
      }
    } catch {
      setError("Impossible de charger les bornes proches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function useMyPosition() {
    setLocating(true);
    setError(null);
    setNotice(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      await loadNearby(latitude, longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'obtenir votre position.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Bornes proches</h1>
        <button onClick={useMyPosition} className="btn-secondary text-sm" disabled={locating}>
          <LocateFixed className="h-4 w-4" />
          {locating ? "Localisation..." : "Utiliser ma position"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-ink-500">{notice}</p>}

      <div className="h-72 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <MapView stations={stations} center={center} />
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-ink-500">Chargement des bornes...</p>}
        {!loading && stations.length === 0 && (
          <p className="text-sm text-ink-500">Aucune borne trouvée. Soyez le premier à en ajouter une !</p>
        )}
        {stations.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
}
