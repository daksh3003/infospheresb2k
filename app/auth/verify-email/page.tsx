'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const emailFromUrl = searchParams?.get('email') || '';
  
  //to redirect to the mail from a static verify
  const openEmailClient = () => {
    if (emailFromUrl) {
      window.location.href = `mailto:${emailFromUrl}`;
    } else {
      window.open('https://mail.google.com', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Verify Email | Bytes 2 Knowledge</title>
        <meta name="description" content="Verify your email address" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Check your email</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a verification link to{' '}
          <span className="font-semibold">{emailFromUrl || 'your email address'}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-md text-gray-700 mb-8">
              Please check your inbox and click on the verification link to activate your account.
            </p>
            
            <button 
              onClick={openEmailClient}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open Email App
            </button>
            
            <div className="mt-6 text-center">
              <Link 
                href="/auth/login" 
                className="font-medium text-blue-700 hover:text-blue-800"
              >
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}