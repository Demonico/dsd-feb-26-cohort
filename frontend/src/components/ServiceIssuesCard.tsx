import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ServiceIssue = {
  reason: string;
  photoUrl?: string;
};

type ServiceIssuesCardProps = {
  issues: ServiceIssue[];
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
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TriangleAlert size={20} className="text-green-700" />
          <p className="font-bold">Service Issues</p>
        </div>

        {issues.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No Issues Reported
          </p>
        ) : (
          issues.map((issue, i) => (
            <div
              key={i}
              className="p-3 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <p className="text-sm font-semibold text-red-600">
                  {issue.reason}
                </p>
              </div>

              {issue.photoUrl && (
                <img
                  src={issue.photoUrl}
                  alt="Driver proof"
                  className="max-h-48 object-cover"
                />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};


export default ServiceIssuesCard;
