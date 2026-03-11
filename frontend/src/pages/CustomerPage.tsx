import CustomerHeader from "@/components/CustomerHeader";
import LocationCard from "@/components/LocationCard";
import ServiceStatusCard from "@/components/ServiceStatusCard";
import ServiceHistoryCard from "@/components/ServiceHistoryCard";
import ServiceIssuesCard from "@/components/ServiceIssuesCard";

import type { Customer } from "@/types/customer";

import { mockCustomer } from "@/assets/mockCustomer";

const CustomerPage = () => {
  const customer: Customer = mockCustomer;

  return (
    <div className="p-6">
        <CustomerHeader location={`${customer.location.city}, ${customer.location.state}`} />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-stretch">
    
      <div className="flex flex-col gap-4">
        <LocationCard location={customer.location} serviceJob={customer.serviceJob} />
        <ServiceHistoryCard serviceHistory={customer.serviceHistory} />
      </div>
      <div className="flex flex-col gap-4">
        <ServiceStatusCard serviceJob={customer.serviceJob}/>
        <ServiceIssuesCard />
      </div>


    </div>
    </div>

  )
}

export default CustomerPage;
