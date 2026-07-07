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

interface IpLocateResponse {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
}

export default function MapPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [center, setCenter] = useState<[number, number]>(PARIS_CENTER);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
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
    // Best-effort, silent IP-based approximate location on load — no permission
    // prompt, unlike GPS, so the map starts centered near the visitor instead of
    // always defaulting to Paris. Precise GPS (below) remains available and takes
    // over the "you are here" marker once the user opts in.
    (async () => {
      try {
        const geo = await api.get<IpLocateResponse>("/geo/locate");
        if (geo.latitude !== null && geo.longitude !== null) {
          setUserPosition([geo.latitude, geo.longitude]);
          await loadNearby(geo.latitude, geo.longitude);
          return;
        }
      } catch {
        // fall through to default view below
      }
      await loadAll();
    })();
  }, []);

  async function useMyPosition() {
    setLocating(true);
    setError(null);
    setNotice(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      setUserPosition([latitude, longitude]);
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
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-ink-500">{notice}</p>}

      <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <MapView stations={stations} center={center} userPosition={userPosition} />
        <button
          onClick={useMyPosition}
          disabled={locating}
          aria-label="Utiliser ma position précise"
          className="absolute bottom-4 right-4 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-white text-volt-600 shadow-lg ring-1 ring-black/5 transition hover:bg-volt-50 disabled:opacity-60"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
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
