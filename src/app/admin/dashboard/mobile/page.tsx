'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building, 
  FileText, 
  Settings, 
  BarChart3, 
  RefreshCw 
} from 'lucide-react';

export default function AdminDashboardMobile() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    pendingApplications: 0,
    totalCategories: 0
  });

  // Redirect if not admin user
  useEffect(() => {
    if (!loading && (!userRole || userRole.role !== 'Admin')) {
      router.push('/dashboard');
    }
  }, [userRole, loading, router]);

  // Simulate loading stats
  useEffect(() => {
    if (userRole?.role === 'Admin') {
      const timer = setTimeout(() => {
        setStats({
          totalUsers: 1250,
          totalBusinesses: 45,
          pendingApplications: 8,
          totalCategories: 156
        });
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const quickActions = [
    { 
      title: 'Manage Users', 
      description: 'View and manage all users', 
      icon: <Users className="h-5 w-5" />, 
      onClick: () => router.push('/admin/customer-management'), 
      variant: 'primary' as const 
    },
    { 
      title: 'Business Applications', 
      description: 'Review pending applications', 
      icon: <Building className="h-5 w-5" />, 
      onClick: () => router.push('/admin/business-applications'), 
      variant: 'primary' as const 
    },
    { 
      title: 'Categories', 
      description: 'Manage categories and tags', 
      icon: <FileText className="h-5 w-5" />, 
      onClick: () => router.push('/admin/categories'), 
      variant: 'secondary' as const 
    },
    { 
      title: 'System Settings', 
      description: 'Configure system settings', 
      icon: <Settings className="h-5 w-5" />, 
      onClick: () => router.push('/admin/categories'), 
      variant: 'secondary' as const 
    }
  ];

  if (loading || !userRole || userRole.role !== 'Admin') {
    return (
      <MobileLayout userType="admin">
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-orange animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="admin">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your platform and users
          </p>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-navy-blue/10 rounded-full p-2">
                  <Users className="h-5 w-5 text-navy-blue" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Total Users</p>
                  <p className="text-sm text-gray-600">{stats.totalUsers} users</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-navy-blue">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-orange/10 rounded-full p-2">
                  <Building className="h-5 w-5 text-orange" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Businesses</p>
                  <p className="text-sm text-gray-600">{stats.totalBusinesses} businesses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange">{stats.totalBusinesses}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500/10 rounded-full p-2">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pending Applications</p>
                  <p className="text-sm text-gray-600">{stats.pendingApplications} pending</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/10 rounded-full p-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Categories</p>
                  <p className="text-sm text-gray-600">{stats.totalCategories} categories</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{stats.totalCategories}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center ${
                  action.variant === 'primary'
                    ? 'bg-navy-blue text-white hover:bg-navy-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="mr-3">{action.icon}</div>
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className={`text-sm ${action.variant === 'primary' ? 'text-white/80' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
