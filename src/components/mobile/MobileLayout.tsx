'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  Crown, 
  Users, 
  Package, 
  MoreHorizontal,
  LogOut,
  Settings,
  HelpCircle,
  User
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  userType: 'business' | 'admin';
}

export default function MobileLayout({ children, userType }: MobileLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const businessNavigation = [
    { 
      name: 'Dashboard', 
      icon: BarChart3, 
      href: '/business/dashboard' as const,
      active: pathname === '/business/dashboard'
    },
    { 
      name: 'Ranks', 
      icon: Crown, 
      href: '/business/customer-ranks' as const,
      active: pathname === '/business/customer-ranks'
    },
    { 
      name: 'Customers', 
      icon: Users, 
      href: '/business/customers' as const,
      active: pathname === '/business/customers'
    },
    { 
      name: 'Profile', 
      icon: Package, 
      href: '/business/register' as const,
      active: pathname === '/business/register'
    }
  ];

  const adminNavigation = [
    { 
      name: 'Dashboard', 
      icon: BarChart3, 
      href: '/admin/dashboard' as const,
      active: pathname === '/admin/dashboard'
    },
    { 
      name: 'Customers', 
      icon: Users, 
      href: '/admin/customer-management' as const,
      active: pathname === '/admin/customer-management'
    },
    { 
      name: 'Applications', 
      icon: Package, 
      href: '/admin/business-applications' as const,
      active: pathname === '/admin/business-applications'
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      href: '/admin/categories' as const,
      active: pathname.startsWith('/admin/categories') || pathname.startsWith('/admin/tags')
    }
  ];

  const navigation = userType === 'business' ? businessNavigation : adminNavigation;

  const menuItems = userType === 'business' 
    ? [
        { name: 'Analytics', icon: BarChart3, href: '/business/dashboard' as const },
        { name: 'Settings', icon: Settings, href: '/business/register' as const },
        { name: 'Profile', icon: User, href: '/business/register' as const },
        { name: 'Help', icon: HelpCircle, href: '/business/register' as const },
      ]
    : [
        { name: 'Analytics', icon: BarChart3, href: '/admin/dashboard' as const },
        { name: 'Settings', icon: Settings, href: '/admin/categories' as const },
        { name: 'Profile', icon: User, href: '/admin/dashboard' as const },
        { name: 'Help', icon: HelpCircle, href: '/business/register' as const },
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/CADEALA LOGO.png" 
              alt="CADeala Logo" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">CADeala</h1>
              <p className="text-xs text-gray-500 capitalize">{userType}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-navy-blue flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {userRole?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                  item.active
                    ? 'text-orange bg-orange/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
          
          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
              showMenu
                ? 'text-orange bg-orange/10'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MoreHorizontal className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4">
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href);
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <Icon className="h-5 w-5 mr-3 text-gray-500" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Close overlay */}
          <div 
            className="absolute inset-0" 
            onClick={() => setShowMenu(false)}
          />
        </div>
      )}
    </div>
  );
}
