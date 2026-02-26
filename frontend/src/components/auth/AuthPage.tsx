import { useState } from "react";
import logo from "../../assets/image.jpeg";
import driverPic from "../../assets/Garbage_Men.jpeg";
import customerPic from "../../assets/Customer.jpeg";
// import type { FormEvent } from "react";
import type { Role } from "../../types/auth";

type AuthPageProps = {
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, role: Role) => Promise<void>;
};

export function AuthPage({ loading, onLogin, onSignup }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"driver" | "customer">("driver");
  const canSubmit = Boolean(email.trim() && password.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email, password);
  }

  async function handleSignupClick() {
    const role: Role = loginType;
    await onSignup(email, password, role);
  }

  const images: Record<string, string> = {
    driver: driverPic,
    customer: customerPic, // example customer image
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
                  onClick={() => {
                    setLoginType(
                      loginType === "driver" ? "customer" : "driver",
                    );
                    handleSignupClick();
                  }}
                >
                  {loginType === "driver" ? "Customer Login" : "Driver Login"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
