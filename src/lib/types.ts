export type Role = "ADMIN" | "MAINTENANCE" | "FLEET";

export type VehicleType = "TRUCK" | "TRAILER";

export type VehicleStatus = "ARRIVED" | "READY";

export type Destination = "SOHO" | "MEPA";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_type: VehicleType;
  plate: string;
  driver: string;
  arrival_date: string;
  eta: string | null;
  reason: string;
  comment: string | null;
  destination: Destination;
  status: VehicleStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MAINTENANCE: "Maintenance",
  FLEET: "Fleet",
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  TRUCK: "Truck",
  TRAILER: "Trailer",
};

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  ARRIVED: "Arrived",
  READY: "Ready",
};

export const DESTINATION_LABELS: Record<Destination, string> = {
  SOHO: "Arriving to SOHO",
  MEPA: "Arriving to MEPA",
};
