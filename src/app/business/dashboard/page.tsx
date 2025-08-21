'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { regenerateAllBusinessSignupLinks } from '@/lib/customerRankUtils';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function BusinessDashboardPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [regeneratingLinks, setRegeneratingLinks] = useState(false);
  const [regenerateStatus, setRegenerateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Business') {
        router.push('/dashboard');
      }
    }
  }, [user, userRole, loading, router]);

  const handleRegenerateSignupLinks = async () => {
    if (!userRole?.businessId) return;
    
    try {
      setRegeneratingLinks(true);
      setRegenerateStatus('idle');
      await regenerateAllBusinessSignupLinks(userRole.businessId);
      setRegenerateStatus('success');
      setTimeout(() => setRegenerateStatus('idle'), 3000);
    } catch (error) {
      console.error('Error regenerating signup links:', error);
      setRegenerateStatus('error');
      setTimeout(() => setRegenerateStatus('idle'), 3000);
    } finally {
      setRegeneratingLinks(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue"></div>
      </div>
    );
  }

  if (!user || !userRole || userRole.role !== 'Business') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="business" currentPage="dashboard" />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen relative">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {userRole.name}. Manage your business operations and track your performance.
            </p>
          </div>

          {/* Business Reference Code Banner */}
          {userRole.businessReferenceCode && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Business Account Active
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Reference Code: <span className="font-mono font-semibold text-green-700">{userRole.businessReferenceCode}</span>
                  </p>
                  <p className="text-gray-600">
                    Your business account is fully activated and ready for operations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Utility Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Utility Tools</h3>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Regenerate Signup Links</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Update all your customer rank signup links to use the current domain. Use this when your app domain changes.
                </p>
              </div>
              <button
                onClick={handleRegenerateSignupLinks}
                disabled={regeneratingLinks}
                className="bg-navy-blue hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
              >
                {regeneratingLinks ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{regeneratingLinks ? 'Regenerating...' : 'Regenerate Links'}</span>
              </button>
            </div>
            
            {/* Status Messages */}
            {regenerateStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 text-sm">All signup links have been successfully updated!</span>
              </div>
            )}
            
            {regenerateStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 text-sm">Error updating signup links. Please try again.</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📦</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">$0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Customers</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Getting Started
                </h2>
                <p className="text-gray-600 mt-2">
                  Set up your business and start growing
                </p>
              </div>
              <div className="hidden md:block">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Active
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🚀 Next Steps
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-orange rounded-full mr-3"></span>
                    Create customer ranks to organize your customers
                  </li>
                  <li className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-orange rounded-full mr-3"></span>
                    Add your first product to start selling
                  </li>
                  <li className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-orange rounded-full mr-3"></span>
                    Configure your business profile and settings
                  </li>
                  <li className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-orange rounded-full mr-3"></span>
                    Set up payment and shipping options
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ⚡ Quick Actions
                </h3>
                <div className="space-y-3">
                  <a 
                    href="/business/customer-ranks"
                    className="w-full bg-orange hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="mr-2">👑</span>
                    Manage Customer Ranks
                  </a>
                  <a 
                    href="/business/customers"
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="mr-2">👥</span>
                    View Customers
                  </a>
                  <a 
                    href="/business/products"
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="mr-2">📦</span>
                    Add Products
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
