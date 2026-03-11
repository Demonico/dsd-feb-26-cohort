import { List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Stop } from "@/types/driver";

type RouteListCardProps = {
  stops: Stop[];
  currentStopLocationId: number | null;
  onStopSelect?: (locationId: number) => void;
};

const RouteListCard = ({ stops, currentStopLocationId, onStopSelect }: RouteListCardProps) => {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="text-green-700" size={20} />
            <p className="font-bold">Route List</p>
          </div>
        </div>

        <div className="max-h-130 space-y-2 overflow-y-auto pr-1">
          {stops.map((stop) => {
            const isCurrent = stop.location_id === currentStopLocationId;
            const isExtraPickup = stop.is_extra_pickup;

            return (
              <div 
                key={stop.location_id} 
                className={`border-b pb-2 last:border-b-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors ${
                  isCurrent ? "bg-green-50" : ""
                }`}
                onClick={() => onStopSelect?.(stop.location_id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`font-semibold ${isCurrent ? "text-green-700" : ""}`}>
                      {stop.sequence_order}. {stop.address}
                    </p>
                    <p className="text-sm">
                      {stop.city}, {stop.state} {stop.zip}
                    </p>
                  </div>
                  {isExtraPickup ? (
                    <span className="inline-flex whitespace-nowrap rounded-full border border-red-500 px-2 py-0.5 text-xs font-semibold text-red-600">
                      Extra Pickup
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteListCard;
