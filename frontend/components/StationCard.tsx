import Link from "next/link";
import { Euro, Gauge, Zap } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { Station } from "@/lib/types";

export default function StationCard({ station }: { station: Station }) {
  return (
    <Link href={`/station/${station.id}`} className="card block hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink-900">{station.name}</h3>
          <p className="text-sm text-ink-500">{station.address}</p>
        </div>
        <StatusBadge status={station.current_status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-700">
        <span className="inline-flex items-center gap-1">
          <Zap className="h-4 w-4 text-volt-600" />
          {station.advertised_power_kw ? `${station.advertised_power_kw} kW` : "Puissance inconnue"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Euro className="h-4 w-4 text-volt-600" />
          {station.estimated_price || "Prix inconnu"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="h-4 w-4 text-volt-600" />
          Score {station.reliability_score}/100
        </span>
      </div>
    </Link>
  );
}
