'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { 
  Customer,
  CustomerRankStats,
  getBusinessCustomers,
  getCustomerRankStats
} from '@/lib/customerRankUtils';
import { 
  Users, 
  Search, 
  Crown, 
  Calendar,
  Mail,
  Phone,
  User,
  ArrowUpDown
} from 'lucide-react';

export default function CustomersPage() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerRankStats, setCustomerRankStats] = useState<CustomerRankStats[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'rank'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Redirect if not business user
  useEffect(() => {
    if (!loading && (!userRole || userRole.role !== 'Business')) {
      router.push('/dashboard');
    }
  }, [userRole, loading, router]);

  const loadData = useCallback(async () => {
    if (!userRole?.businessId) {
      return;
    }
    
    try {
      setLoadingData(true);
      const [customersData, statsData] = await Promise.all([
        getBusinessCustomers(userRole.businessId),
        getCustomerRankStats(userRole.businessId)
      ]);
      setCustomers(customersData);
      setCustomerRankStats(statsData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingData(false);
    }
  }, [userRole?.businessId]);

  // Load customers and stats
  useEffect(() => {
    if (userRole?.businessId) {
      loadData();
    }
  }, [loadData, userRole?.businessId]);

  // Filter and sort customers
  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm));
      
      const matchesRank = filterRank === 'all' || 
        customer.businessAssociation?.rankId === filterRank;
      
      return matchesSearch && matchesRank;
    })
    .sort((a, b) => {
      let aValue: string | Date, bValue: string | Date;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'rank':
          aValue = a.businessAssociation?.rankName || '';
          bValue = b.businessAssociation?.rankName || '';
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          bValue = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: 'name' | 'email' | 'createdAt' | 'rank') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || !userRole || userRole.role !== 'Business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="business" currentPage="customers" />
      <main className="lg:ml-64 min-h-screen relative">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
              <p className="mt-1 text-sm text-gray-600">
                View and manage your customers and their ranks
              </p>
            </div>
          </div>
        </div>

        {/* Customer Statistics */}
        {customerRankStats.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Total Customers</h4>
                    <p className="text-2xl font-bold text-navy-blue">{customers.length}</p>
                  </div>
                  <div className="bg-navy-blue/10 rounded-full p-2">
                    <Users className="h-5 w-5 text-navy-blue" />
                  </div>
                </div>
              </div>
              {customerRankStats.map((stat) => (
                <div key={stat.rankId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 truncate">{stat.rankName}</h4>
                      <p className="text-2xl font-bold text-navy-blue">{stat.customerCount}</p>
                      <p className="text-xs text-gray-500">customers</p>
                    </div>
                    <div className="bg-navy-blue/10 rounded-full p-2">
                      <Crown className="h-5 w-5 text-navy-blue" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
              >
                <option value="all">All Ranks</option>
                {customerRankStats.map((stat) => (
                  <option key={stat.rankId} value={stat.rankId}>
                    {stat.rankName} ({stat.customerCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        {loadingData ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        ) : filteredAndSortedCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRank !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You don\'t have any customers yet. Create customer ranks to start attracting customers.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Customer</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Contact</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('rank')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Rank</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Joined</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedCustomers.map((customer) => (
                    <tr key={customer.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-navy-blue flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">ID: {customer.uid.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.businessAssociation ? (
                          <div className="flex items-center">
                            <Crown className="h-4 w-4 text-orange mr-2" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {customer.businessAssociation.rankName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No rank assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filteredAndSortedCustomers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAndSortedCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>
    </main>
  </div>
  );
}
