"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, QrCode } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { api, qrcodeUrl } from "@/lib/api";
import { REPORT_STATUS_LABELS, StationDetail } from "@/lib/types";

export default function StationDetailPage({ params }: { params: { id: string } }) {
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [chargeMsg, setChargeMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<StationDetail>(`/stations/${params.id}`);
      setStation(data);
    } catch {
      setError("Borne introuvable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/stations/${params.id}/comments`, { content: comment });
      setComment("");
      await load();
    } finally {
      setPosting(false);
    }
  }

  async function iChargedHere() {
    setChargeMsg(null);
    try {
      await api.post(`/stations/${params.id}/reports`, { status: "working" });
      setChargeMsg("Merci ! Signalement enregistré.");
      await load();
    } catch {
      setChargeMsg("Impossible d'enregistrer le signalement.");
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Chargement...</p>;
  if (error || !station) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink-900">{station.name}</h1>
            <p className="text-sm text-ink-500">{station.address}</p>
          </div>
          <StatusBadge status={station.current_status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink-500">Opérateur</dt>
          <dd className="text-right font-medium">{station.operator || "Inconnu"}</dd>
          <dt className="text-ink-500">Type de prise</dt>
          <dd className="text-right font-medium">{station.connector_type.toUpperCase()}</dd>
          <dt className="text-ink-500">Puissance annoncée</dt>
          <dd className="text-right font-medium">
            {station.advertised_power_kw ? `${station.advertised_power_kw} kW` : "Inconnue"}
          </dd>
          <dt className="text-ink-500">Tarif estimé</dt>
          <dd className="text-right font-medium">{station.estimated_price || "Inconnu"}</dd>
          <dt className="text-ink-500">Score de fiabilité</dt>
          <dd className="text-right font-medium">{station.reliability_score}/100</dd>
        </dl>

        <div className="mt-4 flex flex-col gap-2">
          <Link href={`/station/${station.id}/report`} className="btn-primary w-full">
            <AlertTriangle className="h-5 w-5" />
            Signaler un problème
          </Link>
          <button onClick={iChargedHere} className="btn-secondary w-full">
            <CheckCircle2 className="h-5 w-5" />
            J&apos;ai chargé ici
          </button>
          {chargeMsg && <p className="text-center text-sm text-ink-500">{chargeMsg}</p>}
        </div>
      </div>

      <div className="card flex flex-col items-center gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-ink-900">
          <QrCode className="h-5 w-5 text-volt-600" />
          QR code de la borne
        </h2>
        <img src={qrcodeUrl(station.id)} alt="QR code de la borne" className="h-40 w-40" />
        <p className="text-center text-xs text-ink-500">
          Imprimez ce QR code et collez-le près de la borne pour que d&apos;autres conducteurs puissent la
          noter.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-ink-900">Derniers signalements</h2>
        {station.reports.length === 0 && <p className="text-sm text-ink-500">Aucun signalement pour l'instant.</p>}
        <ul className="flex flex-col gap-2">
          {station.reports.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium">{REPORT_STATUS_LABELS[r.status]}</span>
              {r.comment && <p className="mt-1 text-ink-500">{r.comment}</p>}
              <p className="mt-1 text-xs text-ink-500">{new Date(r.created_at).toLocaleString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      </div>

      {station.photos.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-semibold text-ink-900">Photos récentes</h2>
          <div className="grid grid-cols-3 gap-2">
            {station.photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={p.photo_url} alt="Photo de la borne" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="mb-2 font-semibold text-ink-900">Commentaires</h2>
        <form onSubmit={submitComment} className="mb-3 flex flex-col gap-2">
          <textarea
            className="input"
            rows={2}
            placeholder="Partagez votre expérience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className="btn-primary self-end" disabled={posting}>
            {posting ? "Envoi..." : "Publier"}
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {station.comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              {c.content}
              <p className="mt-1 text-xs text-ink-500">{new Date(c.created_at).toLocaleString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
