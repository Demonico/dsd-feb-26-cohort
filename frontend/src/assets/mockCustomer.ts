import type { Customer } from "@/types/customer";

export const mockCustomer: Customer = {
  id: "1",
  name: "Jane Doe",
  role: "customer",
  location: {
    name: "Green Valley Apartments",
    street: "214 Maple St",
    city: "Springfield",
    state: "IL",
    zip: "62704",
  },
  serviceJob: {
    status: "pending",
    service: "Scheduled",
    stopOrder: 1,
    scheduledPickup: "Friday, Feb 13th",
    requestFormOpen: true,
    serviceType: "extra_pickup",
  },
  serviceIssues: [
    {
      reason: "Container Blocked",
      photoUrl:
        "https://images.unsplash.com/photo-1602524812060-1f3e5c8b9f2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    },
  ],
  serviceHistory: [
    { date: "Feb 11", status: "Serviced", notes: "" },
    { date: "Feb 8", status: "Serviced", notes: "" },
    { date: "Feb 6", status: "Unable to Service", notes: "Bin Not Out" },
  ],
};
