import { House, Truck, Users } from "lucide-react";
import type { SidebarItem } from "../types/sidebar";

export const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: House, path: "/dashboard" },
  { label: "Driver Manifest", icon: Truck, path: "/driver" },
  { label: "Customers", icon: Users, path: "/customer" },
];
