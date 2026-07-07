"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { REPORT_STATUS_LABELS, ReportStatus } from "@/lib/types";

const STATUS_OPTIONS = Object.entries(REPORT_STATUS_LABELS) as [ReportStatus, string][];

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>("working");
  const [comment, setComment] = useState("");
  const [waitingTime, setWaitingTime] = useState("");
  const [observedPower, setObservedPower] = useState("");
  const [observedPrice, setObservedPrice] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Location is optional context for a report: if the browser can't or
    // won't provide it (no HTTPS, permission denied, etc.), submit without
    // it rather than blocking the report entirely.
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await getCurrentPosition();
      lat = pos.latitude;
      lng = pos.longitude;
    } catch {
      // ignored: position stays null
    }

    try {
      await api.post<{ id: string }>(`/stations/${params.id}/reports`, {
        status,
        comment: comment || null,
        waiting_time_minutes: waitingTime ? parseInt(waitingTime, 10) : null,
        observed_power_kw: observedPower ? parseFloat(observedPower) : null,
        observed_price: observedPrice || null,
        latitude: lat,
        longitude: lng,
      });

      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);
        await api.post(`/stations/${params.id}/photos`, formData);
      }

      router.push(`/station/${params.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'envoi du signalement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink-900">Signaler un problème</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-4">
        <div>
          <label className="label">Statut de la borne</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Commentaire</label>
          <textarea
            className="input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Décrivez ce que vous avez constaté..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Temps d&apos;attente (min)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={waitingTime}
              onChange={(e) => setWaitingTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Puissance observée (kW)</label>
            <input
              className="input"
              type="number"
              step="any"
              value={observedPower}
              onChange={(e) => setObservedPower(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Prix observé</label>
          <input
            className="input"
            value={observedPrice}
            onChange={(e) => setObservedPrice(e.target.value)}
            placeholder="0.45€/kWh"
          />
        </div>

        <div>
          <label className="label">Photo (optionnel)</label>
          <input
            className="input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Envoi..." : "Envoyer le signalement"}
        </button>
      </form>
    </div>
  );
}
