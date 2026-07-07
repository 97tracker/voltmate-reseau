"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geolocation";
import { REPORT_TAG_ICONS, REPORT_TAG_LABELS, REPORT_TAG_STYLES, REPORT_TAG_STYLES_ACTIVE } from "@/lib/reportTags";
import type { ReportStatus } from "@/lib/types";

const TAGS = Object.keys(REPORT_TAG_LABELS) as ReportStatus[];

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [waitingTime, setWaitingTime] = useState("");
  const [observedPower, setObservedPower] = useState("");
  const [observedPrice, setObservedPrice] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!status) {
      setError("Choisissez ce que vous avez constaté sur la borne.");
      return;
    }
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
      <h1 className="text-xl font-bold text-ink-900">Qu&apos;avez-vous constaté ?</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {TAGS.map((tag) => {
            const Icon = REPORT_TAG_ICONS[tag];
            const active = status === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setStatus(tag)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center text-xs font-medium transition ${
                  active ? REPORT_TAG_STYLES_ACTIVE[tag] : REPORT_TAG_STYLES[tag]
                }`}
              >
                <Icon className="h-6 w-6" />
                {REPORT_TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="flex items-center justify-center gap-1 text-sm font-medium text-ink-500"
        >
          Ajouter un détail (optionnel)
          <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </button>

        {detailsOpen && (
          <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
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
              <label className="label">Photo</label>
              <input
                className="input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting || !status}>
          {submitting ? "Envoi..." : "Envoyer le signalement"}
        </button>
      </form>
    </div>
  );
}
