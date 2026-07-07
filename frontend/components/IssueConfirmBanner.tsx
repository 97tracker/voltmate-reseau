"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { REPORT_TAG_ICONS, REPORT_TAG_LABELS } from "@/lib/reportTags";
import type { Report } from "@/lib/types";

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

interface IssueConfirmBannerProps {
  stationId: string;
  latestReport: Report;
  onConfirmed: () => void;
}

export default function IssueConfirmBanner({ stationId, latestReport, onConfirmed }: IssueConfirmBannerProps) {
  const [submitting, setSubmitting] = useState<"same" | "resolved" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const Icon = REPORT_TAG_ICONS[latestReport.status];

  async function confirm(stillPresent: boolean) {
    setSubmitting(stillPresent ? "same" : "resolved");
    setError(null);
    try {
      await api.post(`/stations/${stationId}/reports`, {
        status: stillPresent ? latestReport.status : "working",
      });
      onConfirmed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="card flex flex-col gap-3 border-orange-200 bg-orange-50">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
        <p className="text-sm text-ink-700">
          Dernier signalement : <span className="inline-flex items-center gap-1 font-semibold"><Icon className="h-4 w-4" />{REPORT_TAG_LABELS[latestReport.status]}</span>{" "}
          <span className="text-ink-500">({timeAgo(latestReport.created_at)})</span>
        </p>
      </div>
      <p className="text-sm font-medium text-ink-900">Ce problème est-il toujours présent ?</p>
      <div className="flex gap-2">
        <button
          onClick={() => confirm(true)}
          disabled={submitting !== null}
          className="btn-secondary flex-1 border-orange-300 text-sm"
        >
          {submitting === "same" ? "..." : "Oui, toujours"}
        </button>
        <button
          onClick={() => confirm(false)}
          disabled={submitting !== null}
          className="btn-primary flex-1 text-sm"
        >
          {submitting === "resolved" ? "..." : "Non, c'est résolu"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
