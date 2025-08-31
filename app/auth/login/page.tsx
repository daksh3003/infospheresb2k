"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api";
import LoadingScreen from "@/components/ui/loading-screen";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [mounted, setMounted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.login(formData.email, formData.password);

      if (!result.user) {
        throw new Error("Authentication failed. Please try again.");
      }

      if (!result.user.email_confirmed_at) {
        router.push("/auth/verify-email");
        return;
      }

      const userRole = result.role;

      // Determine redirect path based on role : useful in the case of redirecting to respective dashboards based on the roles.
      let redirectPath = "/dashboard";
      if (userRole) {
        switch (userRole) {
          case "projectManager":
            redirectPath = "/dashboard/pm";
            break;
          case "qcTeam":
            redirectPath = "/dashboard/qc";
            break;
          case "qaTeam":
            redirectPath = "/dashboard/qa";
            break;
          case "processor":
            redirectPath = "/dashboard/processor";
            break;
        }
      }

      // Direct redirect without prefetch for faster response
      router.push(redirectPath);
    } catch (error: unknown) {
      console.error("Error logging in:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen message="Initializing..." />;

  return (
    <>
      {loading && <LoadingScreen variant="overlay" message="Signing in..." />}
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <Head>
          <title>Login | Bytes 2 Knowledge</title>
          <meta name="description" content="Login to your B2K account" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-6xl">
            <div className="bg-white overflow-hidden shadow-md sm:rounded-lg flex">
              {/* Left Side - Blue Panel */}
              <div className="hidden md:block md:w-1/2 bg-blue-800 p-12 text-white relative">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">Bytes 2 Knowledge</h2>
                </div>

                <div className="mt-16">
                  <h1 className="text-3xl font-bold">
                    Management Information Software
                  </h1>
                  <div className="w-64 h-1 bg-white mt-4 mb-6 opacity-50 rounded-full"></div>
                  <p className="text-xl">
                    Manage all employees, payrolls, and other human resource
                    operations.
                  </p>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="w-full md:w-1/2 p-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome back
                    </h3>
                    <p className="text-gray-600">
                      Please enter your details to sign in
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {loading ? "Signing in..." : "Sign in"}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6">
                    <p className="text-center text-sm text-gray-600">
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/auth/signup"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
