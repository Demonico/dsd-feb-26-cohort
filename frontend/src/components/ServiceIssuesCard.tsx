import { Card, CardContent } from "@/components/ui/card";
import http from "@/api/http";
import type { CustomerServiceJobApi } from "@/types/customer";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ServiceIssuesCard = () => {
  const [jobs, setJobs] = useState<CustomerServiceJobApi[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await http.get<CustomerServiceJobApi[]>(
          "/service-jobs/my-jobs",
        );
        setJobs(
          response.data.filter(
            (job) => job.failure_reason && job.proof_of_service_photo,
          ),
        );
      } catch (err) {
        console.error(`Failed to load jobs: ${String(err)}`);
      }
    };
    fetchJobs();
  }, []);

  const formatCompletedAt = (completed_at?: string | null) => {
    const completedAt = completed_at ? new Date(completed_at) : null;
    return completedAt && !Number.isNaN(completedAt.getTime())
      ? completedAt.toLocaleString("en-US", { timeZone: "America/Chicago" })
      : null;
  };

  return (
    <Card className="flex-1">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TriangleAlert size={20} className="text-green-700" />
          <p className="font-bold">Service Issues</p>
        </div>

        {jobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No Issues Reported
          </p>
        ) : (
          jobs.map((job) => (
            <div key={job.job_id} className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <p className="text-sm font-semibold text-red-600">
                  {job.failure_reason}
                </p>
              </div>

              <button
                type="button"
                className="text-left"
                onClick={() => navigate(`/proof?job=${job.job_id}`)}
              >
                <p className="text-sm text-gray-600 underline">View proof</p>
              </button>

              <p className="text-xs text-gray-500">
                {formatCompletedAt(job.completed_at) ??
                  "Completion time unavailable"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
export default ServiceIssuesCard;
