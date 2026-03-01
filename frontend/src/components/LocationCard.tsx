import type { CustomerLocation, ServiceJob } from "@/types/customer";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type LocationCardProps = {
  location: CustomerLocation;
  serviceJob: ServiceJob;

};

const LocationCard = ({ location, serviceJob }: LocationCardProps) => {
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(serviceJob.serviceType ?? null);


  const handleSubmit = async () => {
    if (!selectedServiceType || !serviceJob.requestFormOpen) return;

    try {

      // will call the api when ready to submit the form
      console.log("Submitted:", selectedServiceType);
    } catch (error) {
      console.error("Submit failed:", error);
    }
  };
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-start">
            <MapPin className="text-green-700 mt-1" size={20} />
            <div>
              <p className="font-bold text-xl">{location.name}</p>
              <p className="text-sm font-semibold">{location.street}, {location.city}, {location.state} {location.zip}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full ${serviceJob.requestFormOpen ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm font-semibold">
            {serviceJob.requestFormOpen ? "REQUEST FORM OPEN" : "REQUEST FORM CLOSE"}
          </span>
        </div>

        <p className="text-sm"><span className="font-semibold">Scheduled Pickup:</span> {serviceJob.scheduledPickup}</p>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm"><span className="font-semibold">Container:</span> {serviceJob.container}</p>
          <p className="text-sm font-semibold">Service Type:</p>

          <Select
            disabled={!serviceJob.requestFormOpen}
            value={selectedServiceType ?? ""}
            onValueChange={(val) => setSelectedServiceType(val)}
          >
            <SelectTrigger className="w-40 cursor-pointer">
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal_pickup">Normal Pickup</SelectItem>
              <SelectItem value="extra_pickup">Extra Pickup</SelectItem>
              <SelectItem value="skip_pickup">Skip Pickup</SelectItem>
            </SelectContent>
          </Select>

        </div>

        <Button onClick={handleSubmit} disabled={!serviceJob.requestFormOpen || !selectedServiceType} className={`w-full ${!serviceJob.requestFormOpen ? "bg-gray-300 text-gray-500" : "bg-green-700 text-white"} cursor-pointer`} variant="ghost">
          SUBMIT
        </Button>



      </CardContent>
    </Card>

  )
}

export default LocationCard;