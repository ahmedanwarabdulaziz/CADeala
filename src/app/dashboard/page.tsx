'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ResponsiveWrapper from '@/components/ResponsiveWrapper';
import CustomerDashboardMobile from './mobile/page';
import LoadingDots from '@/components/LoadingDots';

interface BusinessApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_required';
  businessName: string;
  adminNotes?: string;
  requiredInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DashboardPage() {
  const { user, userRole, loading, logout, refreshUserRole } = useAuth();
  const router = useRouter();
  const [businessApplication, setBusinessApplication] = useState<BusinessApplication | null>(null);
  const [loadingApplication, setLoadingApplication] = useState(true);

  const fetchBusinessApplication = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingApplication(true);
      const q = query(
        collection(db, 'businessRegistrations'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        // Sort by creation date and get the most recent application
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const aDate = a.data().createdAt?.toDate();
          const bDate = b.data().createdAt?.toDate();
          if (!aDate || !bDate) return 0;
          return bDate.getTime() - aDate.getTime();
        });
        
        const doc = sortedDocs[0];
        const data = doc.data();
        setBusinessApplication({
          id: doc.id,
          status: data.status,
          businessName: data.businessName,
          adminNotes: data.adminNotes,
          requiredInfo: data.requiredInfo,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      }
    } catch (error) {
      console.error('Error fetching business application:', error);
    } finally {
      setLoadingApplication(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to signin
        router.push('/signin');
      } else if (user && userRole && userRole.role === 'Admin') {
        // Admin user, redirect to admin dashboard
        router.push('/admin/dashboard');
      } else if (user && userRole && userRole.role === 'Business') {
        // Business user, redirect to business dashboard
        router.push('/business/dashboard');
      } else if (user && userRole && userRole.role === 'Customer') {
        // Customer user, fetch business application status
        fetchBusinessApplication();
      }
      // If user exists but userRole is still loading, wait for it
    }
  }, [user, userRole, loading, router, fetchBusinessApplication]);

  // Refresh user role periodically to check for role updates (e.g., when admin approves business application)
  useEffect(() => {
    if (user && userRole && userRole.role === 'Customer' && businessApplication) {
      const interval = setInterval(async () => {
        await refreshUserRole();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user, userRole, businessApplication, refreshUserRole]);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || loadingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingDots size="lg" color="text-orange" className="mb-4" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't exist or is admin (will be redirected)
  if (!user || !userRole || userRole.role === 'Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingDots size="lg" color="text-orange" className="mb-4" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveWrapper mobileComponent={<CustomerDashboardMobile />}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-navy-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <img 
                    src="/CADEALA LOGO.png" 
                    alt="CADeala Logo" 
                    className="h-8 w-auto mr-3"
                  />
                  <h1 className="text-white text-xl font-bold">CADeala</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-sm">Welcome, </span>
                <span className="font-semibold">
                  {userRole.name}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Customer Dashboard</h2>
          <p className="text-gray-600 mt-2">Manage your account and business applications</p>
        </div>

        {/* Business Application Status */}
        {businessApplication && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Application Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Application Details</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Business Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{businessApplication.businessName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      businessApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                      businessApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      businessApplication.status === 'more_info_required' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {businessApplication.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Submitted:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {businessApplication.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {businessApplication.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Admin Feedback</h4>
                {businessApplication.adminNotes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{businessApplication.adminNotes}</p>
                  </div>
                )}
                {businessApplication.requiredInfo && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Required Information:</h5>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">{businessApplication.requiredInfo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {businessApplication.status === 'rejected' && (
                <button
                  onClick={() => router.push('/business/register')}
                  className="bg-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Submit New Application
                </button>
              )}
              {businessApplication.status === 'more_info_required' && (
                <button
                  onClick={() => router.push('/business/register')}
                  className="bg-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Update Application
                </button>
              )}
              <button
                onClick={() => router.push('/business/register')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                View Application Details
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/business/register')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="font-medium text-gray-900">Update Profile</div>
                <div className="text-sm text-gray-500">Change your personal information</div>
              </button>
              <button
                onClick={() => router.push('/business/register')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="font-medium text-gray-900">Account Settings</div>
                <div className="text-sm text-gray-500">Manage your account preferences</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Services</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/business/register')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="font-medium text-gray-900">Register Business</div>
                <div className="text-sm text-gray-500">Apply to become a business partner</div>
              </button>
              <button
                onClick={() => router.push('/business/register')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="font-medium text-gray-900">Help & Support</div>
                <div className="text-sm text-gray-500">Get help with your account</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-900">Account Created</div>
                <div className="text-xs text-gray-500">Welcome to CADeala!</div>
              </div>
              {businessApplication && (
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">Business Application</div>
                  <div className="text-xs text-gray-500">
                    Status: {businessApplication.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </ResponsiveWrapper>
  );
}
