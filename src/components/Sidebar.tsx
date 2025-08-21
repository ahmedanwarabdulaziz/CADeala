'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building2, 
  Tags, 
  FileText, 
  LogOut,
  Menu,
  X,
  Home,
  Crown,
  BarChart3,
  Package,
  ShoppingCart,
  CreditCard,
  Settings
} from 'lucide-react';
import InstallButton from './InstallButton';

interface SidebarProps {
  type: 'admin' | 'business';
  currentPage?: string;
}

export default function Sidebar({ type, currentPage = 'dashboard' }: SidebarProps) {
  const { userRole, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const adminNavigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home, current: currentPage === 'dashboard' },
    { name: 'Customer Management', href: '/admin/customer-management', icon: Users, current: currentPage === 'customer-management' },
    { name: 'Business Applications', href: '/admin/business-applications', icon: FileText, current: currentPage === 'business-applications' },
    { name: 'Categories', href: '/admin/categories', icon: Building2, current: currentPage === 'categories' },
    { name: 'Tag Categories', href: '/admin/tag-categories', icon: Tags, current: currentPage === 'tag-categories' },
    { name: 'Tags', href: '/admin/tags', icon: Tags, current: currentPage === 'tags' },
    { name: 'Referral Setup', href: '/admin/referral-setup', icon: Settings, current: currentPage === 'referral-setup' },
    { name: 'Referral Debug', href: '/admin/referral-debug', icon: Settings, current: currentPage === 'referral-debug' },
  ];

  const businessNavigationItems = [
    { name: 'Dashboard', href: '/business/dashboard', icon: Home, current: currentPage === 'dashboard' },
    { name: 'Customer Ranks', href: '/business/customer-ranks', icon: Crown, current: currentPage === 'customer-ranks' },
    { name: 'Customers', href: '/business/customers', icon: Users, current: currentPage === 'customers' },
    { name: 'Products', href: '/business/products', icon: Package, current: currentPage === 'products' },
    { name: 'Orders', href: '/business/orders', icon: ShoppingCart, current: currentPage === 'orders' },
    { name: 'Gift Cards', href: '/business/gift-cards', icon: CreditCard, current: currentPage === 'gift-cards' },
    { name: 'Analytics', href: '/business/analytics', icon: BarChart3, current: currentPage === 'analytics' },
  ];

  const navigationItems = type === 'admin' ? adminNavigationItems : businessNavigationItems;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-lg border border-gray-200"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isCollapsed ? '-translate-x-56' : 'translate-x-0'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img 
                src="/CADEALA LOGO.png" 
                alt="CADeala Logo" 
                className="h-8 w-auto"
              />
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">CADeala</h1>
                  <div className="mt-2">
                    <InstallButton variant="icon" showInstructions={false} />
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{type}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-md hover:bg-gray-100 lg:block hidden"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-navy-blue flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userRole?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userRole?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userRole?.role === 'Business' ? 'Business Owner' : userRole?.role}
                  </p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center">
                <div className="h-10 w-10 rounded-full bg-navy-blue flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userRole?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${item.current
                      ? 'bg-orange text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {!isCollapsed && <span>{item.name}</span>}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {!isCollapsed && (
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Sign Out
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={handleSignOut}
                className="flex justify-center w-full p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expand button for collapsed sidebar */}
      {isCollapsed && (
        <div className="fixed left-2 top-1/2 transform -translate-y-1/2 z-40 lg:block hidden">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-md bg-white shadow-lg border border-gray-200 hover:bg-gray-50"
          >
            <Menu className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
    </>
  );
}
