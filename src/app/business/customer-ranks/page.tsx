'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
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
  X
} from 'lucide-react';

export default function CustomerRanksPage() {
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
  }, [loadCustomerRanks]);

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
    if (!selectedRank?.id) return;
    
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
    if (!confirm('Are you sure you want to delete this customer rank?')) return;
    
    try {
      await deleteCustomerRank(rankId);
      await loadCustomerRanks();
    } catch (error) {
      console.error('Error deleting customer rank:', error);
    }
  };

  const handleToggleStatus = async (rankId: string, currentStatus: boolean) => {
    try {
      await toggleCustomerRankStatus(rankId, !currentStatus);
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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const downloadQRCode = (qrCodeUrl: string, rankName: string) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${rankName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', benefits: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (rank: CustomerRank) => {
    setSelectedRank(rank);
    setFormData({
      name: rank.name,
      description: rank.description || '',
      benefits: rank.benefits || ''
    });
    setShowEditModal(true);
  };

  const openQRModal = (rank: CustomerRank) => {
    setSelectedRank(rank);
    setShowQRModal(true);
  };

  if (loading || !userRole || userRole.role !== 'Business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar type="business" currentPage="customer-ranks" />
      <main className="lg:ml-64 min-h-screen relative">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Ranks Management</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create and manage customer ranks with QR codes and signup links
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-navy-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Create Rank</span>
            </button>
          </div>
        </div>



        {/* Customer Ranks List */}
        {loadingRanks ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer ranks...</p>
          </div>
        ) : customerRanks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Ranks</h3>
            <p className="text-gray-600 mb-4">
              Create your first customer rank to start managing customer relationships
            </p>
            <button
              onClick={openCreateModal}
              className="bg-navy-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Create Your First Rank
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customerRanks.map((rank) => (
              <div key={rank.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                                     <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-lg font-semibold text-gray-900">{rank.name}</h3>
                       <div className="flex items-center space-x-2 mt-1">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           rank.isActive 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-red-100 text-red-800'
                         }`}>
                           {rank.isActive ? 'Active' : 'Inactive'}
                         </span>
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-blue/10 text-navy-blue">
                           {customerRankStats.find(stat => stat.rankId === rank.id)?.customerCount || 0} customers
                         </span>
                       </div>
                     </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(rank.id!, rank.isActive)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        title={rank.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {rank.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(rank)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRank(rank.id!)}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {rank.description && (
                    <p className="text-sm text-gray-600 mb-3">{rank.description}</p>
                  )}

                  {rank.benefits && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Benefits
                      </p>
                      <p className="text-sm text-gray-700">{rank.benefits}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openQRModal(rank)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>View QR</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(rank.signupLink, 'link')}
                        className="flex-1 bg-navy-blue hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Customer Rank</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateRank(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rank Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="e.g., VIP, Premium, Gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="Brief description of this rank"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefits
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="Benefits for customers in this rank"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !formData.name.trim()}
                  className="px-4 py-2 bg-navy-blue hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
                >
                  {processing ? 'Creating...' : 'Create Rank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Customer Rank</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditRank(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rank Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="e.g., VIP, Premium, Gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="Brief description of this rank"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefits
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                    placeholder="Benefits for customers in this rank"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !formData.name.trim()}
                  className="px-4 py-2 bg-navy-blue hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
                >
                  {processing ? 'Updating...' : 'Update Rank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedRank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                QR Code - {selectedRank.name}
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <img
                src={selectedRank.qrCodeUrl}
                alt={`QR Code for ${selectedRank.name}`}
                className="mx-auto border border-gray-200 rounded-lg"
                style={{ width: '200px', height: '200px' }}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signup Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={selectedRank.signupLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedRank.signupLink, 'link')}
                    className="px-3 py-2 bg-navy-blue hover:bg-blue-700 text-white rounded-r-md transition-colors duration-200"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => downloadQRCode(selectedRank.qrCodeUrl, selectedRank.name)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download QR</span>
                </button>
                <button
                  onClick={() => handleRegenerateQR(selectedRank.id!)}
                  className="flex-1 bg-orange hover:bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {copySuccess && (
              <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-sm flex items-center justify-center space-x-1">
                <Check className="h-4 w-4" />
                <span>{copySuccess === 'link' ? 'Link copied!' : 'Copied!'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  </div>
  );
}
