import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import http from "@/api/http";
import type { Stop } from "@/types/driver";

type StopCardProps = {
  stop: Stop;
  onComplete?: (updatedStop: Stop) => void;
};

const StopCard = ({ stop, onComplete }: StopCardProps) => {
  const [statusAction, setStatusAction] = useState<"COMPLETED" | "FAILED" | null>(
    null,
  );
  const [reason, setReason] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isSubmitDisabled =
    !statusAction || (statusAction === "FAILED" && reason.length === 0);

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update job status and failure reason
      const updatePayload: any = {
        status: statusAction,
        completed_at: new Date().toISOString(),
      };
      
      // Only include failure_reason if status is FAILED and reason is selected
      if (statusAction === "FAILED" && reason) {
        updatePayload.failure_reason = reason;
      }
      
      await http.patch(`/service-jobs/${stop.job_id}/metadata`, updatePayload);

      // Upload proof image if provided (only for FAILED status)
      if (proofFile && statusAction === "FAILED") {
        if (!stop.job_id) {
          throw new Error("Job ID is missing");
        }
        
        const formData = new FormData();
        formData.append("file", proofFile);
        formData.append("job_id", stop.job_id.toString());

        const response = await http.post("/uploads/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Call onComplete with updated stop data
      if (onComplete) {
        const updatedStop: Stop = {
          ...stop,
          status: statusAction,
          failure_reason: statusAction === "FAILED" ? reason : null,
        };
        onComplete(updatedStop);
      }

      setSuccess(true);
      setTimeout(() => {
        setStatusAction(null);
        setReason("");
        setProofFile(null);
        setSuccess(false);
      }, 1000);
    } catch (err: any) {
      let errorMsg = "Failed to upload proof";
      
      if (err.response?.data?.detail) {
        // Handle array of validation errors
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((e: any) => 
            `${e.loc?.join('.') || 'field'}: ${e.msg}`
          ).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else {
          errorMsg = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
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

        <div className="grid grid-cols-1 gap-2 text-sm font-semibold sm:grid-cols-2">
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

        {statusAction === "FAILED" && (
          <div className="space-y-2">
            <Select
              value={reason}
              onValueChange={setReason}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Reason for not serving" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={6} align="start">
                <SelectItem className="cursor-pointer" value="IMPROPER_PLACEMENT">Improper Placement of Garbage</SelectItem>
                <SelectItem className="cursor-pointer" value="CONTAMINATED_BIN">Contaminated Bin</SelectItem>
                <SelectItem className="cursor-pointer" value="BIN_NOT_OUT">Bin Not Out</SelectItem>
                <SelectItem className="cursor-pointer" value="SAFETY_ISSUE">Safety Issue</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border file:bg-gray-100 file:px-3 file:py-1 file:text-sm"
            />
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-50 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-2 bg-green-50 text-green-700 text-sm rounded">
            {statusAction === "FAILED" && proofFile 
              ? "Proof uploaded successfully!" 
              : "Stop completed successfully!"}
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled || uploading}
          className="w-full cursor-pointer rounded-lg bg-black font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploading ? "SUBMITTING..." : "SUBMIT"}
        </Button>
      </CardContent>
    </Card>
  )
}

export default StopCard
