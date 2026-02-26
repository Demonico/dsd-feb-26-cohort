export type ManifestRow = {
  id: number;
  locationLine1: string;
  locationLine2: string;
  customer: string;
  service: string;
  container: string;
  size: string;
  status: "Completed" | "Pending" | "Skipped" | "Extra";
};