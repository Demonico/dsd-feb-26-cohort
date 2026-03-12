import { Card, CardContent } from "@/components/ui/card";
import type { ServiceJob } from "@/types/customer";
import { Info } from "lucide-react";

type ServiceStatusCardProps = {
  serviceJob: ServiceJob;
  isSubmitted?: boolean;
  isPickupDay?: boolean;
};

const ServiceStatusCard = ({
  serviceJob,
  isSubmitted = false,
  isPickupDay = false,
}: ServiceStatusCardProps) => {
  if (!isSubmitted) {
    return (
      <Card className="flex-none">
        <CardContent className=" items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-green-700" />
            <p className="font-bold">Service Status</p>
          </div>

          <div className="p-4 flex flex-col">
            <p className="text-sm text-gray-400 text-center py-4">
              Submit Request Form
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (serviceJob.serviceType === "skip_pickup") {
    return (
      <Card className="flex-none">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-green-700" />
            <p className="font-bold">Service Status</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-sm font-semibold">You requested a skip</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  let label = "";
  let dotColor = "";
  let stopOrder: number | string = "N/A";

  if (!isSubmitted) {
    label = "Submit Request Form";
  } else if (serviceJob.status === "serviced") {
    label = "Service Complete";
    dotColor = "bg-green-500";
    stopOrder = serviceJob.stopOrder ?? "----";
  } else if (isPickupDay) {
    label = "Scheduled Pickup Day";
    dotColor = "bg-yellow-400";
    stopOrder = serviceJob.stopOrder ?? "----";
  } else {
    label = "Pending";
    dotColor = "bg-yellow-400";
  }
  return (
    <Card className="flex-none">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-green-700" />
          <p className="font-bold">Service Status</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold">{label}</span>
        </div>

        <p className="text-sm">
          <span className="font-semibold">Service:</span>{" "}
          {serviceJob.service ?? "----"}
        </p>

        {/* <p className="text-sm">
          <span className="font-semibold">Container:</span>{" "}
          {serviceJob.container ? `${serviceJob.container} yd` : "----"}
        </p> */}

        <p className="text-sm">
          <span className="font-semibold">Stop Order:</span> {stopOrder}
        </p>
      </CardContent>
    </Card>
  );
};

export default ServiceStatusCard;

