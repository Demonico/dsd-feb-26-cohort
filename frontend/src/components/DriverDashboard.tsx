import { useEffect, useMemo, useRef, useState } from "react";
import DriverDashHeader from "./DriverDashHeader";
import StopCard from "./StopCard";
import RouteHealthCard from "./RouteHealthCard";
import RouteListCard from "./RouteListCard";
import { fetchManifestJobs, generateDriverManifest, fetchOptimizedRoute, type DriverManifestResponse } from "@/api/driverManifest";
import type { Stop, Route } from "@/types/driver";

function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildRoute(manifest: DriverManifestResponse): Route | null {
  if (!manifest.route) return null;

  const stops: Stop[] = [...manifest.jobs]
    .sort((a, b) => (a.sequence_order ?? 9999) - (b.sequence_order ?? 9999))
    .map((job) => ({
      location_id: job.location_id,
      sequence_order: job.sequence_order ?? 0,
      customer_name: job.customer_name ?? "Unknown",
      address: job.address?.street_address ?? "",
      city: job.address?.city ?? "",
      state: job.address?.state ?? "",
      zip: job.address?.zipcode ?? "",
      service: job.job_source,
      container: "Mixed",
      status: job.status,
      is_extra_pickup: job.job_source === "EXTRA_REQUEST",
      failure_reason: null,
      proof_of_service_photo: null,
    }));

  return {
    route_id: String(manifest.route.route_id),
    service_date: manifest.route.service_date,
    city: manifest.route.start_city ?? "Dallas",
    state: manifest.route.start_state ?? "TX",
    stops,
    health: {
      stops_remaining: stops.filter((s) => s.status === "PENDING").length,
      completed: stops.filter((s) => s.status === "COMPLETED").length,
      skipped: stops.filter((s) => s.status === "SKIPPED").length,
      extra_pickups: stops.filter((s) => s.is_extra_pickup).length,
    },
  };
}

const DriverDashboard = () => {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);  // ← add this
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const today = todayIsoDate();

    async function load() {
      // Only call generate (which writes to DB) if no route exists yet.
      // Otherwise just fetch existing job data — no DB writes.
      let manifest = await fetchManifestJobs(today);
      if (!manifest.route) {
        manifest = await generateDriverManifest(today);
      }

      // Apply ORS-optimized order in memory only — never writes to DB.
      try {
        const optimized = await fetchOptimizedRoute(today);
        const orderedLocationIds: number[] = (optimized.routes?.[0]?.steps ?? [])
          .filter((s) => s.type === "job" && s.location_id != null)
          .map((s) => s.location_id as number);

        const built = buildRoute(manifest);
        if (built && orderedLocationIds.length > 0) {
          const indexMap = new Map(orderedLocationIds.map((id, i) => [id, i]));
          built.stops.sort(
            (a, b) => (indexMap.get(a.location_id) ?? 9999) - (indexMap.get(b.location_id) ?? 9999)
          );
          built.stops.forEach((s, i) => { s.sequence_order = i + 1; });
        }
        setRoute(built);
      } catch {
        // ORS unavailable — fall back to stored sequence_order.
        setRoute(buildRoute(manifest));
      }
    }

    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const currentStop = useMemo(
    () => route?.stops.find((s) => s.status === "PENDING") ?? route?.stops[0] ?? null,
    [route],
  );

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!route || !currentStop) return <div className="p-6">No route for today.</div>;

  return (
    <div className="p-6">
      <DriverDashHeader
        routeId={route.route_id}
        location={`${route.city}, ${route.state}`}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1.4fr]">
        <div className="space-y-4">
          <StopCard stop={currentStop} onComplete={handleStopComplete} />
          <RouteHealthCard health={routeHealth} />
        </div>
        <RouteListCard
          stops={stops}
          currentStopLocationId={currentStop.location_id}
          onStopSelect={handleStopSelect}
        />
      </div>
    </div>
  );
};

export default DriverDashboard;
