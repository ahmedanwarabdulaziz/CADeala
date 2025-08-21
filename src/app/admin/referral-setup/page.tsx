'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { createReferralRanksForAllBusinesses } from '@/lib/referralUtils';
import { CheckCircle, AlertCircle, Users, Settings } from 'lucide-react';

export default function ReferralSetupPage() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Redirect if not admin
  if (!loading && (!userRole || userRole.role !== 'Admin')) {
    router.push('/dashboard');
    return null;
  }

  const handleCreateReferralRanks = async () => {
    try {
      setProcessing(true);
      setResult(null);
      
      await createReferralRanksForAllBusinesses();
      
      setResult({
        success: true,
        message: 'Referral ranks created successfully!',
        details: 'All existing businesses now have a "Referral" customer rank.'
      });
    } catch (error) {
      console.error('Error creating referral ranks:', error);
      setResult({
        success: false,
        message: 'Failed to create referral ranks',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="relative lg:ml-64">
          <div className="pt-20 lg:pt-6 lg:pl-64">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="relative lg:ml-64">
        <div className="pt-20 lg:pt-6 lg:pl-64">
          <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-orange/10 rounded-full p-2">
                  <Settings className="h-6 w-6 text-orange" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Referral System Setup</h1>
                  <p className="text-gray-600 mt-1">Configure referral ranks for all businesses</p>
                </div>
              </div>
            </div>

            {/* Setup Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 rounded-full p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Create Referral Ranks
                  </h2>
                  <p className="text-gray-600 mb-4">
                    This will create a permanent &quot;Referral&quot; customer rank for all existing businesses. 
                    This rank is required for the referral system to work properly.
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          This action will create referral ranks for all businesses. 
                          New businesses will automatically get referral ranks when they are created.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateReferralRanks}
                    disabled={processing}
                    className="px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        <span>Create Referral Ranks for All Businesses</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className="mt-6">
                <div className={`rounded-lg p-4 ${
                  result.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                    )}
                    <div>
                      <h3 className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? 'Success' : 'Error'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                      {result.details && (
                        <p className={`text-xs mt-2 ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Information */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-orange/10 rounded-full p-2 mt-1">
                    <span className="text-orange font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Automatic Creation</p>
                    <p className="text-sm text-gray-600">
                      Each business gets a permanent &quot;Referral&quot; customer rank that cannot be deleted.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-orange/10 rounded-full p-2 mt-1">
                    <span className="text-orange font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Customer Assignment</p>
                    <p className="text-sm text-gray-600">
                      When customers sign up via referral links, they are automatically assigned to this rank.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-orange/10 rounded-full p-2 mt-1">
                    <span className="text-orange font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Business Management</p>
                    <p className="text-sm text-gray-600">
                      Business owners can view and manage customers in the &quot;Referral&quot; rank through their dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
