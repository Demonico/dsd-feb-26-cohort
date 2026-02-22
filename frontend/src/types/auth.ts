export type SupabaseAuthResponse = {
  access_token?: string;
  error_description?: string;
  msg?: string;
};

export type Role = "driver" | "customer";

export type User = {
  id: string;
  email: string;
  role?: Role;
  user_metadata?: {
    role?: Role;
  };
};
