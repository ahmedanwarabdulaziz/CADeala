'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  Settings,
  Crown,
  Calendar,
  Mail,
  Share2
} from 'lucide-react';
import LoadingDots from '@/components/LoadingDots';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BusinessApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_required';
  businessName: string;
  industry: string;
  businessType: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function CustomerDashboardMobile() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [businessApplication, setBusinessApplication] = useState<BusinessApplication | null>(null);


  const fetchBusinessApplication = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'businessApplications'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setBusinessApplication({
          id: doc.id,
          ...doc.data()
        } as BusinessApplication);
      }
    } catch (error) {
      console.error('Error fetching business application:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role === 'Admin') {
        router.push('/admin/dashboard');
      } else if (user && userRole && userRole.role === 'Business') {
        router.push('/business/dashboard');
      } else if (user && userRole && userRole.role === 'Customer') {
        fetchBusinessApplication();
      }
    }
  }, [user, userRole, loading, router, fetchBusinessApplication]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'more_info_required':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'more_info_required':
        return 'More Info Required';
      default:
        return 'Pending';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const quickActions = [
    { 
      title: 'Upgrade to Business', 
      description: 'Apply to become a business owner', 
      icon: <Building className="h-5 w-5" />, 
      onClick: () => router.push('/business/register'), 
      variant: 'primary' as const 
    },
    { 
      title: 'My Referrals', 
      description: 'View your successful referrals', 
      icon: <Share2 className="h-5 w-5" />, 
      onClick: () => router.push('/referrals'), 
      variant: 'primary' as const 
    },
    { 
      title: 'My Profile', 
      description: 'View and edit your profile', 
      icon: <User className="h-5 w-5" />, 
      onClick: () => router.push('/business/register'), 
      variant: 'secondary' as const 
    },
    { 
      title: 'Settings', 
      description: 'Manage your account settings', 
      icon: <Settings className="h-5 w-5" />, 
      onClick: () => router.push('/business/register'), 
      variant: 'secondary' as const 
    }
  ];

  if (loading || !user || !userRole || userRole.role !== 'Customer') {
    return (
      <MobileLayout userType="customer">
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingDots size="lg" color="text-orange" className="mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="customer">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your account and explore opportunities
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Profile</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-navy-blue rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user.displayName || 'User'}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Application Status */}
        {businessApplication && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Application</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange/10 rounded-full p-2">
                    <Building className="h-5 w-5 text-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{businessApplication.businessName}</p>
                    <p className="text-sm text-gray-600">{businessApplication.industry} • {businessApplication.businessType}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(businessApplication.status)}`}>
                  {getStatusText(businessApplication.status)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Applied on {formatDate(businessApplication.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Last updated {formatDate(businessApplication.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    ? 'bg-orange text-white hover:bg-orange-600'
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

        {/* Features Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Discover Features</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-navy-blue/10 rounded-full p-2">
                <Crown className="h-5 w-5 text-navy-blue" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Customer Ranks</p>
                <p className="text-sm text-gray-600">Join businesses and earn benefits</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-green-500/10 rounded-full p-2">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Become a Business</p>
                <p className="text-sm text-gray-600">Apply to upgrade your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
