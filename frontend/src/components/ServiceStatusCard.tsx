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
  let label = "";
  let dotColor = "bg-gray-300";
  let stopOrder: number | string = "N/A";

  if (serviceJob.status === "serviced") {
    label = "Service Complete";
    dotColor = "bg-green-500";
    stopOrder = serviceJob.stopOrder ?? "----";
  } else if (serviceJob.status === "unable_to_service") {
    label = "Unable to Service";
    dotColor = "bg-red-500";
    stopOrder = serviceJob.stopOrder ?? "----";
  } else if (serviceJob.serviceType === "skip_pickup" && isSubmitted) {
    label = "You requested a skip";
    dotColor = "bg-red-500";
  } else if (isPickupDay) {
    label = "Scheduled Pickup Day";
    dotColor = "bg-yellow-400";
    stopOrder = serviceJob.stopOrder ?? "----";
  } else if (isSubmitted) {
    label = "Request Submitted";
    dotColor = "bg-yellow-400";
    stopOrder = serviceJob.stopOrder ?? "----";
  } else {
    label = "Submit Request Form";
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
