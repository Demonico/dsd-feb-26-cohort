import { useEffect, useMemo, useState } from "react";
import DriverDashHeader from "./DriverDashHeader";
import StopCard from "./StopCard";
import RouteHealtCard from "./RouteHealtCard";
import RouteListCard from "./RouteListCard";
import { mockDriver } from "@/assets/mockDriver";

import type { Driver } from "@/types/driver";

const DriverDashboard = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDriver(mockDriver);
    setLoading(false);
   
  }, []);

  const currentStop = useMemo(
    () =>
      driver?.route?.stops.find((stop) => stop.status === "PENDING") ??
      driver?.route?.stops[0] ??
      null,
    [driver],
  );

  if (loading || !driver || !driver.route || !currentStop) {
    return <div className="p-6">Loading...</div>;
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
          <StopCard stop={currentStop} />
          <RouteHealtCard health={route.health} />
        </div>
        <RouteListCard
          stops={route.stops}
          currentStopLocationId={currentStop.location_id}
        />
      </div>
    </div>
  )
}

export default DriverDashboard
