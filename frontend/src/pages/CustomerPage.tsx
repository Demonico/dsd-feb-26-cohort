import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";

import CustomerHeader from "@/components/CustomerHeader";
import LocationCard from "@/components/LocationCard";
import ServiceStatusCard from "@/components/ServiceStatusCard";
import ServiceHistoryCard from "@/components/ServiceHistoryCard";
import ServiceIssuesCard from "@/components/ServiceIssuesCard";
import {
  createCustomerRequest,
  fetchCustomerServiceJobs,
} from "@/api/customerServiceJobs";
import type {
  CustomerRequestType,
  Customer,
  CustomerLocation,
  CustomerServiceJobApi,
  ServiceHistoryEntry,
  ServiceIssue,
  ServiceJob,
} from "@/types/customer";
import type { User } from "@/types/auth";

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

function toIsoDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
}

function buildCurrentServiceJob(job: CustomerServiceJobApi | null): ServiceJob {
  if (!job) {
    return {
      jobId: undefined,
      status: "pending",
      service: "No active service job",
      stopOrder: 0,
      scheduledPickup: "Not scheduled",
      serviceDate: undefined,
      requestFormOpen: false,
      serviceType: "normal_pickup",
    };
  }

  return {
    jobId: job.job_id,
    status: mapStatus(job.status),
    service: job.job_source === "EXTRA_REQUEST" ? "Extra Pickup" : "Scheduled",
    stopOrder: job.sequence_order ?? 0,
    scheduledPickup: formatDisplayDate(job.service_date),
    serviceDate: toIsoDate(job.service_date),
    requestFormOpen: job.status === "PENDING" || job.status === "SKIPPED",
    serviceType: mapServiceType(job),
  };
}

function buildLocation(
  job: CustomerServiceJobApi | null,
  customerName: string,
): CustomerLocation {
  return {
    name: customerName,
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

function buildServiceIssues(jobs: CustomerServiceJobApi[]): ServiceIssue[] {
  return jobs
    .filter((job) => job.status === "FAILED" && job.failure_reason)
    .map((job) => ({
      jobId: job.job_id,
      reason: job.failure_reason as string,
      completedAt: job.completed_at,
      photoUrl: job.proof_of_service_photo ?? undefined,
      hasProof: Boolean(job.proof_of_service_photo),
    }));
}

function resolveCustomerName(
  jobs: CustomerServiceJobApi[],
  user: User,
): string {
  const jobName = jobs.find((job) => job.customer_name)?.customer_name?.trim();
  if (jobName) return jobName;
  return user.email;
}

function buildCustomerViewModel(jobs: CustomerServiceJobApi[], user: User): Customer {
  const currentJob =
    jobs.find((job) => job.status === "PENDING") ??
    jobs.find((job) => job.status === "SKIPPED") ??
    jobs[0] ??
    null;
  const customerName = resolveCustomerName(jobs, user);

  return {
    id: user.id,
    name: customerName,
    role: "customer",
    location: buildLocation(currentJob, customerName),
    serviceJob: buildCurrentServiceJob(currentJob),
    serviceIssues: buildServiceIssues(jobs),
    serviceHistory: buildServiceHistory(jobs),
  };
}

function formatLocationLabel(location: CustomerLocation): string {
  const parts = [location.city, location.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : location.street;
}

function isToday(serviceDate?: string): boolean {
  if (!serviceDate) return false;

  const today = new Date().toISOString().slice(0, 10);
  return serviceDate === today;
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

function mapRequestType(
  serviceType: ServiceJob["serviceType"] | null,
): CustomerRequestType | null {
  if (serviceType === "normal_pickup") return "NORMAL";
  if (serviceType === "extra_pickup") return "EXTRA";
  if (serviceType === "skip_pickup") return "SKIP";
  return null;
}

type CustomerPageProps = {
  user: User;
};

const CustomerPage = ({ user }: CustomerPageProps) => {
  const [jobs, setJobs] = useState<CustomerServiceJobApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceJob["serviceType"] | null>(null);
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);

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

  const customer: Customer = useMemo(() => buildCustomerViewModel(jobs, user), [jobs, user]);
  const isPickupDay =
    customer.serviceJob.status === "pending" &&
    isToday(customer.serviceJob.serviceDate);

  useEffect(() => {
    setSelectedServiceType(customer.serviceJob.serviceType);
  }, [customer.serviceJob.serviceType]);

  useEffect(() => {
    setIsRequestSubmitted(false);
  }, [customer.serviceJob.jobId]);

  async function handleRequestSubmit() {
    try {
      const requestType = mapRequestType(selectedServiceType);
      if (!requestType) {
        throw new Error("A service type must be selected before submitting");
      }

      if (!customer.serviceJob.serviceDate) {
        throw new Error("Scheduled pickup date is unavailable for this request");
      }

      setError(null);
      await createCustomerRequest({
        request_type: requestType,
        requested_for_date: customer.serviceJob.serviceDate,
      });
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
      throw submitError;
    }
  }

  if (loading) {
    return <div className="p-6">Loading customer service jobs...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <CustomerHeader
        customerName={customer.name}
        location={formatLocationLabel(customer.location)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-stretch">
        <div className="flex flex-col gap-4">
          <LocationCard
            location={customer.location}
            serviceJob={customer.serviceJob}
            selectedServiceType={selectedServiceType}
            setSelectedServiceType={setSelectedServiceType}
            isSubmitted={isRequestSubmitted}
            onSubmittedChange={setIsRequestSubmitted}
            onSubmit={handleRequestSubmit}
          />
          <ServiceHistoryCard serviceHistory={customer.serviceHistory} />
        </div>
        <div className="flex flex-col gap-4">
          <ServiceStatusCard
            serviceJob={customer.serviceJob}
            isSubmitted={isRequestSubmitted}
            isPickupDay={isPickupDay}
          />
          <ServiceIssuesCard issues={customer.serviceIssues} />
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
