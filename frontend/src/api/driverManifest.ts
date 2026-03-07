/* API helpers for driver manifest fetch and route generation by service date. */

import http from "./http";

export type DriverManifestJob = {
  job_id: number;
  location_id: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";
  job_source: "SCHEDULED" | "EXTRA_REQUEST";
  completed_at?: string | null;
  customer_name?: string | null;
  address?: {
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    zipcode?: string | null;
  };
};

export type DriverManifestRoute = {
  route_id: number;
  driver_id: number;
  service_date: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";
  start_street_address?: string | null;
  start_city?: string | null;
  start_state?: string | null;
  start_zipcode?: string | null;
};

export type DriverManifestResponse = {
  service_date: string;
  has_jobs: boolean;
  route: DriverManifestRoute | null;
  jobs: DriverManifestJob[];
  driver: {
    driver_id: number;
    driver_name: string;
  };
};

export async function fetchDriverManifest(
  serviceDate: string,
): Promise<DriverManifestResponse> {
  const response = await http.get<DriverManifestResponse>(
    "/driver/manifest/",
    { params: { service_date: serviceDate } },
  );
  return response.data;
}

export async function generateDriverManifest(
  serviceDate: string,
): Promise<DriverManifestResponse> {
  const response = await http.post<DriverManifestResponse>(
    "/driver/manifest/generate",
    { service_date: serviceDate },
  );
  return response.data;
}
