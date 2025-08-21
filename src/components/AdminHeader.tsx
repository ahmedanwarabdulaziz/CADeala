'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Users, Building2, Tags, FileText, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  currentPage?: string;
}

export default function AdminHeader({ currentPage = 'dashboard' }: AdminHeaderProps) {
  const { userRole, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Shield, current: currentPage === 'dashboard' },
    { name: 'Categories', href: '/admin/categories', icon: Building2, current: currentPage === 'categories' },
    { name: 'Tag Categories', href: '/admin/tag-categories', icon: Tags, current: currentPage === 'tag-categories' },
    { name: 'Tags', href: '/admin/tags', icon: Tags, current: currentPage === 'tags' },
    { name: 'Business Applications', href: '/admin/business-applications', icon: FileText, current: currentPage === 'business-applications' },
    { name: 'Customer Management', href: '/admin/customer-management', icon: Users, current: currentPage === 'customer-management' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="bg-navy-blue">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm font-medium">CADeala Admin Portal</span>
                <span className="text-white text-xs bg-orange px-2 py-1 rounded-full">
                  Admin Access
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">Welcome, {userRole?.name}</span>
                <button
                  onClick={handleSignOut}
                  className="text-white hover:text-orange text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <img 
                    src="/CADEALA LOGO.png" 
                    alt="CADeala Logo" 
                    className="h-8 w-auto mr-3"
                  />
                  <h1 className="text-xl font-bold text-gray-900">CADeala</h1>
                  <span className="ml-2 text-sm text-gray-500 font-medium">Admin</span>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden lg:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                      item.current
                        ? 'bg-orange text-white'
                        : 'text-gray-700 hover:text-orange hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button className="text-gray-700 hover:text-orange p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
