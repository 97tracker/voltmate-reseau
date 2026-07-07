import { STATION_STATUS_LABELS, StationStatus } from "@/lib/types";

const STYLES: Record<StationStatus, string> = {
  ok: "bg-volt-100 text-volt-700",
  warning: "bg-orange-100 text-orange-700",
  broken: "bg-red-100 text-red-700",
  unknown: "bg-slate-100 text-slate-600",
};

export default function StatusBadge({ status }: { status: StationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {STATION_STATUS_LABELS[status]}
    </span>
  );
}
