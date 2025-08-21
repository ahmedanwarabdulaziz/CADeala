'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

interface BusinessType {
  id?: string;
  name: string;
  description: string;
  industryId: string;
  industryName?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function BusinessTypesPage() {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBusinessType, setEditingBusinessType] = useState<BusinessType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industryId: '',
    active: true
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Admin') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Admin') {
        fetchData();
      }
    }
  }, [user, userRole, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch industries
      const industriesSnapshot = await getDocs(collection(db, 'industries'));
      const industriesData = industriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Industry[];
      setIndustries(industriesData);

      // Fetch business types
      const businessTypesSnapshot = await getDocs(collection(db, 'businessTypes'));
      const businessTypesData = businessTypesSnapshot.docs.map(doc => {
        const data = doc.data() as BusinessType;
        const industry = industriesData.find(ind => ind.id === data.industryId);
        return {
          id: doc.id,
          ...data,
          industryName: industry?.name || 'Unknown Industry'
        };
      });
      setBusinessTypes(businessTypesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const businessTypeData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingBusinessType) {
        // Update existing business type
        await updateDoc(doc(db, 'businessTypes', editingBusinessType.id!), {
          ...businessTypeData,
          updatedAt: new Date()
        });
      } else {
        // Add new business type
        await addDoc(collection(db, 'businessTypes'), businessTypeData);
      }

      setFormData({ name: '', description: '', industryId: '', active: true });
      setShowAddForm(false);
      setEditingBusinessType(null);
      fetchData();
    } catch (error) {
      console.error('Error saving business type:', error);
    }
  };

  const handleEdit = (businessType: BusinessType) => {
    setEditingBusinessType(businessType);
    setFormData({
      name: businessType.name,
      description: businessType.description,
      industryId: businessType.industryId,
      active: businessType.active
    });
    setShowAddForm(true);
  };

  const handleDelete = async (businessTypeId: string) => {
    if (window.confirm('Are you sure you want to delete this business type?')) {
      try {
        await deleteDoc(doc(db, 'businessTypes', businessTypeId));
        fetchData();
      } catch (error) {
        console.error('Error deleting business type:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole || userRole.role !== 'Admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-navy-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-white text-xl font-bold">CADeala Admin</h1>
              </div>
              <nav className="ml-10 flex space-x-8">
                <a href="/admin/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/admin/industries" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Industries
                </a>
                <a href="/admin/business-types" className="bg-orange text-white px-3 py-2 rounded-md text-sm font-medium">
                  Business Types
                </a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-sm">Welcome, </span>
                <span className="font-semibold">{userRole.name}</span>
                <span className="text-xs ml-2 bg-orange px-2 py-1 rounded-full">
                  {userRole.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="border-2 border-white text-white hover:bg-white hover:text-navy-blue font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Business Types Management</h2>
              <p className="text-gray-600">Manage business types within industries</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingBusinessType(null);
                setFormData({ name: '', description: '', industryId: '', active: true });
              }}
              className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add Business Type
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingBusinessType ? 'Edit Business Type' : 'Add New Business Type'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industryId}
                      onChange={(e) => setFormData({ ...formData, industryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    >
                      <option value="">Select an Industry</option>
                      {industries.filter(ind => ind.active).map((industry) => (
                        <option key={industry.id} value={industry.id}>
                          {industry.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {editingBusinessType ? 'Update Business Type' : 'Add Business Type'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingBusinessType(null);
                      setFormData({ name: '', description: '', industryId: '', active: true });
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Business Types List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Business Types</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businessTypes.map((businessType) => (
                    <tr key={businessType.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-navy-blue flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {businessType.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{businessType.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{businessType.industryName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{businessType.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          businessType.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {businessType.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(businessType)}
                          className="text-orange hover:text-orange-600 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(businessType.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {businessTypes.length === 0 && !loadingData && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏪</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Types Found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first business type.</p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingBusinessType(null);
                  setFormData({ name: '', description: '', industryId: '', active: true });
                }}
                className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add First Business Type
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
