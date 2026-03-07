import type { DriverManifestRoute } from "@/api/driverManifest";

type RouteDetailsProps = {
  route: DriverManifestRoute | null;
  driverName?: string;
  serviceDate: string;
};

const RouteDetails = ({ route, driverName, serviceDate }: RouteDetailsProps) => {
  const dateLabel = new Date(`${serviceDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
     <div className="border-2 rounded-sm my-3 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1">

          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Route ID:
              </span>
              <span className="font-bold">{route ? `R-${route.route_id}` : "Not generated"}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Company:
              </span>
              <span className="font-bold">DSD Waste</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Location:
              </span>
              <span className="font-bold">{route?.start_city ?? "N/A"}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Driver:
              </span>
              <span className="font-bold">{driverName ?? "N/A"}</span>
            </div>
          </div>

      
          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Date:
              </span>
              <span className="font-bold">{dateLabel}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Truck:
              </span>
              <span className="font-bold">Unassigned</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Week Of:
              </span>
              <span className="font-bold">{route?.service_date ?? serviceDate}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Container Type:
              </span>
              <span className="font-bold">Mixed</span>
            </div>
          </div>
        </div>

      </div>
  )
}

export default RouteDetails
