/* API helpers for driver manifest fetch by service date. */

import http from "./http";

export type DriverManifestJob = {
  job_id: number;
  location_id: number;
  sequence_order?: number | null;
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
  skip_count?: number;
  extra_count?: number;
  route: DriverManifestRoute | null;
  jobs: DriverManifestJob[];
  driver: {
    driver_id: number;
    driver_name: string;
  };
};

const MANIFEST_CACHE_PREFIX = "driver_manifest:";
const MANIFEST_CACHE_TTL_MS = 30_000;
const inFlightByDate = new Map<string, Promise<DriverManifestResponse>>();

function cacheKey(serviceDate: string): string {
  return `${MANIFEST_CACHE_PREFIX}${serviceDate}`;
}

function readCache(serviceDate: string): DriverManifestResponse | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(serviceDate));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: DriverManifestResponse };
    if (Date.now() - parsed.ts > MANIFEST_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(serviceDate: string, data: DriverManifestResponse): void {
  try {
    sessionStorage.setItem(cacheKey(serviceDate), JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore cache write errors.
  }
}

export async function fetchDriverManifest(
  serviceDate: string,
): Promise<DriverManifestResponse> {
  const cached = readCache(serviceDate);
  if (cached) return cached;

  const inFlight = inFlightByDate.get(serviceDate);
  if (inFlight) return inFlight;

  const request = http
    .get<DriverManifestResponse>("/driver/manifest/", {
      params: { service_date: serviceDate },
    })
    .then((response) => {
      writeCache(serviceDate, response.data);
      return response.data;
    })
    .finally(() => {
      inFlightByDate.delete(serviceDate);
    });

  inFlightByDate.set(serviceDate, request);
  return request;
}

export async function fetchManifestJobs(serviceDate: string): Promise<DriverManifestResponse> {
  const response = await http.get<DriverManifestResponse>("/driver/manifest/jobs", {
    params: { service_date: serviceDate },
  });
  response.data.jobs.sort(
    (a, b) => (a.sequence_order ?? 9999) - (b.sequence_order ?? 9999)
  );
  return response.data;
}

export async function generateDriverManifest(serviceDate: string): Promise<DriverManifestResponse> {
  const response = await http.post<DriverManifestResponse>("/driver/manifest/generate", null, {
    params: { service_date: serviceDate },
  });
  try { sessionStorage.removeItem(`driver_manifest:${serviceDate}`); } catch { /* ignore */ }
  return response.data;
}

export type OptimizedStep = {
  type: "start" | "job" | "end";
  id?: number | null;
  location_id?: number | null;
  address?: string | null;
  duration: number;
  leg_distance_meters: number;
};

export type OptimizedRouteResponse = {
  total_duration: number;
  total_distance_meters: number;
  total_distance_miles: number;
  routes: { steps: OptimizedStep[] }[];
  message?: string;
};

export async function fetchOptimizedRoute(serviceDate: string): Promise<OptimizedRouteResponse> {
  const response = await http.post<OptimizedRouteResponse>("/distance/optimize-requests", {
    requested_for_date: serviceDate,
  });
  return response.data;
}
