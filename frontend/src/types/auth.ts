export type SupabaseAuthResponse = {
  access_token?: string;
  error_description?: string;
  msg?: string;
};

export type User = {
  id: string;
  email: string;
  role?: "driver" | "customer";
};
