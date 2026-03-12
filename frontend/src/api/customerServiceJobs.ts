import http from "./http";
import type {
  CustomerServiceJobApi,
  CustomerServiceJobsResponse,
  UpdateCustomerServiceJobPayload,
} from "@/types/customer";

export async function fetchCustomerServiceJobs(): Promise<CustomerServiceJobApi[]> {
  const response = await http.get<CustomerServiceJobsResponse>("/service-jobs/customer");
  return response.data.service_jobs ?? [];
}

export async function patchCustomerServiceJobMetadata(
  jobId: number,
  payload: UpdateCustomerServiceJobPayload,
): Promise<CustomerServiceJobApi> {
  const response = await http.patch<{ service_job: CustomerServiceJobApi }>(
    `/service-jobs/${jobId}/metadata`,
    payload,
  );
  return response.data.service_job;
}
