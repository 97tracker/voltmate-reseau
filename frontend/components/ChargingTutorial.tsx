"use client";

import { useMemo, useState } from "react";
import { Smartphone, Zap } from "lucide-react";
import type { Station } from "@/lib/types";

const STEPS = [
  "Garez-vous face à la borne et vérifiez que le connecteur correspond à votre véhicule (Type 2, Combo CCS...).",
  "Téléchargez l'application de l'opérateur affiché sur la fiche (ou utilisez le paiement sans contact si la borne le propose) — VoltMate sert à trouver et noter la borne, pas à démarrer la charge.",
  "Branchez le câble, puis lancez la session depuis l'appli, un badge RFID ou votre carte bancaire selon la borne.",
  "Suivez la charge depuis l'appli de l'opérateur. Une fois terminé, arrêtez la session avant de débrancher.",
];

// Default consumption assumption for a compact/mid-size EV — used only when we have
// no vehicle-specific data. Clearly labeled as an estimate everywhere it's shown.
const DEFAULT_CONSUMPTION_KWH_PER_KM = 0.18;

function parsePricePerKwh(estimatedPrice: string | null): number | null {
  if (!estimatedPrice) return null;
  const match = estimatedPrice.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*€?\s*\/\s*kWh/i);
  return match ? parseFloat(match[1]) : null;
}

export default function ChargingTutorial({ station }: { station: Station }) {
  const [km, setKm] = useState("100");
  const pricePerKwh = useMemo(() => parsePricePerKwh(station.estimated_price), [station.estimated_price]);

  const estimatedCost = useMemo(() => {
    const distance = parseFloat(km);
    if (!pricePerKwh || Number.isNaN(distance) || distance <= 0) return null;
    return distance * DEFAULT_CONSUMPTION_KWH_PER_KM * pricePerKwh;
  }, [km, pricePerKwh]);

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-semibold text-ink-900">
        <Zap className="h-5 w-5 text-volt-600" />
        Comment ça marche ?
      </h2>

      <div className="charge-tutorial-anim relative h-32 overflow-hidden rounded-2xl bg-slate-950">
        <div className="charge-tutorial-grid" />
        <svg viewBox="0 0 200 100" className="relative h-full w-full">
          <rect x="14" y="40" width="26" height="34" rx="4" fill="#1e293b" stroke="#334155" />
          <circle cx="22" cy="76" r="4" fill="#0f172a" stroke="#475569" />
          <circle cx="34" cy="76" r="4" fill="#0f172a" stroke="#475569" />
          <rect x="150" y="20" width="14" height="54" rx="3" fill="#1e293b" stroke="#334155" />
          <path
            className="charge-tutorial-cable"
            d="M40 58 C 90 58, 110 58, 152 46"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <circle className="charge-tutorial-pulse" r="3.2" fill="#4ade80">
            <animateMotion dur="2.2s" repeatCount="indefinite" path="M40 58 C 90 58, 110 58, 152 46" />
          </circle>
        </svg>
      </div>

      <ol className="flex flex-col gap-2 text-sm text-ink-700">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-volt-100 text-xs font-bold text-volt-700">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-ink-500">
        <Smartphone className="h-4 w-4 shrink-0 text-ink-400" />
        Chaque réseau a sa propre appli (ou accepte la carte bancaire sans contact) pour démarrer une
        charge — VoltMate ne remplace pas cette étape, il vous aide à choisir la bonne borne.
      </div>

      <div className="rounded-xl border border-slate-100 p-3">
        <p className="mb-2 text-sm font-medium text-ink-900">Estimer le coût d&apos;un trajet</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            className="input"
            value={km}
            onChange={(e) => setKm(e.target.value)}
          />
          <span className="shrink-0 text-sm text-ink-500">km</span>
        </div>
        {pricePerKwh ? (
          <p className="mt-2 text-sm text-ink-700">
            Coût estimé : <span className="font-semibold">{estimatedCost?.toFixed(2)} €</span>
            <span className="text-xs text-ink-500"> (≈ {DEFAULT_CONSUMPTION_KWH_PER_KM} kWh/km, estimation)</span>
          </p>
        ) : (
          <p className="mt-2 text-xs text-ink-500">
            Tarif de cette borne non disponible au format €/kWh, impossible d&apos;estimer précisément.
          </p>
        )}
      </div>
    </div>
  );
}
