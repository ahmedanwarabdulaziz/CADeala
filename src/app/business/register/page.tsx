'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToImgBB, uploadMultipleToImgBB } from '@/lib/imgbbUtils';

interface Industry {
  id: string;
  name: string;
}

interface BusinessType {
  id: string;
  name: string;
  industryId: string;
}

interface BusinessRegistration {
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
}

export default function BusinessRegisterPage() {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  const [formData, setFormData] = useState<BusinessRegistration>({
    businessName: '',
    businessDescription: '',
    industryId: '',
    businessTypeId: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessCity: '',
    businessProvince: '',
    businessPostalCode: '',
    documents: {}
  });

  const checkExistingApplication = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'businessRegistrations'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        // User already has an application, redirect to dashboard
        router.push('/dashboard');
        return;
      }
      
      // No existing application, proceed to fetch categories
      fetchCategories();
    } catch (error) {
      console.error('Error checking existing application:', error);
      // If error, still proceed to fetch categories
      fetchCategories();
    }
  }, [user, router]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (user && userRole && userRole.role !== 'Customer') {
        router.push('/dashboard');
      } else if (user && userRole && userRole.role === 'Customer') {
        checkExistingApplication();
      }
    }
  }, [user, userRole, loading, router, checkExistingApplication]);

  const fetchCategories = async () => {
    try {
      setLoadingData(true);
      
      // Fetch industries and business types
      const [industriesSnapshot, businessTypesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'industries'), orderBy('name', 'asc'))),
        getDocs(query(collection(db, 'businessTypes'), orderBy('name', 'asc')))
      ]);

      const industriesData = industriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Industry[];

      const businessTypesData = businessTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        industryId: doc.data().industryId
      })) as BusinessType[];

      setIndustries(industriesData);
      setBusinessTypes(businessTypesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof BusinessRegistration, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (type: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingFiles(true);
      setUploadProgress(`Uploading ${type}...`);

      if (type === 'businessPhotos' && files.length > 5) {
        alert('Maximum 5 business photos allowed');
        return;
      }

      if (type === 'businessPhotos') {
        // Handle multiple photos
        const fileArray = Array.from(files);
        const urls = await uploadMultipleToImgBB(fileArray);
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [type]: urls
          }
        }));
      } else {
        // Handle single file
        const url = await uploadToImgBB(files[0]);
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [type]: url
          }
        }));
      }

      setUploadProgress(`${type} uploaded successfully!`);
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setUploadProgress(`Error uploading ${type}. Please try again.`);
      setTimeout(() => setUploadProgress(''), 5000);
    } finally {
      setUploadingFiles(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setSubmitting(true);
      
      const applicationData = {
        ...formData,
        userId: user.uid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'businessRegistrations'), applicationData);
      
      // Redirect to dashboard to see application status
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmitting(false);
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

  if (!user || !userRole || userRole.role !== 'Customer') {
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
                  <h1 className="text-white text-xl font-bold">CADeala</h1>
                </div>
              </div>
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
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'bg-orange border-orange text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-20 h-1 mx-2 ${
                      currentStep > step ? 'bg-orange' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-8">
              <span className={`text-sm ${currentStep >= 1 ? 'text-orange font-semibold' : 'text-gray-500'}`}>
                Business Information
              </span>
              <span className={`text-sm ${currentStep >= 2 ? 'text-orange font-semibold' : 'text-gray-500'}`}>
                Contact Details
              </span>
              <span className={`text-sm ${currentStep >= 3 ? 'text-orange font-semibold' : 'text-gray-500'}`}>
                Documents
              </span>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry *
                    </label>
                    <select
                      value={formData.industryId}
                      onChange={(e) => {
                        handleInputChange('industryId', e.target.value);
                        handleInputChange('businessTypeId', ''); // Reset business type
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    >
                      <option value="">Select Industry</option>
                      {industries.map((industry) => (
                        <option key={industry.id} value={industry.id}>
                          {industry.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type *
                    </label>
                    <select
                      value={formData.businessTypeId}
                      onChange={(e) => handleInputChange('businessTypeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                      disabled={!formData.industryId}
                    >
                      <option value="">Select Business Type</option>
                      {businessTypes
                        .filter(type => type.industryId === formData.industryId)
                        .map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Description
                    </label>
                    <textarea
                      value={formData.businessDescription}
                      onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      placeholder="Tell us about your business..."
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address *
                    </label>
                    <input
                      type="text"
                      value={formData.businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.businessCity}
                        onChange={(e) => handleInputChange('businessCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province *
                      </label>
                      <input
                        type="text"
                        value={formData.businessProvince}
                        onChange={(e) => handleInputChange('businessProvince', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={formData.businessPostalCode}
                        onChange={(e) => handleInputChange('businessPostalCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Documents & Photos (Optional)</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 text-sm">
                      Uploading documents is optional but can help speed up the approval process. 
                      Supported formats: PDF, JPG, PNG (max 5MB each).
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business License
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('businessLicense', e.target.files)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        disabled={uploadingFiles}
                      />
                      {formData.documents.businessLicense && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">✓ Business License uploaded</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Certificate
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('taxCertificate', e.target.files)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        disabled={uploadingFiles}
                      />
                      {formData.documents.taxCertificate && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">✓ Tax Certificate uploaded</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Certificate
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('insuranceCertificate', e.target.files)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        disabled={uploadingFiles}
                      />
                      {formData.documents.insuranceCertificate && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">✓ Insurance Certificate uploaded</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Photos (up to 5)
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleFileUpload('businessPhotos', e.target.files)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                        disabled={uploadingFiles}
                      />
                      {formData.documents.businessPhotos && formData.documents.businessPhotos.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">✓ {formData.documents.businessPhotos.length} Business Photo(s) uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-700">{uploadProgress}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!formData.businessName || !formData.industryId || !formData.businessTypeId}
                  className="bg-orange hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.businessName || !formData.industryId || !formData.businessTypeId}
                  className="bg-orange hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
