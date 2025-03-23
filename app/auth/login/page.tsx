// pages/login.js
'use client';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Login() {
  const [userType, setUserType] = useState({
    projectManager: false,
    qcTeam: false,
    qaTeam: false
  });

  const handleUserTypeChange = (type: any) => {
    if(type in userType){
    setUserType(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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

                <form className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      User Name
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="projectManager"
                        name="projectManager"
                        type="checkbox"
                        checked={userType.projectManager}
                        onChange={() => handleUserTypeChange('projectManager')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="projectManager" className="ml-2 block text-sm text-gray-700">
                        Project Manager?
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="qcTeam"
                        name="qcTeam"
                        type="checkbox"
                        checked={userType.qcTeam}
                        onChange={() => handleUserTypeChange('qcTeam')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="qcTeam" className="ml-2 block text-sm text-gray-700">
                        QC Team?
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="qaTeam"
                        name="qaTeam"
                        type="checkbox"
                        checked={userType.qaTeam}
                        onChange={() => handleUserTypeChange('qaTeam')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="qaTeam" className="ml-2 block text-sm text-gray-700">
                        QA Team?
                      </label>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sign In
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    Not a member yet?{' '}
                    <Link href="./signup" className="font-medium text-blue-700 hover:text-blue-800">
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