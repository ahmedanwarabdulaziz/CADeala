'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Industry {
  id?: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function IndustriesPage() {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    active: true
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Admin') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Admin') {
        fetchIndustries();
      }
    }
  }, [user, userRole, loading, router]);

  const fetchIndustries = async () => {
    try {
      setLoadingIndustries(true);
      const querySnapshot = await getDocs(collection(db, 'industries'));
      const industriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Industry[];
      setIndustries(industriesData);
    } catch (error) {
      console.error('Error fetching industries:', error);
    } finally {
      setLoadingIndustries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const industryData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingIndustry) {
        // Update existing industry
        await updateDoc(doc(db, 'industries', editingIndustry.id!), {
          ...industryData,
          updatedAt: new Date()
        });
      } else {
        // Add new industry
        await addDoc(collection(db, 'industries'), industryData);
      }

      setFormData({ name: '', description: '', icon: '', active: true });
      setShowAddForm(false);
      setEditingIndustry(null);
      fetchIndustries();
    } catch (error) {
      console.error('Error saving industry:', error);
    }
  };

  const handleEdit = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      description: industry.description,
      icon: industry.icon,
      active: industry.active
    });
    setShowAddForm(true);
  };

  const handleDelete = async (industryId: string) => {
    if (window.confirm('Are you sure you want to delete this industry?')) {
      try {
        await deleteDoc(doc(db, 'industries', industryId));
        fetchIndustries();
      } catch (error) {
        console.error('Error deleting industry:', error);
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

  if (loading || loadingIndustries) {
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
                <a href="/admin/industries" className="bg-orange text-white px-3 py-2 rounded-md text-sm font-medium">
                  Industries
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
              <h2 className="text-2xl font-bold text-gray-900">Industries Management</h2>
              <p className="text-gray-600">Manage business industries and categories</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingIndustry(null);
                setFormData({ name: '', description: '', icon: '', active: true });
              }}
              className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add Industry
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingIndustry ? 'Edit Industry' : 'Add New Industry'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry Name
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
                      Icon (CSS Class)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      placeholder="e.g., restaurant-icon"
                    />
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
                    {editingIndustry ? 'Update Industry' : 'Add Industry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingIndustry(null);
                      setFormData({ name: '', description: '', icon: '', active: true });
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Industries List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Industries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                  {industries.map((industry) => (
                    <tr key={industry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {industry.icon ? industry.icon.charAt(0).toUpperCase() : industry.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{industry.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{industry.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          industry.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {industry.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(industry)}
                          className="text-orange hover:text-orange-600 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(industry.id!)}
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
          {industries.length === 0 && !loadingIndustries && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Industries Found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first industry.</p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingIndustry(null);
                  setFormData({ name: '', description: '', icon: '', active: true });
                }}
                className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add First Industry
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
