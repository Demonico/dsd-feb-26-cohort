import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import RouteDetails from "../components/RouteDetails";
import ManifestDetails from "@/components/ManifestDetails";
import Manifest from "@/components/Manifest";
import {
  fetchDriverManifest,
  generateDriverManifest,
  type DriverManifestResponse,
} from "@/api/driverManifest";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const DriverManifest = () => {
  const [serviceDate, setServiceDate] = useState(todayIsoDate());
  const [manifest, setManifest] = useState<DriverManifestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedDateRef = useRef<string | null>(null);

  async function onGenerateRoute() {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateDriverManifest(serviceDate);
      setManifest(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to generate route";
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  async function loadManifest(date: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDriverManifest(date);
      setManifest(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load manifest";
      setError(message);
      setManifest(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Prevent duplicate same-date call in React StrictMode dev double-effect.
    if (lastLoadedDateRef.current === serviceDate) return;
    lastLoadedDateRef.current = serviceDate;
    void loadManifest(serviceDate);
  }, [serviceDate]);

  const jobs = manifest?.jobs ?? [];
  const skips = manifest?.skip_count ?? 0;
  const extras = manifest?.extra_count ?? 0;

  return (
    <div>
      <h1 className="text-xl font-bold">Driver Manifest</h1>

      <div className="my-3 flex flex-col sm:flex-row sm:items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Service date</span>
          <input
            type="date"
            className="border rounded-sm px-3 py-2"
            value={serviceDate}
            max={todayIsoDate()}
            onChange={(event) => setServiceDate(event.target.value)}
          />
        </label>
        <Button
          type="button"
          onClick={() => {
            void onGenerateRoute();
          }}
          disabled={generating || loading}
        >
          {generating
            ? "Generating..."
            : manifest?.has_jobs
              ? "Regenerate Route"
              : "Generate Route"}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading manifest...</p> : null}

      <RouteDetails
        route={manifest?.route ?? null}
        driverName={manifest?.driver?.driver_name}
        serviceDate={serviceDate}
      />
      <div className="border-2 p-4 rounded-sm">
        <ManifestDetails stops={jobs.length} skips={skips} extras={extras} />
        <Manifest jobs={jobs} />
      </div>
    </div>
  );
};

export default DriverManifest;
