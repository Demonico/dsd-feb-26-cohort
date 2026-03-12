import { Card, CardContent } from "@/components/ui/card";
import type { ServiceJob } from "@/types/customer";

type ServiceStatusCardProps = {
  serviceJob: ServiceJob;
};

const ServiceStatusCard = ({serviceJob}:ServiceStatusCardProps) => {
  const dotColor =
    serviceJob.status === "serviced" ? "bg-green-500" :
    serviceJob.status === "unable_to_service" ? "bg-red-500" :
    "bg-yellow-400";

  return (
    <Card className="flex-none">
       <CardContent className="p-4 flex flex-col gap-2">
        <p className="font-bold">Service Status</p>
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold">{serviceJob.status}</span>
        </div>
        <p className="text-sm"><span className="font-semibold">Service:</span> {serviceJob.service}</p>
        <p className="text-sm"><span className="font-semibold">Stop Order:</span> {serviceJob.stopOrder ?? "----"}</p>
       </CardContent>
    </Card>
  )
}

export default ServiceStatusCard;
