'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
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
  Filter,
  RefreshCw
} from 'lucide-react';

export default function CustomersMobile() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerRankStats, setCustomerRankStats] = useState<CustomerRankStats[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'rank'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

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
      <MobileLayout userType="business">
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
    <MobileLayout userType="business">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your customers and their ranks
          </p>
        </div>

        {/* Customer Statistics */}
        {customerRankStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-navy-blue/10 rounded-full p-2">
                    <Users className="h-5 w-5 text-navy-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Total Customers</p>
                    <p className="text-sm text-gray-600">{customers.length} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-navy-blue">{customers.length}</p>
                </div>
              </div>
              
              {customerRankStats.map((stat) => (
                <div key={stat.rankId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-navy-blue/10 rounded-full p-2">
                      <Crown className="h-5 w-5 text-navy-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{stat.rankName}</p>
                      <p className="text-sm text-gray-600">{stat.customerCount} customers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-navy-blue">{stat.customerCount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
              </div>
              <span className="text-sm text-gray-500">
                {filterRank !== 'all' ? 'Active' : 'All'}
              </span>
            </button>

            {/* Filter Options */}
            {showFilters && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setFilterRank('all')}
                  className={`w-full text-left p-2 rounded-lg text-sm ${
                    filterRank === 'all' 
                      ? 'bg-navy-blue text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Customers
                </button>
                {customerRankStats.map((stat) => (
                  <button
                    key={stat.rankId}
                    onClick={() => setFilterRank(stat.rankId)}
                    className={`w-full text-left p-2 rounded-lg text-sm ${
                      filterRank === stat.rankId 
                        ? 'bg-navy-blue text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {stat.rankName} ({stat.customerCount})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Sort by</h3>
            <span className="text-xs text-gray-500">
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'name' as const, label: 'Name' },
              { key: 'email' as const, label: 'Email' },
              { key: 'createdAt' as const, label: 'Date' },
              { key: 'rank' as const, label: 'Rank' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`p-2 rounded-lg text-sm ${
                  sortBy === key 
                    ? 'bg-orange text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Customers ({filteredAndSortedCustomers.length})
            </h3>
          </div>
          
          {loadingData ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-orange animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : filteredAndSortedCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No customers found</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedCustomers.map((customer) => (
                <div key={customer.uid} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-navy-blue rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {customer.name}
                        </h4>
                        {customer.businessAssociation?.rankName && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange/10 text-orange">
                            {customer.businessAssociation.rankName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(customer.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
