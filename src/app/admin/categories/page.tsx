'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';

interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BusinessType {
  id: string;
  name: string;
  description: string;
  industryId: string;
  industryName?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  businessTypeId: string;
  businessTypeName?: string;
  industryName?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  serviceCategoryId: string;
  serviceCategoryName?: string;
  businessTypeName?: string;
  industryName?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type CategoryLevel = 'industry' | 'businessType' | 'serviceCategory' | 'productCategory';

export default function CategoriesPage() {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();
  
  // Data states
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  
  // UI states
  const [loadingData, setLoadingData] = useState(true);
  const [activeLevel, setActiveLevel] = useState<CategoryLevel>('industry');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Industry | BusinessType | ServiceCategory | ProductCategory | null>(null);

  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    industryId: '',
    businessTypeId: '',
    serviceCategoryId: '',
    active: true
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Admin') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Admin') {
        fetchAllData();
      }
    }
  }, [user, userRole, loading, router]);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch all data in parallel
      const [industriesSnapshot, businessTypesSnapshot, serviceCategoriesSnapshot, productCategoriesSnapshot] = await Promise.all([
        getDocs(collection(db, 'industries')),
        getDocs(collection(db, 'businessTypes')),
        getDocs(collection(db, 'serviceCategories')),
        getDocs(collection(db, 'productCategories'))
      ]);

      // Process industries
      const industriesData = industriesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Industry[];
      setIndustries(industriesData);

      // Process business types with industry names
      const businessTypesData = businessTypesSnapshot.docs.map(doc => {
        const data = doc.data() as BusinessType;
        const industry = industriesData.find(ind => ind.id === data.industryId);
        return {
          ...data,
          id: doc.id,
          industryName: industry?.name || 'Unknown Industry'
        };
      });
      setBusinessTypes(businessTypesData);

      // Process service categories with business type and industry names
      const serviceCategoriesData = serviceCategoriesSnapshot.docs.map(doc => {
        const data = doc.data() as ServiceCategory;
        const businessType = businessTypesData.find(bt => bt.id === data.businessTypeId);
        return {
          ...data,
          id: doc.id,
          businessTypeName: businessType?.name || 'Unknown Business Type',
          industryName: businessType?.industryName || 'Unknown Industry'
        };
      });
      setServiceCategories(serviceCategoriesData);

      // Process product categories with full hierarchy names
      const productCategoriesData = productCategoriesSnapshot.docs.map(doc => {
        const data = doc.data() as ProductCategory;
        const serviceCategory = serviceCategoriesData.find(sc => sc.id === data.serviceCategoryId);
        return {
          ...data,
          id: doc.id,
          serviceCategoryName: serviceCategory?.name || 'Unknown Service Category',
          businessTypeName: serviceCategory?.businessTypeName || 'Unknown Business Type',
          industryName: serviceCategory?.industryName || 'Unknown Industry'
        };
      });
      setProductCategories(productCategoriesData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      let collectionName = '';
      let itemId = '';

      switch (activeLevel) {
        case 'industry':
          collectionName = 'industries';
          itemId = editingItem?.id || '';
          break;
        case 'businessType':
          collectionName = 'businessTypes';
          itemId = editingItem?.id || '';
          break;
        case 'serviceCategory':
          collectionName = 'serviceCategories';
          itemId = editingItem?.id || '';
          break;
        case 'productCategory':
          collectionName = 'productCategories';
          itemId = editingItem?.id || '';
          break;
      }

      if (editingItem && itemId) {
        // Update existing item
        await updateDoc(doc(db, collectionName, itemId), {
          ...itemData,
          updatedAt: new Date()
        });
      } else {
        // Add new item
        await addDoc(collection(db, collectionName), itemData);
      }

      resetForm();
      fetchAllData();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: Industry | BusinessType | ServiceCategory | ProductCategory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      icon: 'icon' in item ? item.icon || '' : '',
      industryId: 'industryId' in item ? item.industryId || '' : '',
      businessTypeId: 'businessTypeId' in item ? item.businessTypeId || '' : '',
      serviceCategoryId: 'serviceCategoryId' in item ? item.serviceCategoryId || '' : '',
      active: item.active
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        let collectionName = '';
        switch (activeLevel) {
          case 'industry':
            collectionName = 'industries';
            break;
          case 'businessType':
            collectionName = 'businessTypes';
            break;
          case 'serviceCategory':
            collectionName = 'serviceCategories';
            break;
          case 'productCategory':
            collectionName = 'productCategories';
            break;
        }
        await deleteDoc(doc(db, collectionName, itemId));
        fetchAllData();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      industryId: '',
      businessTypeId: '',
      serviceCategoryId: '',
      active: true
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const getCurrentData = () => {
    switch (activeLevel) {
      case 'industry':
        return industries;
      case 'businessType':
        return businessTypes;
      case 'serviceCategory':
        return serviceCategories;
      case 'productCategory':
        return productCategories;
      default:
        return [];
    }
  };

  const getLevelTitle = () => {
    switch (activeLevel) {
      case 'industry':
        return 'Industries';
      case 'businessType':
        return 'Business Types';
      case 'serviceCategory':
        return 'Service Categories';
      case 'productCategory':
        return 'Product Categories';
      default:
        return '';
    }
  };

  const getLevelDescription = () => {
    switch (activeLevel) {
      case 'industry':
        return 'Main business sectors and industries';
      case 'businessType':
        return 'Specific business types within industries';
      case 'serviceCategory':
        return 'Service groupings within business types';
      case 'productCategory':
        return 'Product categories within service categories';
      default:
        return '';
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

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="admin" currentPage="categories" />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Hierarchical Categories Management</h2>
            <p className="text-gray-600">Manage all category levels in one place</p>
          </div>



          {/* Level Navigation */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveLevel('industry')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeLevel === 'industry'
                    ? 'bg-orange text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Industries ({industries.length})
              </button>
              <button
                onClick={() => setActiveLevel('businessType')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeLevel === 'businessType'
                    ? 'bg-orange text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Business Types ({businessTypes.length})
              </button>
              <button
                onClick={() => setActiveLevel('serviceCategory')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeLevel === 'serviceCategory'
                    ? 'bg-orange text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Service Categories ({serviceCategories.length})
              </button>
              <button
                onClick={() => setActiveLevel('productCategory')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeLevel === 'productCategory'
                    ? 'bg-orange text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Product Categories ({productCategories.length})
              </button>
            </div>
          </div>

          {/* Current Level Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{getLevelTitle()}</h3>
              <p className="text-gray-600">{getLevelDescription()}</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingItem(null);
                setFormData({
                  name: '',
                  description: '',
                  icon: '',
                  industryId: '',
                  businessTypeId: '',
                  serviceCategoryId: '',
                  active: true
                });
              }}
              className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add {getLevelTitle().slice(0, -1)}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? `Edit ${getLevelTitle().slice(0, -1)}` : `Add New ${getLevelTitle().slice(0, -1)}`}
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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>
                  {activeLevel === 'industry' && (
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
                  )}
                  {activeLevel === 'businessType' && (
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
                  )}
                  {activeLevel === 'serviceCategory' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <select
                        value={formData.businessTypeId}
                        onChange={(e) => setFormData({ ...formData, businessTypeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        required
                      >
                        <option value="">Select a Business Type</option>
                        {businessTypes.filter(bt => bt.active).map((businessType) => (
                          <option key={businessType.id} value={businessType.id}>
                            {businessType.name} ({businessType.industryName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {activeLevel === 'productCategory' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Category
                      </label>
                      <select
                        value={formData.serviceCategoryId}
                        onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        required
                      >
                        <option value="">Select a Service Category</option>
                        {serviceCategories.filter(sc => sc.active).map((serviceCategory) => (
                          <option key={serviceCategory.id} value={serviceCategory.id}>
                            {serviceCategory.name} ({serviceCategory.businessTypeName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                    {editingItem ? 'Update' : 'Add'} {getLevelTitle().slice(0, -1)}
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
              <h3 className="text-lg font-semibold text-gray-900">All {getLevelTitle()}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getLevelTitle().slice(0, -1)}
                    </th>
                    {activeLevel !== 'industry' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent Category
                      </th>
                    )}
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
                  {currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              activeLevel === 'industry' ? 'bg-orange' : 'bg-navy-blue'
                            }`}>
                              <span className="text-white font-semibold">
                                {('icon' in item && item.icon) ? item.icon.charAt(0).toUpperCase() : item.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      {activeLevel !== 'industry' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {activeLevel === 'businessType' && (item as BusinessType).industryName}
                            {activeLevel === 'serviceCategory' && `${(item as ServiceCategory).businessTypeName} (${(item as ServiceCategory).industryName})`}
                            {activeLevel === 'productCategory' && `${(item as ProductCategory).serviceCategoryName} (${(item as ProductCategory).businessTypeName})`}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.description}</div>
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
          {currentData.length === 0 && !loadingData && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {getLevelTitle()} Found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first {getLevelTitle().slice(0, -1).toLowerCase()}.</p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingItem(null);
                  setFormData({
                    name: '',
                    description: '',
                    icon: '',
                    industryId: '',
                    businessTypeId: '',
                    serviceCategoryId: '',
                    active: true
                  });
                }}
                className="bg-orange hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add First {getLevelTitle().slice(0, -1)}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
