export type Role = "ADMIN" | "MAINTENANCE" | "FLEET";

export type VehicleType = "TRUCK" | "TRAILER";

export type VehicleStatus = "ARRIVED" | "READY";

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
  reason: string;
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
  TRUCK: "Kamion",
  TRAILER: "Prikolica",
};

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  ARRIVED: "Arrived",
  READY: "Ready",
};
