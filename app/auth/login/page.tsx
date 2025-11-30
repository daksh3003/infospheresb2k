"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/client";
import LoadingScreen from "@/components/ui/loading-screen";
import { toast } from "react-toastify";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const supabase = createClient();

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

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Authentication failed");
      }

      // Check email confirmation
      if (!data.user.email_confirmed_at) {
        router.push("/auth/verify-email");
        return;
      }

      // Track session on server
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      });

      // Check for redirect parameter from middleware
      const redirect = searchParams.get('redirect');

      if (redirect && redirect !== '/') {
        // Redirect back to the original page
        router.push(redirect);
      } else {
        // Let middleware handle the redirect based on role
        router.push('/');
      }

      // Refresh to trigger middleware and update server-side session
      router.refresh();

    } catch (error: unknown) {
      toast("Invalid login credentials", {
        type: "error",
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if redirected due to session timeout
    const sessionTimeout = searchParams.get('session_timeout');
    if (sessionTimeout === 'true') {
      toast("Session expired. Please log in again.", {
        type: "warning",
        position: "top-right",
      });
    }
  }, [searchParams]);

  return (
    <>
      {loading && <LoadingScreen variant="overlay" message="Signing in..." />}
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">

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
