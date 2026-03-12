import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";

import CustomerHeader from "@/components/CustomerHeader";
import LocationCard from "@/components/LocationCard";
import ServiceStatusCard from "@/components/ServiceStatusCard";
import ServiceHistoryCard from "@/components/ServiceHistoryCard";
import ServiceIssuesCard from "@/components/ServiceIssuesCard";
import { fetchCustomerServiceJobs } from "@/api/customerServiceJobs";
import type {
  Customer,
  CustomerLocation,
  CustomerServiceJobApi,
  ServiceHistoryEntry,
  ServiceIssue,
  ServiceJob,
} from "@/types/customer";

function formatDisplayDate(value?: string | null): string {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function mapStatus(
  status: CustomerServiceJobApi["status"],
): ServiceJob["status"] {
  if (status === "COMPLETED") return "serviced";
  if (status === "FAILED") return "unable_to_service";
  return "pending";
}

function mapServiceType(job: CustomerServiceJobApi): ServiceJob["serviceType"] {
  if (job.status === "SKIPPED") return "skip_pickup";
  return job.job_source === "EXTRA_REQUEST" ? "extra_pickup" : "normal_pickup";
}

function buildCurrentServiceJob(job: CustomerServiceJobApi | null): ServiceJob {
  if (!job) {
    return {
      jobId: undefined,
      status: "pending",
      service: "No active service job",
      stopOrder: 0,
      scheduledPickup: "Not scheduled",
      requestFormOpen: false,
      serviceType: "normal_pickup",
    };
  }

  return {
    jobId: job.job_id,
    status: mapStatus(job.status),
    service: job.job_source === "EXTRA_REQUEST" ? "Extra Pickup" : "Scheduled",
    stopOrder: job.sequence_order ?? 0,
    scheduledPickup: "Not provided by API",
    requestFormOpen: job.status === "PENDING" || job.status === "SKIPPED",
    serviceType: mapServiceType(job),
  };
}

function buildLocation(job: CustomerServiceJobApi | null): CustomerLocation {
  return {
    name: "Service Location",
    street: job?.address?.street_address ?? "Address unavailable",
    city: job?.address?.city ?? "",
    state: job?.address?.state ?? "",
    zip: job?.address?.zipcode ?? "",
  };
}

function buildServiceHistory(
  jobs: CustomerServiceJobApi[],
): ServiceHistoryEntry[] {
  return jobs.map((job) => ({
    date: job.completed_at
      ? formatDisplayDate(job.completed_at)
      : "Not completed",
    status: job.status,
    notes: job.failure_reason ?? "",
  }));
}

function buildCustomerViewModel(jobs: CustomerServiceJobApi[]): Customer {
  const currentJob =
    jobs.find((job) => job.status === "PENDING") ??
    jobs.find((job) => job.status === "SKIPPED") ??
    jobs[0] ??
    null;

  return {
    id: "current-customer",
    name: "Customer",
    role: "customer",
    location: buildLocation(currentJob),
    serviceJob: buildCurrentServiceJob(currentJob),
    serviceIssues: jobs
      .filter((job) => job.status === "FAILED" && job.failure_reason)
      .map(
        (job): ServiceIssue => ({
          reason: job.failure_reason as string,
          photoUrl: job.proof_of_service_photo ?? undefined,
        }),
      ),
    serviceHistory: buildServiceHistory(jobs),
  };
}

function formatLocationLabel(location: CustomerLocation): string {
  const parts = [location.city, location.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : location.street;
}

function extractErrorMessage(error: unknown): string {
  if (isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || "Request failed";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

const CustomerPage = () => {
  const [jobs, setJobs] = useState<CustomerServiceJobApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceJob["serviceType"] | null>(null);

  useEffect(() => {
    async function loadCustomerJobs() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCustomerServiceJobs();
        setJobs(data);
      } catch (loadError) {
        setError(extractErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadCustomerJobs();
  }, []);

  const customer: Customer = useMemo(
    () => buildCustomerViewModel(jobs),
    [jobs],
  );

  useEffect(() => {
    setSelectedServiceType(customer.serviceJob.serviceType);
  }, [customer.serviceJob.serviceType]);

  if (loading) {
    return <div className="p-6">Loading customer service jobs...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <CustomerHeader location={formatLocationLabel(customer.location)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-stretch">
        <div className="flex flex-col gap-4">
          <LocationCard
            location={customer.location}
            serviceJob={customer.serviceJob}
            selectedServiceType={selectedServiceType}
            setSelectedServiceType={setSelectedServiceType}
          />
          <ServiceHistoryCard serviceHistory={customer.serviceHistory} />
        </div>
        <div className="flex flex-col gap-4">
          <ServiceStatusCard serviceJob={customer.serviceJob} />
          <ServiceIssuesCard issues={customer.serviceIssues} />
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
