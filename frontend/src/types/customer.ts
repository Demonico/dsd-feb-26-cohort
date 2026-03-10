export type ServiceHistoryEntry = {
  date: string;
  status: string;
  notes: string;
};

export type ServiceJob = {
  status: "pending" | "serviced" | "unable_to_service";
  service: string;
  stopOrder: number;
  scheduledPickup: string;
  requestFormOpen: boolean;
  serviceType: "normal_pickup" | "extra_pickup" | "skip_pickup";
  jobId?: number;
};

export type CustomerLocation = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type Customer = {
  id: string;
  name: string;
  role: string;
  location: CustomerLocation;
  serviceJob: ServiceJob;
  serviceIssues: string[];
  serviceHistory: ServiceHistoryEntry[];
};

export type ServiceJobStatus = "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";
export type ServiceJobSource = "SCHEDULED" | "EXTRA_REQUEST";

export type CustomerServiceJobApi = {
  job_id: number;
  location_id: number;
  route_id?: number | null;
  sequence_order?: number | null;
  job_source: ServiceJobSource;
  address?: {
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    zipcode?: string | null;
  };
  requested_for_date?: string | null;
  completed_at?: string | null;
  status: ServiceJobStatus;
  failure_reason?: string | null;
  proof_of_service_photo?: string | null;
};

export type CustomerServiceJobsResponse = {
  service_jobs: CustomerServiceJobApi[];
};

export type UpdateCustomerServiceJobPayload = {
  job_source?: ServiceJobSource;
  status?: ServiceJobStatus;
  completed_at?: string;
  failure_reason?: string | null;
  proof_of_service_photo?: string | null;
};
