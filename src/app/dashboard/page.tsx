'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  }, [user, userRole, loading, router]);

  // Refresh user role periodically to check for role updates (e.g., when admin approves business application)
  useEffect(() => {
    if (user && userRole && userRole.role === 'Customer' && businessApplication) {
      const interval = setInterval(async () => {
        await refreshUserRole();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user, userRole, businessApplication, refreshUserRole]);

  const fetchBusinessApplication = async () => {
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
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto"></div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
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
                <span className="text-xs ml-2 bg-orange px-2 py-1 rounded-full">
                  {userRole.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="border-2 border-white text-white hover:bg-white hover:text-navy-blue font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Business Application Status */}
          {businessApplication && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Business Application Status
              </h2>
              
                             <div className="flex items-center mb-4">
                 <div className={`h-4 w-4 rounded-full mr-3 ${
                   businessApplication.status === 'approved' ? 'bg-green-500' :
                   businessApplication.status === 'rejected' ? 'bg-red-500' :
                   'bg-blue-500'
                 }`}></div>
                                 <span className={`text-lg font-semibold ${
                   businessApplication.status === 'approved' ? 'text-green-700' :
                   businessApplication.status === 'rejected' ? 'text-red-700' :
                   'text-blue-700'
                 }`}>
                   {businessApplication.status === 'pending' && 'Pending Review'}
                   {businessApplication.status === 'approved' && 'Approved'}
                   {businessApplication.status === 'rejected' && 'Rejected'}
                 </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Business: {businessApplication.businessName}</h3>
                <p className="text-sm text-gray-600">
                  Submitted on {businessApplication.createdAt?.toLocaleDateString()}
                </p>
              </div>

              {businessApplication.adminNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Admin Notes:</h4>
                  <p className="text-blue-700">{businessApplication.adminNotes}</p>
                </div>
              )}

              {businessApplication.requiredInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Additional Information Required:</h4>
                  <p className="text-yellow-700">{businessApplication.requiredInfo}</p>
                </div>
              )}

              {businessApplication.status === 'rejected' && (
                <button
                  onClick={() => router.push('/business/register')}
                  className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Apply Again
                </button>
              )}

              
            </div>
          )}

          {/* Customer Dashboard */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Customer Dashboard
            </h2>
            <p className="text-gray-600">
              Welcome to your CADeala gift card dashboard. This area will be expanded with gift card features soon.
            </p>
            
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Coming Soon Features:
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>View your gift card balance</li>
                <li>Purchase new gift cards</li>
                <li>Send gift cards to friends and family</li>
                <li>Transaction history</li>
                <li>QR code scanning for redemption</li>
              </ul>
            </div>
          </div>

                     {/* Business Upgrade Section */}
           <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
             <div className="flex items-center justify-between">
               <div className="flex-1">
                 <h3 className="text-xl font-bold text-gray-900 mb-2">
                   Ready to Grow Your Business?
                 </h3>
                 <p className="text-gray-600 mb-4">
                   Upgrade to a business account and start selling your products and services on CADeala. 
                   Reach more customers and grow your business with our platform.
                 </p>
                 <div className="flex flex-wrap gap-2 mb-4">
                   <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                     Sell Products
                   </span>
                   <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                     Reach Customers
                   </span>
                   <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                     Analytics
                   </span>
                   <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                     Business Tools
                   </span>
                 </div>
                 
                 {/* Application Status Display */}
                 {businessApplication && (
                   <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                                           <div className="flex items-center mb-2">
                        <div className={`h-3 w-3 rounded-full mr-2 ${
                          businessApplication.status === 'approved' ? 'bg-green-500' :
                          businessApplication.status === 'rejected' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                        <span className={`text-sm font-semibold ${
                          businessApplication.status === 'approved' ? 'text-green-700' :
                          businessApplication.status === 'rejected' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          {businessApplication.status === 'pending' && 'Application Pending Review'}
                          {businessApplication.status === 'approved' && 'Application Approved!'}
                          {businessApplication.status === 'rejected' && 'Application Rejected'}
                        </span>
                     </div>
                     <p className="text-sm text-gray-600">
                       Business: {businessApplication.businessName} • Submitted on {businessApplication.createdAt?.toLocaleDateString()}
                     </p>
                     {businessApplication.status === 'rejected' && (
                       <button
                         onClick={() => router.push('/business/register')}
                         className="mt-2 bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                       >
                         Apply Again
                       </button>
                     )}
                     
                   </div>
                 )}
               </div>
               <div className="ml-6">
                 <button
                   onClick={() => router.push('/business/register')}
                   disabled={!!businessApplication && businessApplication.status !== 'rejected'}
                   className={`font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg ${
                     businessApplication && businessApplication.status !== 'rejected'
                       ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                       : 'bg-orange hover:bg-orange-600 text-white'
                   }`}
                 >
                                       {businessApplication && businessApplication.status === 'pending' && 'Application Pending'}
                    {businessApplication && businessApplication.status === 'approved' && 'Approved!'}
                    {(!businessApplication || businessApplication.status === 'rejected') && 'Upgrade to Business'}
                 </button>
               </div>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}
