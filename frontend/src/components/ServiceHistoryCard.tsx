import { Card, CardContent } from "@/components/ui/card";
import type { ServiceHistoryEntry } from "@/types/customer";
import { Clock } from "lucide-react";

type ServiceHistoryCardProps = {
  serviceHistory: ServiceHistoryEntry[];
};

const ServiceHistoryCard = ({ serviceHistory }: ServiceHistoryCardProps) => {
  return (
    <Card className="mt-2">
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={20} className="text-green-700" />
          <p className="font-bold">Service History</p>
        </div>
        <table className="w-full">
          <thead>
              <tr className="text-left font-semibold border-b">
                <th className="pb-1 w-1/4">Date</th>
                <th className="pb-1 w-1/4">Status</th>
                <th className="pb-1 w-1/4">Notes</th>
              </tr>
          </thead>
          <tbody>
            {serviceHistory.map((item,i) => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="py-1 w-1/4">{item.date}</td>
                <td className="py-1 w-1/4">{item.status}</td>
             <td className="py-1 w-1/4">{item.notes || "-----------"}</td>

              </tr>
            ))}
          </tbody>
        </table>

      </CardContent>
    </Card>
  )
}

export default ServiceHistoryCard