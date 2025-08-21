'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useRouter } from 'next/navigation';
import { 
  CustomerRank, 
  CustomerRankFormData,
  CustomerRankStats,
  createCustomerRank,
  getCustomerRanks,
  getCustomerRankStats,
  updateCustomerRank,
  deleteCustomerRank,
  toggleCustomerRankStatus,
  regenerateCustomerRankQR
} from '@/lib/customerRankUtils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  QrCode, 
  Copy, 
  Download, 
  Users, 
  Eye, 
  EyeOff,
  RefreshCw,
  Check,
  X,
  Crown,
  Settings
} from 'lucide-react';

export default function CustomerRanksMobile() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const [customerRanks, setCustomerRanks] = useState<CustomerRank[]>([]);
  const [customerRankStats, setCustomerRankStats] = useState<CustomerRankStats[]>([]);
  const [loadingRanks, setLoadingRanks] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedRank, setSelectedRank] = useState<CustomerRank | null>(null);
  const [formData, setFormData] = useState<CustomerRankFormData>({
    name: '',
    description: '',
    benefits: ''
  });
  const [processing, setProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Redirect if not business user
  useEffect(() => {
    if (!loading && (!userRole || userRole.role !== 'Business')) {
      router.push('/dashboard');
    }
  }, [userRole, loading, router]);

  const loadCustomerRanks = useCallback(async () => {
    if (!userRole?.businessId) {
      return;
    }
    
    try {
      setLoadingRanks(true);
      const [ranks, stats] = await Promise.all([
        getCustomerRanks(userRole.businessId),
        getCustomerRankStats(userRole.businessId)
      ]);
      setCustomerRanks(ranks);
      setCustomerRankStats(stats);
    } catch (error) {
      console.error('Error loading customer ranks:', error);
    } finally {
      setLoadingRanks(false);
    }
  }, [userRole?.businessId]);

  // Load customer ranks
  useEffect(() => {
    if (userRole?.businessId) {
      loadCustomerRanks();
    }
  }, [loadCustomerRanks, userRole?.businessId]);

  const handleCreateRank = async () => {
    if (!userRole?.businessId || !userRole?.businessReferenceCode) return;
    
    try {
      setProcessing(true);
      await createCustomerRank(userRole.businessId, userRole.businessReferenceCode, formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', benefits: '' });
      await loadCustomerRanks();
    } catch (error) {
      console.error('Error creating customer rank:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditRank = async () => {
    if (!selectedRank || !selectedRank.id) return;
    
    try {
      setProcessing(true);
      await updateCustomerRank(selectedRank.id, formData);
      setShowEditModal(false);
      setSelectedRank(null);
      setFormData({ name: '', description: '', benefits: '' });
      await loadCustomerRanks();
    } catch (error) {
      console.error('Error updating customer rank:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRank = async (rankId: string) => {
    if (!confirm('Are you sure you want to delete this rank? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteCustomerRank(rankId);
      await loadCustomerRanks();
    } catch (error) {
      console.error('Error deleting customer rank:', error);
    }
  };

  const handleToggleStatus = async (rankId: string) => {
    try {
      await toggleCustomerRankStatus(rankId);
      await loadCustomerRanks();
    } catch (error) {
      console.error('Error toggling rank status:', error);
    }
  };

  const handleRegenerateQR = async (rankId: string) => {
    try {
      await regenerateCustomerRankQR(rankId);
      await loadCustomerRanks();
    } catch (error) {
      console.error('Error regenerating QR code:', error);
    }
  };

  const handleCopyLink = async (signupLink: string) => {
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopySuccess('Link copied!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', benefits: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (rank: CustomerRank) => {
    setSelectedRank(rank);
    setFormData({
      name: rank.name,
      description: rank.description,
      benefits: rank.benefits
    });
    setShowEditModal(true);
  };

  const openQRModal = (rank: CustomerRank) => {
    setSelectedRank(rank);
    setShowQRModal(true);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Customer Ranks</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your customer ranks and benefits
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-orange text-white p-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Statistics */}
        {customerRankStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
            <div className="space-y-3">
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

        {/* Customer Ranks List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Ranks ({customerRanks.length})
            </h3>
          </div>
          
          {loadingRanks ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-orange animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading ranks...</p>
            </div>
          ) : customerRanks.length === 0 ? (
            <div className="p-8 text-center">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No customer ranks yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first rank to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {customerRanks.map((rank) => (
                <div key={rank.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-orange rounded-full flex items-center justify-center">
                        <Crown className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{rank.name}</h4>
                        <div className="flex items-center space-x-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rank.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rank.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rank.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {customerRankStats.find(s => s.rankId === rank.id)?.customerCount || 0} customers
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openQRModal(rank)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-navy-blue hover:bg-navy-blue/10 rounded-lg"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>QR</span>
                      </button>
                      <button
                        onClick={() => handleCopyLink(rank.signupLink)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-navy-blue hover:bg-navy-blue/10 rounded-lg"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(rank)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRank(rank.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Rank Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Rank</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rank Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="e.g., Gold, Platinum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    rows={3}
                    placeholder="Describe this rank..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    rows={3}
                    placeholder="List the benefits for this rank..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRank}
                  disabled={processing || !formData.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {processing ? 'Creating...' : 'Create Rank'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rank Modal */}
        {showEditModal && selectedRank && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Rank</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rank Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRank}
                  disabled={processing || !formData.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {processing ? 'Updating...' : 'Update Rank'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && selectedRank && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code - {selectedRank.name}</h3>
              <div className="text-center space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <img
                    src={selectedRank.qrCodeUrl}
                    alt={`QR Code for ${selectedRank.name}`}
                    className="mx-auto w-48 h-48"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCopyLink(selectedRank.signupLink)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-navy-blue text-white rounded-lg hover:bg-navy-blue-600"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Signup Link</span>
                  </button>
                  <button
                    onClick={() => handleRegenerateQR(selectedRank.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Regenerate QR Code</span>
                  </button>
                </div>
                {copySuccess && (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>{copySuccess}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
