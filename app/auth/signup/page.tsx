"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabase";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [mounted, setMounted] = useState(false);

  const [role, setRole] = useState<string>("projectManager");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log(formData);
      //usage of metadata in case of new user to handle the requests.
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            name: formData.name,
            role: role,
          },
        },
      });
      console.log("data : ", data);
      if (signupError) {
        console.log("signupError : ", signupError);
        throw signupError;
        return;
      }
      const user = data.user;
      console.log(user);
      if (!user) throw new Error("User not returned from signup.");

      //profile created by the db trigger.
      router.push("/auth/verify-email");
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <Head>
        <title>Sign Up | Bytes 2 Knowledge</title>
        <meta name="description" content="Create your B2K account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-6xl">
          <div className="bg-white overflow-hidden shadow-md sm:rounded-lg flex">
            {/* Left Side - Form */}
            <div className="w-full md:w-1/2 p-8 sm:p-12">
              <div className="mt-4 md:mt-10">
                <h2 className="text-3xl font-bold text-blue-800">Sign Up</h2>
                <p className="text-gray-500 mb-8">Create your account</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSignup}>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-blue-800"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-blue-800"
                    >
                      E-mail Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-blue-800"
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-blue-800"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={handleRoleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="projectManager">Project Manager</option>
                      <option value="qcTeam">QC Team</option>
                      <option value="qaTeam">QA Team</option>
                      <option value = "processor">Processing Team</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? "Creating Account..." : "Create Your Account"}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="font-medium text-blue-700 hover:text-blue-800"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block md:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-800 opacity-90"></div>
              <img
                src="/employment-agreement.jpg"
                alt="Employment Agreement Document"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-center px-8">
                <div className="text-white space-y-4">
                  <h2 className="text-3xl font-bold">
                    Manage all{" "}
                    <span className="text-yellow-400">Operations</span> with
                    ease through <span className="text-white">Infosphere</span>.
                  </h2>
                  <div className="flex space-x-2 mt-8">
                    <div className="w-12 h-2 bg-yellow-400 rounded"></div>
                    <div className="w-12 h-2 bg-white rounded"></div>
                    <div className="w-12 h-2 bg-white rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
