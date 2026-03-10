import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Stop } from "@/types/driver";

type StopCardProps = {
  stop: Stop;
};

const StopCard = ({ stop }: StopCardProps) => {
  const [statusAction, setStatusAction] = useState<"COMPLETED" | "FAILED" | null>(
    null,
  );
  const [reason, setReason] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const isSubmitDisabled =
    !statusAction || (statusAction === "FAILED" && reason.length === 0);

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    // TODO: Call driver stop update API when backend contract is confirmed.
    console.log("Stop submit payload", {
      location_id: stop.location_id,
      status: statusAction,
      failure_reason: statusAction === "FAILED" ? reason : null,
      proof_of_service_photo: proofFile?.name ?? null,
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-2">
          <MapPin className="mt-1 text-green-700" size={20} />
          <div>
            <p className="text-2xl font-bold leading-tight">{stop.customer_name}</p>
            <p className="text-sm font-semibold">
              {stop.address}, {stop.city}, {stop.state} {stop.zip}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm font-semibold">
          <p>
            Service: <span className="font-bold">{stop.service}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            className={`cursor-pointer rounded-lg font-semibold ${
              statusAction === "COMPLETED"
                ? "bg-green-700 text-white hover:bg-green-700 hover:text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            onClick={() => setStatusAction("COMPLETED")}
          >
            Serviced Successfully
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`cursor-pointer rounded-lg font-semibold ${
              statusAction === "FAILED"
                ? "bg-red-600 text-white hover:bg-red-600 hover:text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200 "
            }`} 
            onClick={() => setStatusAction("FAILED")}
          >
            Unable to service
          </Button>
        </div>

        <div className="space-y-2">
          <Select
            value={reason}
            onValueChange={setReason}
            disabled={statusAction !== "FAILED"}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Reason for not serving" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6} align="start">
              <SelectItem className="cursor-pointer" value="blocked_access">Blocked access</SelectItem>
              <SelectItem className="cursor-pointer" value="contaminated_bin">Contaminated bin</SelectItem>
              <SelectItem className="cursor-pointer" value="bin_not_out">Bin not out</SelectItem>
              <SelectItem className="cursor-pointer" value="safety_issue">Safety issue</SelectItem>
            </SelectContent>
          </Select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border file:bg-gray-100 file:px-3 file:py-1 file:text-sm"
          />
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full cursor-pointer rounded-lg bg-black font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          SUBMIT
        </Button>
      </CardContent>
    </Card>
  )
}

export default StopCard
