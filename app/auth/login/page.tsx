'use client';
import { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase';

export default function Login() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      // Timeout to handle login requests upto 2s
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 2000);
      });

      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        }),
        timeoutPromise
      ]) as any;

      if (error) throw error;
      
      if (!data || !data.user) {
        throw new Error('Authentication failed. Please try again.');
      }

      if (!data.user.email_confirmed_at) {
        router.push('/auth/verify-email');
        return;
      }

      // Try to get role from user metadata first (faster)
      let userRole = data.user.user_metadata?.role;
      
      // Only fetch profile if role isn't in metadata
      if (!userRole) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;
        userRole = profileData?.role;
      }
      
      // Determine redirect path based on role
      let redirectPath = '/dashboard';
      if (userRole) {
        switch (userRole) {
          case 'projectManager':
            redirectPath = '/dashboard/pm';
            break;
          case 'qcTeam':
            redirectPath = '/dashboard/qc';
            break;
          case 'qaTeam':
            redirectPath = '/dashboard/qa';
            break;
        }
      }
      
      // Direct redirect without prefetch for faster response
      router.push(redirectPath);
      
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Bytes 2 Knowledge</h2>
              </div>
              
              <div className="mt-16">
                <h1 className="text-3xl font-bold">Management Information Software</h1>
                <div className="w-64 h-1 bg-white mt-4 mb-6 opacity-50 rounded-full"></div>
                <p className="text-xl">
                  Manage all employees, payrolls, and other human resource operations.
                </p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 p-8 sm:p-12">
              <div className="mt-4 md:mt-10">
                <h2 className="text-3xl font-bold text-blue-800">Welcome to B2K</h2>
                <h3 className="text-2xl font-bold text-blue-800 mb-6">Login</h3>
                <p className="text-gray-500 mb-8">Login to your account.</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    Not a member yet?{' '}
                    <Link href="/auth/signup" className="font-medium text-blue-700 hover:text-blue-800">
                      Create your account
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}