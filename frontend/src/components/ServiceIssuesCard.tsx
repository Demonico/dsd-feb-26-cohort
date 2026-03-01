import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";


type ServiceIssuesCardProps = {
  issues: string[];
};

const ServiceIssuesCard = ({ issues }: ServiceIssuesCardProps) => {
  return (
    <Card className="flex-1">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Info size={20} className="text-green-700" />
          <p className="font-bold">Service Issues</p>
        </div>
        {issues.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No Issues Reported</p>
        ) : (
          issues.map((issue, i) => (
            <p key={i} className="text-sm text-red-500">{issue}</p>
          ))
        )}
      </CardContent>
    </Card>

  )
}

export default ServiceIssuesCard;