export type StopStatus = "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";

export type Stop = {
  job_id: number;
  location_id: number;
  sequence_order: number;
  customer_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  service: string;
  container: string;
  status: StopStatus;
  is_extra_pickup: boolean;
  failure_reason: string | null;
  proof_of_service_photo: string | null;
};

export type RouteHealth = {
  stops_remaining: number;
  completed: number;
  skipped: number;
  extra_pickups: number;
};

export type Route = {
  route_id: string;
  service_date: string;
  city: string;
  state: string;
  stops: Stop[];
  health: RouteHealth;
};

export type Driver = {
  id: string;
  name: string;
  role: "driver";
  route: Route | null;
};
