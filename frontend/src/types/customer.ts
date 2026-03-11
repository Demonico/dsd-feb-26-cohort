export type ServiceHistoryEntry = {
  date: string;
  status: string;
  notes: string;
};

export type ServiceJob = {
  status: "pending" | "serviced" | "unable_to_service";
  service: string;
  container: string;
  stopOrder: number;
  scheduledPickup: string;
  requestFormOpen: boolean;
  serviceType: "normal_pickup" | "extra_pickup" | "skip_pickup";
};

export type CustomerLocation = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type ServiceIssue = {
  reason: string;
  photoUrl?: string;
};
export type Customer = {
  id: string;
  name: string;
  role: string;
  location: CustomerLocation;
  serviceJob: ServiceJob;
  serviceIssues: ServiceIssue[];
  serviceHistory: ServiceHistoryEntry[];
};
