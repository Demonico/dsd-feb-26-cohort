import { Card, CardContent } from "@/components/ui/card";
import { Info, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import http from "../api/http";

type Job = {
  job_id: number;
  status: string;
  completed_at: string | null;
  proof_of_service_photo: string | null;
};

const ServiceIssuesCard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await http.get("/service-jobs/my-jobs");
        setJobs(response.data.filter((job: Job) => job.proof_of_service_photo));
      } catch (err) {
        console.error("Failed to load jobs");
      }
    };
    fetchJobs();
  }, []);

  const formatCompletedAt = (completed_at: string | null) => {
    const completedAt = completed_at ? new Date(completed_at) : null;
    return completedAt && !Number.isNaN(completedAt.getTime())
      ? completedAt.toLocaleString("en-US", { timeZone: "America/Chicago" })
      : null;
  };

  return (
    <Card className="flex-1">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-green-700" />
          <p className="font-bold">Service Issues</p>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No Proofs Available</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.job_id}
              onClick={() => navigate(`/proof?job=${job.job_id}`)}
              className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Image size={16} className="text-green-700" />
                <p className="text-sm">
                  Job #{job.job_id} - {job.status}
                </p>
              </div>
              {formatCompletedAt(job.completed_at) && (
                <p className="text-xs text-gray-500">
                  {formatCompletedAt(job.completed_at)}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceIssuesCard;