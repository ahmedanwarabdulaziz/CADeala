'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { approveBusinessApplication, rejectBusinessApplication, requestMoreInfo, generateBusinessReferenceCode } from '@/lib/businessUtils';

interface BusinessApplication {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_required';
  businessName: string;
  businessDescription: string;
  industryId: string;
  businessTypeId: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessCity: string;
  businessProvince: string;
  businessPostalCode: string;
  documents: {
    businessLicense?: string;
    taxCertificate?: string;
    insuranceCertificate?: string;
    certifications?: string[];
    businessPhotos?: string[];
  };
  adminNotes?: string;
  requiredInfo?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  businessReferenceCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Industry {
  id: string;
  name: string;
}

interface BusinessType {
  id: string;
  name: string;
  industryId: string;
}

export default function BusinessApplicationsPage() {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();
  
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<BusinessApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

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
      
             // Fetch applications, industries, and business types
       const [applicationsSnapshot, industriesSnapshot, businessTypesSnapshot] = await Promise.all([
         getDocs(collection(db, 'businessRegistrations')),
         getDocs(query(collection(db, 'industries'), orderBy('name', 'asc'))),
         getDocs(query(collection(db, 'businessTypes'), orderBy('name', 'asc')))
       ]);

             const applicationsData = applicationsSnapshot.docs.map(doc => ({
         ...doc.data(),
         id: doc.id,
         createdAt: doc.data().createdAt?.toDate(),
         updatedAt: doc.data().updatedAt?.toDate(),
         reviewedAt: doc.data().reviewedAt?.toDate()
       })) as BusinessApplication[];
       
       // Sort applications by creation date (newest first)
       applicationsData.sort((a, b) => {
         if (!a.createdAt || !b.createdAt) return 0;
         return b.createdAt.getTime() - a.createdAt.getTime();
       });

      const industriesData = industriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Industry[];

      const businessTypesData = businessTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        industryId: doc.data().industryId
      })) as BusinessType[];

      setApplications(applicationsData);
      setIndustries(industriesData);
      setBusinessTypes(businessTypesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getIndustryName = (industryId: string) => {
    return industries.find(ind => ind.id === industryId)?.name || 'Unknown';
  };

  const getBusinessTypeName = (businessTypeId: string) => {
    return businessTypes.find(type => type.id === businessTypeId)?.name || 'Unknown';
  };

  const handleStatusAction = async (applicationId: string, newStatus: string, notes?: string, requiredInfo?: string) => {
    if (!user || !selectedApplication) return;

    try {
      setProcessingAction(true);
      
      if (newStatus === 'approved') {
        const businessReferenceCode = await generateBusinessReferenceCode();
        await approveBusinessApplication(applicationId, selectedApplication.userId, businessReferenceCode, notes);
      } else if (newStatus === 'rejected') {
        await rejectBusinessApplication(applicationId, notes);
      } else if (newStatus === 'more_info_required' && requiredInfo) {
        await requestMoreInfo(applicationId, requiredInfo);
      }
      
      // Refresh data
      await fetchData();
      setShowDetailModal(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setProcessingAction(false);
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

  const filteredApplications = applications.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'more_info_required': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <a href="/admin/tag-categories" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Tag Categories
                </a>
                <a href="/admin/tags" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Tags
                </a>
                <a href="/admin/business-applications" className="bg-orange text-white px-3 py-2 rounded-md text-sm font-medium">
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
            <h2 className="text-2xl font-bold text-gray-900">Business Applications Review</h2>
            <p className="text-gray-600">Review and manage business registration applications</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                >
                                     <option value="all">All Applications</option>
                   <option value="pending">Pending Review</option>
                   <option value="approved">Approved</option>
                   <option value="rejected">Rejected</option>
                   <option value="more_info_required">More Info Required</option>
                </select>
              </div>
              <div className="flex items-end">
                <span className="text-sm text-gray-600">
                  {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Business Applications</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.businessName}</div>
                          <div className="text-sm text-gray-500">{application.businessCity}, {application.businessProvince}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{getIndustryName(application.industryId)}</div>
                          <div className="text-sm text-gray-500">{getBusinessTypeName(application.businessTypeId)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{application.businessEmail}</div>
                          <div className="text-sm text-gray-500">{application.businessPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {application.status === 'pending' && 'Pending Review'}
                          {application.status === 'approved' && 'Approved'}
                          {application.status === 'rejected' && 'Rejected'}
                          {application.status === 'more_info_required' && 'More Info Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.createdAt?.toLocaleDateString()}
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex space-x-2">
                           <button
                             onClick={() => {
                               setSelectedApplication(application);
                               setShowDetailModal(true);
                             }}
                             className="text-orange hover:text-orange-600"
                           >
                             Review
                           </button>
                           {application.status === 'pending' && (
                             <>
                               <button
                                 onClick={() => handleStatusAction(application.id, 'approved', 'Application approved. Welcome to CADeala!')}
                                 disabled={processingAction}
                                 className="text-green-600 hover:text-green-800 disabled:text-green-400"
                                 title="Quick Approve"
                               >
                                 ✓ Approve
                               </button>
                               <button
                                 onClick={() => handleStatusAction(application.id, 'rejected', 'Application rejected after review.')}
                                 disabled={processingAction}
                                 className="text-red-600 hover:text-red-800 disabled:text-red-400"
                                 title="Quick Reject"
                               >
                                 ✗ Reject
                               </button>
                             </>
                           )}
                                                       {application.status === 'rejected' && (
                              <>
                                <button
                                  onClick={() => handleStatusAction(application.id, 'pending', 'Application status changed to pending for re-review.')}
                                  disabled={processingAction}
                                  className="text-blue-600 hover:text-blue-800 disabled:text-blue-400"
                                  title="Move to Pending"
                                >
                                  ↻ Pending
                                </button>
                                <button
                                  onClick={() => handleStatusAction(application.id, 'approved', 'Application approved after re-review.')}
                                  disabled={processingAction}
                                  className="text-green-600 hover:text-green-800 disabled:text-green-400"
                                  title="Quick Approve"
                                >
                                  ✓ Approve
                                </button>
                              </>
                            )}
                            {application.status === 'more_info_required' && (
                              <>
                                <button
                                  onClick={() => handleStatusAction(application.id, 'pending', 'Application status changed to pending for re-review.')}
                                  disabled={processingAction}
                                  className="text-blue-600 hover:text-blue-800 disabled:text-blue-400"
                                  title="Move to Pending"
                                >
                                  ↻ Pending
                                </button>
                                <button
                                  onClick={() => handleStatusAction(application.id, 'approved', 'Application approved after re-review.')}
                                  disabled={processingAction}
                                  className="text-green-600 hover:text-green-800 disabled:text-green-400"
                                  title="Quick Approve"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleStatusAction(application.id, 'rejected', 'Application rejected after review.')}
                                  disabled={processingAction}
                                  className="text-red-600 hover:text-red-800 disabled:text-red-400"
                                  title="Quick Reject"
                                >
                                  ✗ Reject
                                </button>
                              </>
                            )}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600">
                {selectedStatus === 'all' 
                  ? 'No business applications have been submitted yet.'
                  : `No applications with status "${selectedStatus}" found.`}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Review Application: {selectedApplication.businessName}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedApplication(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Business Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedApplication.businessName}</div>
                    <div><span className="font-medium">Industry:</span> {getIndustryName(selectedApplication.industryId)}</div>
                    <div><span className="font-medium">Business Type:</span> {getBusinessTypeName(selectedApplication.businessTypeId)}</div>
                    <div><span className="font-medium">Description:</span> {selectedApplication.businessDescription || 'N/A'}</div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Email:</span> {selectedApplication.businessEmail}</div>
                    <div><span className="font-medium">Phone:</span> {selectedApplication.businessPhone}</div>
                    <div><span className="font-medium">Address:</span> {selectedApplication.businessAddress}</div>
                    <div><span className="font-medium">City:</span> {selectedApplication.businessCity}</div>
                    <div><span className="font-medium">Province:</span> {selectedApplication.businessProvince}</div>
                    <div><span className="font-medium">Postal Code:</span> {selectedApplication.businessPostalCode}</div>
                  </div>
                </div>

                                 {/* Documents */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
                   <div className="text-sm space-y-3">
                     <div>
                       <span className="font-medium">Business License:</span> 
                       {selectedApplication.documents.businessLicense ? (
                         <div className="mt-1">
                           <span className="text-green-600">✓ Uploaded</span>
                           <a 
                             href={selectedApplication.documents.businessLicense} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="ml-2 text-blue-600 hover:text-blue-800 underline"
                           >
                             View Document
                           </a>
                         </div>
                       ) : (
                         <span className="text-red-600 ml-1">✗ Not provided</span>
                       )}
                     </div>
                     
                     <div>
                       <span className="font-medium">Tax Certificate:</span> 
                       {selectedApplication.documents.taxCertificate ? (
                         <div className="mt-1">
                           <span className="text-green-600">✓ Uploaded</span>
                           <a 
                             href={selectedApplication.documents.taxCertificate} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="ml-2 text-blue-600 hover:text-blue-800 underline"
                           >
                             View Document
                           </a>
                         </div>
                       ) : (
                         <span className="text-red-600 ml-1">✗ Not provided</span>
                       )}
                     </div>
                     
                     <div>
                       <span className="font-medium">Insurance Certificate:</span> 
                       {selectedApplication.documents.insuranceCertificate ? (
                         <div className="mt-1">
                           <span className="text-green-600">✓ Uploaded</span>
                           <a 
                             href={selectedApplication.documents.insuranceCertificate} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="ml-2 text-blue-600 hover:text-blue-800 underline"
                           >
                             View Document
                           </a>
                         </div>
                       ) : (
                         <span className="text-red-600 ml-1">✗ Not provided</span>
                       )}
                     </div>
                     
                     <div>
                       <span className="font-medium">Business Photos:</span> 
                       {selectedApplication.documents.businessPhotos && selectedApplication.documents.businessPhotos.length > 0 ? (
                         <div className="mt-2">
                           <span className="text-green-600">✓ {selectedApplication.documents.businessPhotos.length} uploaded</span>
                           <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                             {selectedApplication.documents.businessPhotos.map((photoUrl, index) => (
                               <div key={index} className="relative">
                                 <img 
                                   src={photoUrl} 
                                   alt={`Business Photo ${index + 1}`}
                                   className="w-full h-20 object-cover rounded border"
                                 />
                                 <a 
                                   href={photoUrl} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center"
                                   title="Click to view full size"
                                 >
                                   <span className="text-white opacity-0 hover:opacity-100 text-xs">View</span>
                                 </a>
                               </div>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <span className="text-red-600 ml-1">✗ Not provided</span>
                       )}
                     </div>
                   </div>
                 </div>

                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Current Status</h4>
                  <div className="text-sm">
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                        {selectedApplication.status === 'pending' && 'Pending Review'}
                        {selectedApplication.status === 'approved' && 'Approved'}
                        {selectedApplication.status === 'rejected' && 'Rejected'}
                      </span>
                    </div>
                    {selectedApplication.businessReferenceCode && (
                      <div><span className="font-medium">Reference Code:</span> {selectedApplication.businessReferenceCode}</div>
                    )}
                    {selectedApplication.adminNotes && (
                      <div><span className="font-medium">Admin Notes:</span> {selectedApplication.adminNotes}</div>
                    )}
                    {selectedApplication.requiredInfo && (
                      <div><span className="font-medium">Required Info:</span> {selectedApplication.requiredInfo}</div>
                    )}
                  </div>
                </div>
              </div>

                             {/* Action Buttons */}
               {selectedApplication.status === 'pending' && (
                 <div className="flex justify-end space-x-3 mt-6">
                   <button
                     onClick={() => handleStatusAction(selectedApplication.id, 'rejected', 'Application rejected after review.')}
                     disabled={processingAction}
                     className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                   >
                     {processingAction ? 'Processing...' : 'Reject'}
                   </button>

                   <button
                     onClick={() => handleStatusAction(selectedApplication.id, 'approved', 'Application approved. Welcome to CADeala!')}
                     disabled={processingAction}
                     className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                   >
                     {processingAction ? 'Processing...' : 'Approve'}
                   </button>
                 </div>
               )}

                               {selectedApplication.status === 'rejected' && (
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => handleStatusAction(selectedApplication.id, 'pending', 'Application status changed to pending for re-review.')}
                      disabled={processingAction}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {processingAction ? 'Processing...' : 'Move to Pending'}
                    </button>

                    <button
                      onClick={() => handleStatusAction(selectedApplication.id, 'approved', 'Application approved after re-review.')}
                      disabled={processingAction}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {processingAction ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}

                {selectedApplication.status === 'more_info_required' && (
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => handleStatusAction(selectedApplication.id, 'rejected', 'Application rejected after review.')}
                      disabled={processingAction}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {processingAction ? 'Processing...' : 'Reject'}
                    </button>

                    <button
                      onClick={() => handleStatusAction(selectedApplication.id, 'pending', 'Application status changed to pending for re-review.')}
                      disabled={processingAction}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {processingAction ? 'Processing...' : 'Move to Pending'}
                    </button>

                    <button
                      onClick={() => handleStatusAction(selectedApplication.id, 'approved', 'Application approved after re-review.')}
                      disabled={processingAction}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {processingAction ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}

               {selectedApplication.status === 'approved' && (
                 <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                   <div className="flex items-center">
                     <div className="flex-shrink-0">
                       <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                         <span className="text-white font-semibold text-sm">✓</span>
                       </div>
                     </div>
                     <div className="ml-3">
                       <h3 className="text-lg font-semibold text-green-900">
                         Application Approved
                       </h3>
                       <p className="text-green-700">
                         This application has been approved and the user has been upgraded to Business role. 
                         No further changes can be made.
                       </p>
                       {selectedApplication.businessReferenceCode && (
                         <p className="text-green-700 mt-1">
                           <strong>Reference Code:</strong> {selectedApplication.businessReferenceCode}
                         </p>
                       )}
                     </div>
                   </div>
                 </div>
               )}


            </div>
          </div>
        </div>
      )}
    </div>
  );
}
