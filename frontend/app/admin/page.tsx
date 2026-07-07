"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, fetchQrCodeUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { REPORT_STATUS_LABELS, STATION_STATUS_LABELS, AdminStats, StationStatus } from "@/lib/types";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mergeKeep, setMergeKeep] = useState("");
  const [mergeRemove, setMergeRemove] = useState("");
  const [mergeMsg, setMergeMsg] = useState<string | null>(null);
  const [qrStationId, setQrStationId] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  async function load() {
    try {
      const data = await api.get<AdminStats>("/admin/stats");
      setStats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
    }
  }

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  async function changeStatus(stationId: string, status: StationStatus) {
    await api.patch(`/admin/stations/${stationId}/status?status=${status}`);
    load();
  }

  async function mergeStations(e: React.FormEvent) {
    e.preventDefault();
    setMergeMsg(null);
    try {
      await api.post(`/admin/stations/merge?keep_id=${mergeKeep}&remove_id=${mergeRemove}`);
      setMergeMsg("Bornes fusionnées avec succès.");
      load();
    } catch (err) {
      setMergeMsg(err instanceof ApiError ? err.message : "Erreur lors de la fusion.");
    }
  }

  async function generateQrCode(e: React.FormEvent) {
    e.preventDefault();
    setQrError(null);
    setQrLoading(true);
    if (qrImage) URL.revokeObjectURL(qrImage);
    setQrImage(null);
    try {
      const url = await fetchQrCodeUrl(qrStationId);
      setQrImage(url);
    } catch (err) {
      setQrError(err instanceof ApiError ? err.message : "Impossible de générer le QR code.");
    } finally {
      setQrLoading(false);
    }
  }

  if (authLoading) return <p className="text-sm text-ink-500">Chargement...</p>;

  if (!user || user.role !== "admin") {
    return (
      <div className="card text-center">
        <p className="text-ink-700">Accès réservé aux administrateurs.</p>
        <Link href="/login" className="btn-primary mt-3 inline-flex">
          Se connecter
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-ink-500">Chargement des statistiques...</p>;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-ink-900">Tableau de bord admin</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-volt-600">{stats.total_stations}</p>
          <p className="text-xs text-ink-500">Bornes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-volt-600">{stats.total_reports}</p>
          <p className="text-xs text-ink-500">Signalements</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-volt-600">{stats.total_users}</p>
          <p className="text-xs text-ink-500">Utilisateurs</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-ink-900">Dernières bornes ajoutées</h2>
        <ul className="flex flex-col gap-2">
          {stats.recent_stations.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <Link href={`/station/${s.id}`} className="font-medium">
                  {s.name}
                </Link>
                <p className="text-xs text-ink-500">{s.address}</p>
              </div>
              <select
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                value={s.current_status}
                onChange={(e) => changeStatus(s.id, e.target.value as StationStatus)}
              >
                {Object.entries(STATION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-ink-900">Derniers signalements</h2>
        <ul className="flex flex-col gap-2">
          {stats.recent_reports.map((r) => (
            <li key={r.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium">{REPORT_STATUS_LABELS[r.status]}</span>
              {r.comment && <p className="text-ink-500">{r.comment}</p>}
              <p className="text-xs text-ink-500">{new Date(r.created_at).toLocaleString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-ink-900">Fusionner deux bornes dupliquées</h2>
        <form onSubmit={mergeStations} className="flex flex-col gap-2">
          <input
            className="input"
            placeholder="ID de la borne à conserver"
            value={mergeKeep}
            onChange={(e) => setMergeKeep(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="ID de la borne à supprimer"
            value={mergeRemove}
            onChange={(e) => setMergeRemove(e.target.value)}
            required
          />
          <button type="submit" className="btn-danger">
            Fusionner
          </button>
          {mergeMsg && <p className="text-sm text-ink-500">{mergeMsg}</p>}
        </form>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-ink-900">Générer un QR code (usage interne)</h2>
        <p className="mb-3 text-xs text-ink-500">
          Réservé à l&apos;équipe VoltMate : à imprimer et coller vous-même, ou à transmettre aux
          exploitants de bornes. Les utilisateurs n&apos;ont pas accès à cette fonction.
        </p>
        <form onSubmit={generateQrCode} className="flex flex-col gap-2">
          <input
            className="input"
            placeholder="ID de la borne"
            value={qrStationId}
            onChange={(e) => setQrStationId(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary self-start" disabled={qrLoading}>
            {qrLoading ? "Génération..." : "Générer"}
          </button>
          {qrError && <p className="text-sm text-red-600">{qrError}</p>}
        </form>
        {qrImage && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <img src={qrImage} alt="QR code de la borne" className="h-40 w-40" />
            <a href={qrImage} download={`voltmate-${qrStationId}.png`} className="btn-secondary text-sm">
              Télécharger
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
