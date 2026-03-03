import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RouteHealth } from "@/types/driver";

type RouteHealtCardProps = {
  health: RouteHealth;
};

const RouteHealtCard = ({ health }: RouteHealtCardProps) => {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Activity className="text-green-700" size={22} />
          <p className="text-3xl font-bold">Route Health</p>
        </div>

        <div className="space-y-2 text-sm sm:text-base">
          <div className="flex items-center justify-between">
            <p>Stops Remaining</p>
            <p className="font-semibold">{health.stops_remaining}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Completed</p>
            <p className="font-semibold">{health.completed}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Skipped Stops</p>
            <p className="font-semibold">{health.skipped}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Extra Pickups</p>
            <p className="font-semibold">{health.extra_pickups}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RouteHealtCard;
