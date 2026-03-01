import type { Customer } from "@/types/customer";

export const mockCustomer :Customer= {
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
    container: "6yd",
    stopOrder: 1,
    scheduledPickup: "Friday, Feb 13th",
    requestFormOpen:true,
    serviceType: "extra_pickup", 
  },
  serviceIssues: [],
  serviceHistory: [
    { date: "Feb 11", status: "Serviced", notes: "" },
    { date: "Feb 8", status: "Serviced", notes: "" },
    { date: "Feb 6", status: "Unable to Service", notes: "Bin Not Out" },
  ],
};