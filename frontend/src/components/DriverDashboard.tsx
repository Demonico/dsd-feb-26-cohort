import { useEffect, useMemo, useState } from "react";
import DriverDashHeader from "./DriverDashHeader";
import StopCard from "./StopCard";
import RouteHealthCard from "./RouteHealthCard";
import RouteListCard from "./RouteListCard";
import http from "@/api/http";

import type { Driver, Stop } from "@/types/driver";

const DriverDashboard = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    const fetchDriverJobs = async () => {
      try {
        const response = await http.get("/service-jobs/");
        const jobs = response.data.service_jobs || [];
        
        if (jobs.length === 0) {
          setLoading(false);
          return;
        }

        const stops: Stop[] = jobs.map((job: any) => {
          const location = job.service_locations || {};
          const customer = location.customers || {};
          
          return {
            job_id: job.job_id,
            location_id: job.location_id,
            sequence_order: job.sequence_order || 0,
            customer_name: customer.customer_name || "Unknown",
            address: location.street_address || "",
            city: location.city || "",
            state: location.state || "",
            zip: location.zipcode || "",
            service: job.job_source === "EXTRA_REQUEST" ? "Extra" : "Scheduled",
            status: job.status || "PENDING",
            is_extra_pickup: job.job_source === "EXTRA_REQUEST",
            failure_reason: job.failure_reason,
            proof_of_service_photo: job.proof_of_service_photo,
          };
        });

        const sortedStops = stops.sort((a, b) => a.sequence_order - b.sequence_order);
        
        const routeId = jobs[0]?.route_id?.toString() || "N/A";
        const city = sortedStops[0]?.city || "Unknown";
        const state = sortedStops[0]?.state || "";

        setStops(sortedStops);
        setDriver({
          id: "current-driver",
          name: "Driver",
          role: "driver",
          route: {
            route_id: routeId,
            service_date: new Date().toISOString().split('T')[0],
            city,
            state,
            stops: sortedStops,
            health: {
              stops_remaining: 0,
              completed: 0,
              skipped: 0,
              extra_pickups: 0,
            },
          },
        });
      } catch (error) {
        console.error("Failed to fetch driver jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverJobs();
  }, []);

  const currentStop = useMemo(
    () => stops[currentStopIndex] ?? null,
    [stops, currentStopIndex],
  );

  const routeHealth = useMemo(() => {
    const completed = stops.filter(s => s.status === "COMPLETED" || s.status === "FAILED").length;
    const skipped = stops.filter(s => s.status === "SKIPPED").length;
    const pending = stops.filter(s => s.status === "PENDING").length;
    
    return {
      stops_remaining: pending,
      completed: completed,
      skipped: skipped,
      extra_pickups: stops.filter(s => s.is_extra_pickup).length,
    };
  }, [stops]);

  const handleStopComplete = (updatedStop: Stop) => {
    setStops(prevStops => 
      prevStops.map(s => s.job_id === updatedStop.job_id ? updatedStop : s)
    );
    
    // Find next non-skipped stop
    let nextIndex = currentStopIndex + 1;
    while (nextIndex < stops.length && stops[nextIndex].status === "SKIPPED") {
      nextIndex++;
    }
    
    if (nextIndex < stops.length) {
      setCurrentStopIndex(nextIndex);
    }
  };

  const handleStopSelect = (locationId: number) => {
    const index = stops.findIndex(s => s.location_id === locationId);
    if (index !== -1) {
      setCurrentStopIndex(index);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!driver || !driver.route || !currentStop) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">No Jobs Available</h2>
          <p className="mb-2">No service jobs found for your driver account.</p>
          <p className="text-sm text-gray-600">Please contact your administrator to assign routes and jobs.</p>
        </div>
      </div>
    );
  }

  const { route } = driver;

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
  )
}

export default DriverDashboard
