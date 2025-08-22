'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface ReferralCode {
  id: string;
  userId: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  referralCode: string;
  createdAt: Date;
  isActive: boolean;
}

interface Referral {
  id: string;
  referrerId: string;
  referrerEmail: string;
  referredUserId: string;
  referredUserEmail: string;
  businessId: string;
  businessName: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  businessAssociation?: {
    businessId: string;
    businessReferenceCode: string;
    rankId: string;
    rankName: string;
  };
  isPublicCustomer?: boolean;
}

export default function ReferralDebugPage() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      
      // Load referral codes
      const codesSnapshot = await getDocs(collection(db, 'referralCodes'));
      const codes = codesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReferralCode[];
      setReferralCodes(codes);

      // Load referrals
      const referralsSnapshot = await getDocs(collection(db, 'referrals'));
      const refs = referralsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Referral[];
      setReferrals(refs);

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usrs = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usrs);

    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!userRole || userRole.role !== 'Admin')) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [loadData, loading, userRole, router]);

  // Redirect if not admin
  if (!loading && (!userRole || userRole.role !== 'Admin')) {
    return null;
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar type="admin" currentPage="referral-debug" />
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

  const customersWithBusinessAssociation = users.filter(u => 
    u.role === 'Customer' && u.businessAssociation
  );

  const customersWithoutBusinessAssociation = users.filter(u => 
    u.role === 'Customer' && !u.businessAssociation
  );

  const completedReferrals = referrals.filter(r => r.status === 'completed');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="admin" currentPage="referral-debug" />
      <main className="relative lg:ml-64">
        <div className="pt-20 lg:pt-6 lg:pl-64">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Referral System Debug</h1>
                  <p className="text-gray-600 mt-1">Check the status of the referral system</p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Referral Codes</p>
                    <p className="text-2xl font-bold text-gray-900">{referralCodes.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{completedReferrals.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingReferrals.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Business Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{customersWithBusinessAssociation.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Codes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Codes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referralCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{code.referralCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{code.userEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{code.businessName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            code.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {code.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Referrals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Referrals</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{referral.referrerEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.referredUserEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.businessName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'completed' ? 'bg-green-100 text-green-800' :
                            referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Associations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Business Associations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">With Business Association ({customersWithBusinessAssociation.length})</h3>
                  <div className="space-y-2">
                    {customersWithBusinessAssociation.map((user) => (
                      <div key={user.uid} className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-green-600">
                          Rank: {user.businessAssociation?.rankName} • Business: {user.businessAssociation?.businessReferenceCode}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Public Customers ({customersWithoutBusinessAssociation.length})</h3>
                  <div className="space-y-2">
                    {customersWithoutBusinessAssociation.map((user) => (
                      <div key={user.uid} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">No business association</p>
                      </div>
                    ))}
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
