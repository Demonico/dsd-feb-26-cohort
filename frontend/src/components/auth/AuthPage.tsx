import { useState } from "react";
// import logo from "../assets/image.jpeg";
import logo from "../../assets/image.jpeg";
import type { FormEvent } from "react";
import type { Role } from "../../types/auth";

type AuthPageProps = {
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, role: Role) => Promise<void>;
};

export function AuthPage({ loading, onLogin, onSignup }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = Boolean(email.trim() && password.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email, password);
  }

  async function handleSignupClick() {
    await onSignup(email, password, role);
  }

  const images: Record<string, string> = {
    driver:
      "https://cst.brightspotcdn.com/dims4/default/a6411a6/2147483647/strip/false/crop/1919x1329+0+0/resize/1486x1029!/quality/90/?url=https%3A%2F%2Fcdn.vox-cdn.com%2Fthumbor%2FoUfsgp4fwpfTmCpyY5J85aEMKr0%3D%2F129x35%3A2048x1364%2F1919x1329%2Ffilters%3Afocal%281024x682%3A1025x683%29%2Fcdn.vox-cdn.com%2Fuploads%2Fchorus_asset%2Ffile%2F21980708%2FStreets_San_garbage_truck_mayor_twitter.jpg",
    customer:
      "https://cdn.create.vista.com/api/media/small/22936308/stock-photo-shopping", // example customer image
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden md:flex md:w-[65%]">
        <img
          src={images[loginType]}
          alt={`${loginType} login`}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex flex-col w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-row items-center mb-10">
            <img src={logo} alt="logo" className="w-8 h-8" />
            <h1 className="text-md font-bold text-[#005B17]">RECYKLE</h1>
          </div>

          <h2 className="text-3xl font-medium mb-6">
            {loginType === "driver" ? "Driver Login" : "Customer Login"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-6 mb-5">
                <label className="mb-2  block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-2 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end mt-3">
                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full bg-[#005B17] text-white py-2 rounded-[10px] hover:bg-green-700 transition duration-200 mt-4"
              >
                {loading ? "Working..." : "Sign in"}
              </button>
              <div className="flex justify-center mt-6">
                <p className="text-sm text-gray-500">
                  {loginType === "driver" ? "Not a Driver?" : "Not a Customer?"}
                </p>
                <button
                  type="button"
                  className="ml-1 text-sm text-blue-600 hover:underline"
                  onClick={() =>
                    setLoginType(loginType === "driver" ? "customer" : "driver")
                  }
                >
                  {loginType === "driver" ? "Customer Login" : "Driver Login"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* <p className="subtitle">Email/password sign in and sign up with Supabase.</p> */}

      {/* <form onSubmit={handleSubmit} className="login-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={loading}
          >
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
          </select>
        </label>

        <div className="actions">
          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Working..." : "Sign in"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!canSubmit || loading}
            onClick={handleSignupClick}
          >
            Sign up
          </button>
        </div>
      </form> */}
    </div>
  );
}
