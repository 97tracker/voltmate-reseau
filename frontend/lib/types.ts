export type ConnectorType = "type2" | "ccs" | "chademo" | "other";
export type StationStatus = "ok" | "warning" | "broken" | "unknown";
export type ReportStatus =
  | "working"
  | "occupied"
  | "slow"
  | "broken"
  | "cable_broken"
  | "payment_failed"
  | "ice_parked"
  | "wrong_price"
  | "other";
export type UserRole = "user" | "admin";

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  operator: string | null;
  connector_type: ConnectorType;
  advertised_power_kw: number | null;
  estimated_price: string | null;
  current_status: StationStatus;
  reliability_score: number;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  status: ReportStatus;
  comment: string | null;
  observed_power_kw: number | null;
  observed_price: string | null;
  waiting_time_minutes: number | null;
  photo_url: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
}

export interface StationPhoto {
  id: string;
  photo_url: string;
  created_at: string;
}

export interface StationDetail extends Station {
  reports: Report[];
  comments: Comment[];
  photos: StationPhoto[];
}

export interface Badge {
  id: string;
  badge_name: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  points: number;
  created_at: string;
}

export interface UserProfile extends User {
  badges: Badge[];
  reports_count: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AssistantAnswer {
  answer: string;
  suggested_station_ids: string[];
}

export interface AdminStats {
  total_stations: number;
  total_reports: number;
  total_users: number;
  recent_stations: Station[];
  recent_reports: Report[];
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  working: "Borne fonctionnelle",
  occupied: "Borne occupée",
  slow: "Borne lente",
  broken: "Borne en panne",
  cable_broken: "Câble cassé",
  payment_failed: "Paiement impossible",
  ice_parked: "Véhicule thermique garé",
  wrong_price: "Prix incorrect",
  other: "Autre problème",
};

export const STATION_STATUS_LABELS: Record<StationStatus, string> = {
  ok: "Fiable",
  warning: "Problème mineur",
  broken: "En panne",
  unknown: "Statut inconnu",
};

export const STATION_STATUS_COLORS: Record<StationStatus, string> = {
  ok: "#22c55e",
  warning: "#f97316",
  broken: "#ef4444",
  unknown: "#94a3b8",
};
