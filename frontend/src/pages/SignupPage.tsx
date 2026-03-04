import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";

import type { Role } from "@/types/auth";
import type { SignupDetails } from "@/types/signup";

type SignupPageProps = {
  loading: boolean;
  error: string | null;
  notice: string | null;
  onSignup: (payload: SignupDetails) => Promise<void>;
};

const defaultCustomerForm = {
  customer_name: "",
  billing_address: "",
  phone_number: "",
  street_address: "",
  city: "",
  state: "",
  zipcode: "",
};

type SignupFormValues = {
  role: Role;
  email: string;
  password: string;
  driver_name: string;
} & typeof defaultCustomerForm;

export default function SignupPage({
  loading,
  error,
  notice,
  onSignup,
}: SignupPageProps) {
  const { register, control, setValue, handleSubmit } = useForm<SignupFormValues>({
    defaultValues: {
      role: "customer",
      email: "",
      password: "",
      driver_name: "",
      ...defaultCustomerForm,
    },
  });
  const values = useWatch({ control });
  const role = values.role ?? "customer";

  const canSubmit = useMemo(() => {
    if (!values.email?.trim() || !values.password?.trim()) {
      return false;
    }

    if (role === "driver") {
      return Boolean(values.driver_name?.trim());
    }

    return Boolean(
      values.customer_name?.trim() &&
        values.phone_number?.trim() &&
        values.street_address?.trim() &&
        values.city?.trim() &&
        values.state?.trim() &&
        values.zipcode?.trim(),
    );
  }, [role, values]);

  async function onSubmit(formData: SignupFormValues) {
    if (formData.role === "driver") {
      await onSignup({
        role: "driver",
        email: formData.email,
        password: formData.password,
        driver_name: formData.driver_name,
      });
      return;
    }

    await onSignup({
      role: "customer",
      email: formData.email,
      password: formData.password,
      customer_name: formData.customer_name,
      billing_address: formData.billing_address,
      phone_number: formData.phone_number,
      street_address: formData.street_address,
      city: formData.city,
      state: formData.state,
      zipcode: formData.zipcode,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-slate-600 mt-1">
          Register as a customer or driver and complete your profile details.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm ${
              role === "customer"
                ? "bg-[#005B17] text-white border-[#005B17]"
                : "bg-white border-slate-300"
            }`}
            onClick={() => setValue("role", "customer")}
          >
            Customer
          </button>
          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm ${
              role === "driver"
                ? "bg-[#005B17] text-white border-[#005B17]"
                : "bg-white border-slate-300"
            }`}
            onClick={() => setValue("role", "driver")}
          >
            Driver
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("role")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                {...register("email")}
                className="border rounded-md px-3 py-2"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Password
              <input
                type="password"
                {...register("password")}
                className="border rounded-md px-3 py-2"
                minLength={6}
                required
              />
            </label>
          </div>

          {role === "driver" ? (
            <label className="flex flex-col gap-1 text-sm">
              Driver name
              <input
                {...register("driver_name")}
                className="border rounded-md px-3 py-2"
                required
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm">
                Customer name
                <input
                  {...register("customer_name")}
                  className="border rounded-md px-3 py-2"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Phone number
                <input
                  {...register("phone_number")}
                  className="border rounded-md px-3 py-2"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                Billing address (optional)
                <input
                  {...register("billing_address")}
                  className="border rounded-md px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                Street address
                <input
                  {...register("street_address")}
                  className="border rounded-md px-3 py-2"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                City
                <input
                  {...register("city")}
                  className="border rounded-md px-3 py-2"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                State
                <input
                  {...register("state")}
                  className="border rounded-md px-3 py-2"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                Zip code
                <input
                  {...register("zipcode")}
                  className="border rounded-md px-3 py-2"
                  required
                />
              </label>
            </div>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {notice ? <p className="text-sm text-blue-700">{notice}</p> : null}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full bg-[#005B17] text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <p className="text-sm text-center text-slate-600">
            Already have an account?{" "}
            <Link className="text-blue-600 hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
