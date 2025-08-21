'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { collection, getDocs, updateDoc, doc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Building2, 
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal
} from 'lucide-react';

interface Customer {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'Customer' | 'Admin' | 'Business';
  businessAssociation?: {
    businessId: string;
    businessReferenceCode: string;
    rankId: string;
    rankName: string;
    assignedBy: 'business' | 'admin';
    assignedAt: Date;
  };
  // Business owner fields
  businessName?: string;
  businessReferenceCode?: string;
  businessId?: string;
  isPublicCustomer?: boolean;
  createdAt: Date;
}

export default function AdminCustomerManagementPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Admin') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Admin') {
        loadCustomers();
      }
    }
  }, [user, userRole, loading, router]);

  const loadCustomers = async () => {
    try {
      setLoadingData(true);
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const allUsers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          uid: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          businessAssociation: data.businessAssociation ? {
            ...data.businessAssociation,
            assignedAt: data.businessAssociation.assignedAt?.toDate ? 
              data.businessAssociation.assignedAt.toDate() : 
              new Date(data.businessAssociation.assignedAt || Date.now())
          } : undefined
        };
      }) as Customer[];

      // Process users to set default values
      const processedUsers = allUsers.map(user => ({
        ...user,
        isPublicCustomer: user.role === 'Customer' && !user.businessAssociation ? true : user.isPublicCustomer || false
      }));

      setCustomers(processedUsers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleMakePublic = async (customerId: string) => {
    try {
      await updateDoc(doc(db, 'users', customerId), {
        businessAssociation: null,
        isPublicCustomer: true
      });
      loadCustomers(); // Reload data
    } catch (error) {
      console.error('Error making customer public:', error);
    }
  };



  // Filter and sort customers
  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.phone && customer.phone.includes(searchTerm));
      
      const matchesRole = filterRole === 'all' || customer.role === filterRole;
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'public' && customer.isPublicCustomer) ||
                           (filterStatus === 'business' && customer.businessAssociation);
      
      return matchesSearch && matchesRole && matchesStatus;
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
        case 'role':
          aValue = a.role;
          bValue = b.role;
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'Business':
        return <Building2 className="h-4 w-4 text-green-500" />;
      case 'Customer':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Business':
        return 'bg-green-100 text-green-800';
      case 'Customer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (customer: Customer) => {
    if (customer.role !== 'Customer') return null;
    
    if (customer.businessAssociation) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Business Customer
      </span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <UserX className="h-3 w-3 mr-1" />
        Public Customer
      </span>;
    }
  };

  const getBusinessInfo = (customer: Customer) => {
    if (customer.role === 'Business') {
      return (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-green-500 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {customer.businessName || customer.businessReferenceCode || 'Business'}
            </div>
            <div className="text-xs text-gray-500">
              Business Owner
            </div>
          </div>
        </div>
      );
    }
    
    if (customer.role === 'Customer') {
      if (customer.businessAssociation) {
        return (
          <div className="flex items-center">
            <Building2 className="h-4 w-4 text-purple-500 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {customer.businessAssociation.businessReferenceCode}
              </div>
              <div className="text-xs text-gray-500">
                {customer.businessAssociation.rankName}
              </div>
            </div>
          </div>
        );
      } else {
        return <span className="text-sm text-gray-400">Public Customer</span>;
      }
    }
    
    // For Admin role
    return <span className="text-sm text-gray-400">-</span>;
  };

  if (loading || !userRole || userRole.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue"></div>
      </div>
    );
  }

  const stats = {
    total: customers.length,
    customers: customers.filter(c => c.role === 'Customer').length,
    businesses: customers.filter(c => c.role === 'Business').length,
    admins: customers.filter(c => c.role === 'Admin').length,
    publicCustomers: customers.filter(c => c.role === 'Customer' && c.isPublicCustomer).length,
    businessCustomers: customers.filter(c => c.role === 'Customer' && c.businessAssociation).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="admin" currentPage="customer-management" />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen relative">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="mt-2 text-gray-600">
              Manage all users including customers, business owners, and admins
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                  <p className="text-sm font-medium text-gray-500">Business Owners</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.businesses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Business Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.businessCustomers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="Customer">Customers</option>
                <option value="Business">Business Owners</option>
                <option value="Admin">Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="public">Public Customers</option>
                <option value="business">Business Customers</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
              </select>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                All Users ({filteredAndSortedCustomers.length})
              </h3>
            </div>
            
            {loadingData ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedCustomers.map((customer) => (
                      <tr key={customer.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {customer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getRoleIcon(customer.role)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(customer.role)}`}>
                              {customer.role === 'Business' ? 'Business Owner' : customer.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(customer)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getBusinessInfo(customer)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-1" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center mt-1">
                                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {customer.createdAt instanceof Date 
                              ? customer.createdAt.toLocaleDateString()
                              : new Date(customer.createdAt).toLocaleDateString()
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {customer.role === 'Customer' && customer.businessAssociation && (
                              <button
                                onClick={() => handleMakePublic(customer.uid)}
                                className="text-orange hover:text-orange-600"
                                title="Make Public Customer"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
