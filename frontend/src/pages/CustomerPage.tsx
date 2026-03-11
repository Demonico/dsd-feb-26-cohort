import CustomerHeader from "@/components/CustomerHeader";
import LocationCard from "@/components/LocationCard";
import ServiceStatusCard from "@/components/ServiceStatusCard";
import ServiceHistoryCard from "@/components/ServiceHistoryCard";
import ServiceIssuesCard from "@/components/ServiceIssuesCard";
import { useState } from "react";
import type { Customer, ServiceJob } from "@/types/customer";

import { mockCustomer } from "@/assets/mockCustomer";

const CustomerPage = () => {
  const [customer] = useState<Customer>(mockCustomer);
  const [selectedServiceType, setSelectedServiceType] = useState<
    ServiceJob["serviceType"] | null
  >(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedServiceType, setSubmittedServiceType] = useState<
    ServiceJob["serviceType"] | null
  >(null);

  if (!customer) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex justify-center align-items-center flex-col p-6">
      <CustomerHeader
        location={`${customer.location.city}, ${customer.location.state}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-stretch">
        <div className="flex flex-col gap-4">
          <LocationCard
            location={customer.location}
            serviceJob={customer.serviceJob}
            selectedServiceType={selectedServiceType}
            setSelectedServiceType={setSelectedServiceType}
            onSubmit={() => {
              setSubmittedServiceType(selectedServiceType);
              setIsSubmitted(true);
            }}
          />
          <ServiceHistoryCard serviceHistory={customer.serviceHistory} />
        </div>
        <div className="flex flex-col gap-4">
          <ServiceStatusCard
            serviceJob={{
              ...customer.serviceJob,
              serviceType:
                submittedServiceType ?? customer.serviceJob.serviceType,
            }}
            isSubmitted={isSubmitted}
            isPickupDay={false}
          />
          <ServiceIssuesCard issues={customer.serviceIssues} />
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
