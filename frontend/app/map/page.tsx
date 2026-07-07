"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LocateFixed, Search, X } from "lucide-react";
import StationCard from "@/components/StationCard";
import { api } from "@/lib/api";
import { departmentCodeFromAddress, FRENCH_DEPARTMENTS } from "@/lib/departments";
import { getCurrentPosition } from "@/lib/geolocation";
import { STATION_STATUS_LABELS, Station, StationStatus } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];
const NEARBY_RADIUS_KM = 30;
const PAGE_SIZE = 15;

interface IpLocateResponse {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
}

interface AddressResult {
  label: string;
  latitude: number;
  longitude: number;
}

export default function MapPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [center, setCenter] = useState<[number, number]>(PARIS_CENTER);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [statusFilter, setStatusFilter] = useState<StationStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Only offer zones that actually have a station in the currently loaded set — a
  // dropdown listing all ~100 French departments when the data only covers 3 would be
  // mostly dead ends. This scales automatically as VoltMate's real coverage grows.
  const availableZones = useMemo(() => {
    const codes = new Set<string>();
    for (const s of stations) {
      const code = departmentCodeFromAddress(s.address);
      if (code) codes.add(code);
    }
    return Array.from(codes).sort();
  }, [stations]);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (statusFilter !== "all" && s.current_status !== statusFilter) return false;
      if (zoneFilter !== "all" && departmentCodeFromAddress(s.address) !== zoneFilter) return false;
      return true;
    });
  }, [stations, statusFilter, zoneFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredStations.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedStations = filteredStations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, zoneFilter, stations]);

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
          `Aucune borne trouvée à moins de ${NEARBY_RADIUS_KM} km de cette position. Voici toutes les bornes disponibles.`
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
    setSearchMarker(null);
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

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setResultsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<AddressResult[]>(`/geo/search?q=${encodeURIComponent(value)}`);
        setResults(data);
        setResultsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  }

  async function pickResult(result: AddressResult) {
    setQuery(result.label);
    setResultsOpen(false);
    setError(null);
    setNotice(null);
    setSearchMarker([result.latitude, result.longitude]);
    await loadNearby(result.latitude, result.longitude);
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setResultsOpen(false);
    setSearchMarker(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Bornes proches</h1>
      </div>

      <div className="relative z-[600]">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-volt-500">
          <Search className="h-4 w-4 shrink-0 text-ink-500" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setResultsOpen(true)}
            placeholder="Chercher une adresse, une ville, un secteur..."
            className="w-full border-none bg-transparent text-sm outline-none focus:ring-0"
          />
          {searching && <span className="text-xs text-ink-500">...</span>}
          {query && (
            <button onClick={clearSearch} aria-label="Effacer la recherche" className="text-ink-400 hover:text-ink-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {resultsOpen && results.length > 0 && (
          <ul className="absolute mt-1 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => pickResult(r)}
                  className="w-full px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-volt-50"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-ink-500">{notice}</p>}

      <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <MapView stations={filteredStations} center={center} userPosition={userPosition} searchMarker={searchMarker} />
        <button
          onClick={useMyPosition}
          disabled={locating}
          aria-label="Utiliser ma position précise"
          className="absolute bottom-4 right-4 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-white text-volt-600 shadow-lg ring-1 ring-black/5 transition hover:bg-volt-50 disabled:opacity-60"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StationStatus | "all")}
          className="input flex-1 text-sm"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="input flex-1 text-sm"
        >
          <option value="all">Tous les secteurs</option>
          {availableZones.map((code) => (
            <option key={code} value={code}>
              {FRENCH_DEPARTMENTS[code] || code} ({code})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-ink-500">Chargement des bornes...</p>}
        {!loading && filteredStations.length === 0 && (
          <p className="text-sm text-ink-500">
            {stations.length === 0
              ? "Aucune borne trouvée. Soyez le premier à en ajouter une !"
              : "Aucune borne ne correspond à ces filtres."}
          </p>
        )}
        {paginatedStations.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <span className="text-sm text-ink-500">
            Page {currentPage} / {pageCount} ({filteredStations.length} bornes)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage === pageCount}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
