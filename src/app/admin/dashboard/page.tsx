'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  Building2, 
  FileText, 
  Tags, 
  Shield, 
  TrendingUp,
  UserCheck,
  UserX,
  Building,
  Clock
} from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DashboardStats {
  totalCustomers: number;
  totalBusinesses: number;
  pendingApplications: number;
  totalCategories: number;
  totalTags: number;
  publicCustomers: number;
  businessCustomers: number;
}

export default function AdminDashboardPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalBusinesses: 0,
    pendingApplications: 0,
    totalCategories: 0,
    totalTags: 0,
    publicCustomers: 0,
    businessCustomers: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Admin') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Admin') {
        fetchDashboardStats();
      }
    }
  }, [user, userRole, loading, router]);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch all users to get customer stats
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      // Fetch business applications
      const applicationsQuery = query(collection(db, 'businessRegistrations'));
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => doc.data());
      
      // Fetch categories
      const industriesQuery = query(collection(db, 'industries'));
      const industriesSnapshot = await getDocs(industriesQuery);
      const businessTypesQuery = query(collection(db, 'businessTypes'));
      const businessTypesSnapshot = await getDocs(businessTypesQuery);
      const serviceCategoriesQuery = query(collection(db, 'serviceCategories'));
      const serviceCategoriesSnapshot = await getDocs(serviceCategoriesQuery);
      const productCategoriesQuery = query(collection(db, 'productCategories'));
      const productCategoriesSnapshot = await getDocs(productCategoriesQuery);
      
      // Fetch tags
      const tagsQuery = query(collection(db, 'tags'));
      const tagsSnapshot = await getDocs(tagsQuery);
      
      // Calculate stats
      const totalCustomers = users.filter(user => user.role === 'Customer').length;
      const totalBusinesses = users.filter(user => user.role === 'Business').length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const totalCategories = industriesSnapshot.size + businessTypesSnapshot.size + 
                            serviceCategoriesSnapshot.size + productCategoriesSnapshot.size;
      const totalTags = tagsSnapshot.size;
      const publicCustomers = users.filter(user => 
        user.role === 'Customer' && user.isPublicCustomer
      ).length;
      const businessCustomers = users.filter(user => 
        user.role === 'Customer' && user.businessAssociation
      ).length;

      setStats({
        totalCustomers,
        totalBusinesses,
        pendingApplications,
        totalCategories,
        totalTags,
        publicCustomers,
        businessCustomers
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !userRole || userRole.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue"></div>
      </div>
    );
  }

  const quickActions = [
    {
      name: 'Customer Management',
      description: 'Manage all customers and their business associations',
      href: '/admin/customer-management',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Business Applications',
      description: 'Review and manage business registration applications',
      href: '/admin/business-applications',
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      name: 'Categories Management',
      description: 'Manage hierarchical categories system',
      href: '/admin/categories',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      name: 'Tags Management',
      description: 'Manage tags and tag categories',
      href: '/admin/tags',
      icon: Tags,
      color: 'bg-orange-500'
    }
  ];

    return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="admin" currentPage="dashboard" />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen relative">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {userRole.name}. Here&apos;s an overview of your platform.
            </p>
          </div>

          {/* Stats Grid */}
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Businesses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Tags className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Business Customers</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{stats.businessCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserX className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Public Customers</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{stats.publicCustomers}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={action.name}
                      href={action.href}
                      className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className={`h-8 w-8 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{action.name}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Admin Access</h4>
                <p className="text-xs text-gray-500 mt-1">Full platform control</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Platform Growth</h4>
                <p className="text-xs text-gray-500 mt-1">{stats.totalCustomers + stats.totalBusinesses} total users</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Building className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Business Network</h4>
                <p className="text-xs text-gray-500 mt-1">{stats.totalBusinesses} registered businesses</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
