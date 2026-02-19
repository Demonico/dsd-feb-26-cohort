export type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
  };
  error_description?: string;
  msg?: string;
};

export type User = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
};
