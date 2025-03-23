// pages/signup.tsx
'use client';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface UserTypeState {
  projectManager: boolean;
  qcTeam: boolean;
  qaTeam: boolean;
}

export default function Signup() {
  const [userType, setUserType] = useState<UserTypeState>({
    projectManager: false,
    qcTeam: false,
    qaTeam: false
  });

  const handleUserTypeChange = (type: keyof UserTypeState): void => {
    setUserType(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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

                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-blue-800">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-blue-800">
                      E-mail Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-blue-800">
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
                      Create Your Account
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Side - Image with Text Overlay */}
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
                    Manage all <span className="text-yellow-400">Operations</span> with ease through <span className="text-white">Infosphere</span>.
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