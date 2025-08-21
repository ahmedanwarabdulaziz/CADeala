'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { StatsCard, ActionCard } from '@/components/mobile/MobileCard';
import { 
  Users, 
  Crown, 
  TrendingUp, 
  ShoppingCart,
  Plus,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';

export default function BusinessDashboardMobile() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeRanks: 0,
    totalRevenue: 0,
    totalOrders: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        totalCustomers: 1234,
        activeRanks: 5,
        totalRevenue: 12345,
        totalOrders: 89
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const quickActions = [
    {
      title: 'Add Customer',
      description: 'Register a new customer',
      icon: <Plus className="h-5 w-5" />,
      onClick: () => router.push('/business/customers/add'),
      variant: 'primary' as const
    },
    {
      title: 'Create Rank',
      description: 'Set up a new customer rank',
      icon: <Crown className="h-5 w-5" />,
      onClick: () => router.push('/business/customer-ranks/create'),
      variant: 'primary' as const
    },
    {
      title: 'View Reports',
      description: 'Check business analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => router.push('/business/analytics'),
      variant: 'secondary' as const
    },
    {
      title: 'Settings',
      description: 'Manage business settings',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => router.push('/business/settings'),
      variant: 'secondary' as const
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'customer_joined',
             message: 'New customer joined &quot;Gold&quot; rank',
      time: '2 hours ago',
      icon: <Users className="h-4 w-4 text-green-600" />
    },
    {
      id: 2,
      type: 'customer_upgraded',
             message: 'Customer &quot;John Smith&quot; upgraded to &quot;Platinum&quot;',
      time: '4 hours ago',
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />
    },
    {
      id: 3,
      type: 'revenue_increase',
      message: 'Revenue increased by 15% this week',
      time: '1 day ago',
      icon: <ShoppingCart className="h-4 w-4 text-orange" />
    }
  ];

  if (isLoading) {
    return (
      <MobileLayout userType="business">
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-orange animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout userType="business">
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange to-orange-600 rounded-lg p-4 text-white">
          <h2 className="text-xl font-bold mb-1">
            Welcome back, {userRole?.name}!
          </h2>
          <p className="text-orange-100 text-sm">
            Here's what's happening with your business today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            icon={<Users className="h-6 w-6 text-orange" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Active Ranks"
            value={stats.activeRanks}
            icon={<Crown className="h-6 w-6 text-orange" />}
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp className="h-6 w-6 text-orange" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart className="h-6 w-6 text-orange" />}
            trend={{ value: 3, isPositive: false }}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Quick Actions
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <ActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                onClick={action.onClick}
                variant={action.variant}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <button
              onClick={handleRefresh}
              className="text-sm text-orange hover:text-orange-600 font-medium"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pull to Refresh Indicator */}
        <div className="text-center text-xs text-gray-500 pb-4">
          Pull down to refresh
        </div>
      </div>
    </MobileLayout>
  );
}
