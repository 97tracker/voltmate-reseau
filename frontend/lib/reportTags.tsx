import { Ban, Car, CheckCircle2, CircleHelp, Euro, Fuel, LucideIcon, PhoneOff, Turtle, Unplug } from "lucide-react";
import type { ReportStatus } from "./types";

// One tap-friendly icon + short label per report type, so reporting a problem never
// requires typing or reading a dropdown of sentences — tap the tile that matches what
// you see, the way Waze lets you tap an incident icon instead of describing it.
export const REPORT_TAG_ICONS: Record<ReportStatus, LucideIcon> = {
  working: CheckCircle2,
  occupied: Car,
  slow: Turtle,
  broken: Ban,
  cable_broken: Unplug,
  payment_failed: PhoneOff,
  ice_parked: Fuel,
  wrong_price: Euro,
  other: CircleHelp,
};

export const REPORT_TAG_LABELS: Record<ReportStatus, string> = {
  working: "Ça marche",
  occupied: "Occupée",
  slow: "Lente",
  broken: "En panne (HS)",
  cable_broken: "Câble cassé",
  payment_failed: "Appli/paiement bug",
  ice_parked: "Véhicule thermique garé",
  wrong_price: "Prix incorrect",
  other: "Autre",
};

export const REPORT_TAG_STYLES: Record<ReportStatus, string> = {
  working: "border-volt-200 bg-volt-50 text-volt-700",
  occupied: "border-amber-200 bg-amber-50 text-amber-700",
  slow: "border-amber-200 bg-amber-50 text-amber-700",
  broken: "border-red-200 bg-red-50 text-red-700",
  cable_broken: "border-red-200 bg-red-50 text-red-700",
  payment_failed: "border-orange-200 bg-orange-50 text-orange-700",
  ice_parked: "border-orange-200 bg-orange-50 text-orange-700",
  wrong_price: "border-orange-200 bg-orange-50 text-orange-700",
  other: "border-slate-200 bg-slate-50 text-slate-600",
};

export const REPORT_TAG_STYLES_ACTIVE: Record<ReportStatus, string> = {
  working: "border-volt-500 bg-volt-500 text-white",
  occupied: "border-amber-500 bg-amber-500 text-white",
  slow: "border-amber-500 bg-amber-500 text-white",
  broken: "border-red-500 bg-red-500 text-white",
  cable_broken: "border-red-500 bg-red-500 text-white",
  payment_failed: "border-orange-500 bg-orange-500 text-white",
  ice_parked: "border-orange-500 bg-orange-500 text-white",
  wrong_price: "border-orange-500 bg-orange-500 text-white",
  other: "border-slate-500 bg-slate-500 text-white",
};
