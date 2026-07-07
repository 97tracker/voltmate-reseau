"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import type { ConnectorType, Station } from "@/lib/types";

const CONNECTOR_OPTIONS: { value: ConnectorType; label: string }[] = [
  { value: "type2", label: "Type 2" },
  { value: "ccs", label: "CCS" },
  { value: "chademo", label: "CHAdeMO" },
  { value: "other", label: "Autre" },
];

export default function NewStationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    operator: "",
    connector_type: "type2" as ConnectorType,
    advertised_power_kw: "",
    estimated_price: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  async function useMyPosition() {
    setLocating(true);
    setError(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      setForm((f) => ({
        ...f,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'obtenir votre position.");
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const station = await api.post<Station>("/stations", {
        name: form.name,
        address: form.address,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        operator: form.operator || null,
        connector_type: form.connector_type,
        advertised_power_kw: form.advertised_power_kw ? parseFloat(form.advertised_power_kw) : null,
        estimated_price: form.estimated_price || null,
      });
      router.push(`/station/${station.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création de la borne.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-900">Ajouter une borne</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-4">
        <div>
          <label className="label">Nom de la borne</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Adresse</label>
          <input
            className="input"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Latitude</label>
            <input
              className="input"
              required
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input
              className="input"
              required
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </div>
        </div>
        <button type="button" onClick={useMyPosition} className="btn-secondary" disabled={locating}>
          <LocateFixed className="h-4 w-4" />
          {locating ? "Localisation..." : "Utiliser ma position"}
        </button>
        <div>
          <label className="label">Opérateur</label>
          <input
            className="input"
            value={form.operator}
            onChange={(e) => setForm({ ...form, operator: e.target.value })}
            placeholder="TotalEnergies, Ionity, Freshmile..."
          />
        </div>
        <div>
          <label className="label">Type de prise</label>
          <select
            className="input"
            value={form.connector_type}
            onChange={(e) => setForm({ ...form, connector_type: e.target.value as ConnectorType })}
          >
            {CONNECTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Puissance (kW)</label>
            <input
              className="input"
              type="number"
              step="any"
              value={form.advertised_power_kw}
              onChange={(e) => setForm({ ...form, advertised_power_kw: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Prix (optionnel)</label>
            <input
              className="input"
              value={form.estimated_price}
              onChange={(e) => setForm({ ...form, estimated_price: e.target.value })}
              placeholder="0.45€/kWh"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Création..." : "Ajouter la borne"}
        </button>
      </form>
    </div>
  );
}
