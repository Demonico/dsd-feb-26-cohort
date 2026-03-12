import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import http from "../api/http";

const formatFailureReason = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    IMPROPER_PLACEMENT: "Improper Placement of Garbage",
    CONTAMINATED_BIN: "Contaminated Bin",
    BIN_NOT_OUT: "Bin Not Out",
    SAFETY_ISSUE: "Safety Issue"
  };
  return reasonMap[reason] || reason;
};

const CustomerProofView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProof = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get("job");
      
      if (!jobId) {
        setError("No job specified");
        setLoading(false);
        return;
      }

      try {
        const [jobResponse, proofResponse] = await Promise.all([
          http.get("/service-jobs/my-jobs"),
          http.get(`/uploads/job/${jobId}/proof`)
        ]);
        
        const job = jobResponse.data.find((j: any) => j.job_id.toString() === jobId);
        if (job) {
          setJobStatus(job.status);
          setFailureReason(job.failure_reason);
        }
        
        setImageUrl(proofResponse.data.url);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load proof");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProof();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate("/customer")}
        className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>
      
      <h1 className="text-3xl font-bold mb-6">Proof of Service</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {imageUrl && (
          <div>
            {jobStatus && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
                <p className="font-semibold text-sm">Status: {jobStatus}</p>
              </div>
            )}
            
            {failureReason && (
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                <p className="font-semibold text-sm">Service Issue:</p>
                <p className="text-sm">{formatFailureReason(failureReason)}</p>
              </div>
            )}
            
            <img
              src={imageUrl}
              alt="Proof of service"
              className="w-full rounded-lg shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProofView;
