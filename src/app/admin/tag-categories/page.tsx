'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TagCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function TagCategoriesPage() {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();

  // Data states
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TagCategory | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    icon: 'tag',
    sortOrder: 1,
    active: true
  });

  // Predefined icons for selection
  const availableIcons = [
    'tag', 'map-pin', 'users', 'calendar', 'star', 'palette', 'dollar-sign',
    'heart', 'gift', 'coffee', 'utensils', 'car', 'home', 'briefcase',
    'graduation-cap', 'music', 'camera', 'gamepad', 'book', 'leaf'
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Admin') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Admin') {
        fetchTagCategories();
      }
    }
  }, [user, userRole, loading, router]);

  const fetchTagCategories = async () => {
    try {
      setLoadingData(true);
      const q = query(collection(db, 'tagCategories'), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      
      const categories = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TagCategory[];
      
      setTagCategories(categories);
    } catch (error) {
      console.error('Error fetching tag categories:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingItem) {
        // Update existing item
        await updateDoc(doc(db, 'tagCategories', editingItem.id), {
          ...itemData,
          updatedAt: new Date()
        });
      } else {
        // Add new item
        await addDoc(collection(db, 'tagCategories'), itemData);
      }

      resetForm();
      fetchTagCategories();
    } catch (error) {
      console.error('Error saving tag category:', error);
    }
  };

  const handleEdit = (item: TagCategory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description,
      color: item.color,
      icon: item.icon,
      sortOrder: item.sortOrder,
      active: item.active
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this tag category? This will also remove all associated tags.')) {
      try {
        await deleteDoc(doc(db, 'tagCategories', itemId));
        fetchTagCategories();
      } catch (error) {
        console.error('Error deleting tag category:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: 'tag',
      sortOrder: 1,
      active: true
    });
    setShowAddForm(false);
    setEditingItem(null);
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
                <div className="flex items-center">
                  <img 
                    src="/CADEALA LOGO.png" 
                    alt="CADeala Logo" 
                    className="h-8 w-auto mr-3"
                  />
                  <h1 className="text-white text-xl font-bold">CADeala Admin</h1>
                </div>
              </div>
              <nav className="ml-10 flex space-x-8">
                <a href="/admin/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/admin/categories" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Categories
                </a>
                <a href="/admin/tag-categories" className="bg-orange text-white px-3 py-2 rounded-md text-sm font-medium">
                  Tag Categories
                </a>
                                        <a href="/admin/tags" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                          Tags
                        </a>
                                        <a href="/admin/business-applications" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Business Applications
                </a>
                <a href="/admin/customer-management" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Customer Management
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tag Categories Management</h2>
            <p className="text-gray-600">Organize and manage tag categories for better categorization</p>
          </div>

          {/* Current Level Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tag Categories</h3>
              <p className="text-gray-600">Manage tag categories and their properties</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingItem(null);
                setFormData({
                  name: '',
                  slug: '',
                  description: '',
                  color: '#3B82F6',
                  icon: 'tag',
                  sortOrder: tagCategories.length + 1,
                  active: true
                });
              }}
              className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add Tag Category
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Edit Tag Category' : 'Add New Tag Category'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: formData.slug || generateSlug(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (URL-friendly)
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      placeholder="auto-generated"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                    >
                      {availableIcons.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      min="1"
                    />
                  </div>
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
                    {editingItem ? 'Update' : 'Add'} Tag Category
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Tag Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sort Order
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
                  {tagCategories.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div 
                              className="h-10 w-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: item.color }}
                            >
                              <span className="text-white font-semibold text-lg">
                                {item.icon === 'tag' ? '🏷️' : 
                                 item.icon === 'map-pin' ? '📍' :
                                 item.icon === 'users' ? '👥' :
                                 item.icon === 'calendar' ? '📅' :
                                 item.icon === 'star' ? '⭐' :
                                 item.icon === 'palette' ? '🎨' :
                                 item.icon === 'dollar-sign' ? '💰' :
                                 item.icon === 'heart' ? '❤️' :
                                 item.icon === 'gift' ? '🎁' :
                                 item.icon === 'coffee' ? '☕' :
                                 item.icon === 'utensils' ? '🍽️' :
                                 item.icon === 'car' ? '🚗' :
                                 item.icon === 'home' ? '🏠' :
                                 item.icon === 'briefcase' ? '💼' :
                                 item.icon === 'graduation-cap' ? '🎓' :
                                 item.icon === 'music' ? '🎵' :
                                 item.icon === 'camera' ? '📷' :
                                 item.icon === 'gamepad' ? '🎮' :
                                 item.icon === 'book' ? '📚' :
                                 item.icon === 'leaf' ? '🍃' : '🏷️'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{item.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.sortOrder}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-orange hover:text-orange-600 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
          {tagCategories.length === 0 && !loadingData && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏷️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tag Categories Found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first tag category.</p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingItem(null);
                  setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    color: '#3B82F6',
                    icon: 'tag',
                    sortOrder: 1,
                    active: true
                  });
                }}
                className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add First Tag Category
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
