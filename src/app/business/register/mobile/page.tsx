'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToImgBB, uploadMultipleToImgBB } from '@/lib/imgbbUtils';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Check,
  Mail,
  Phone,
  MapPin,
  Camera
} from 'lucide-react';
import LoadingDots from '@/components/LoadingDots';

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

export default function BusinessRegisterMobile() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
  }, [user, userRole, loading, checkExistingApplication, router]);

  const fetchCategories = async () => {
    try {
      setLoadingData(true);
      
      // Fetch industries
      const industriesSnapshot = await getDocs(collection(db, 'industries'));
      const industriesData = industriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setIndustries(industriesData);
      
      // Fetch business types
      const businessTypesSnapshot = await getDocs(collection(db, 'businessTypes'));
      const businessTypesData = businessTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        industryId: doc.data().industryId
      }));
      setBusinessTypes(businessTypesData);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof BusinessRegistration, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = async (field: keyof BusinessRegistration['documents'], files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploadProgress('Uploading files...');
      
      if (field === 'certifications' || field === 'businessPhotos') {
        // Multiple files
        const urls = await uploadMultipleToImgBB(Array.from(files));
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [field]: urls
          }
        }));
      } else {
        // Single file
        const url = await uploadToImgBB(files[0]);
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [field]: url
          }
        }));
      }
      
      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const removeDocument = (field: keyof BusinessRegistration['documents'], index?: number) => {
    setFormData(prev => {
      const newDocuments = { ...prev.documents };
      
      if (field === 'certifications' || field === 'businessPhotos') {
        const array = newDocuments[field] as string[];
        if (array && index !== undefined) {
          newDocuments[field] = array.filter((_, i) => i !== index);
        }
      } else {
        delete newDocuments[field];
      }
      
      return {
        ...prev,
        documents: newDocuments
      };
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      const applicationData = {
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        createdAt: new Date(),
        ...formData
      };
      
      await addDoc(collection(db, 'businessRegistrations'), applicationData);
      
      // Redirect to dashboard with success message
      router.push('/dashboard?application=submitted');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
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

  const getFilteredBusinessTypes = () => {
    if (!formData.industryId) return [];
    return businessTypes.filter(type => type.industryId === formData.industryId);
  };

  if (loading || loadingData) {
    return (
      <MobileLayout userType="business">
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingDots size="lg" color="text-orange" className="mb-4" />
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
              <h1 className="text-xl font-bold text-gray-900">Business Registration</h1>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 3
              </p>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-orange' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                rows={3}
                placeholder="Describe your business..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={formData.industryId}
                onChange={(e) => handleInputChange('industryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
              >
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={formData.businessTypeId}
                onChange={(e) => handleInputChange('businessTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                disabled={!formData.industryId}
              >
                <option value="">Select a business type</option>
                {getFilteredBusinessTypes().map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Contact Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                  placeholder="business@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                  placeholder="123 Business St"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.businessCity}
                  onChange={(e) => handleInputChange('businessCity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <input
                  type="text"
                  value={formData.businessProvince}
                  onChange={(e) => handleInputChange('businessProvince', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                  placeholder="Province"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.businessPostalCode}
                onChange={(e) => handleInputChange('businessPostalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-blue focus:border-transparent"
                placeholder="A1A 1A1"
              />
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Documents & Photos</h2>
            <p className="text-sm text-gray-600">Upload relevant documents to verify your business</p>
            
            {/* Business License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business License (Optional)</label>
              {formData.documents.businessLicense ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">License uploaded</span>
                  </div>
                  <button
                    onClick={() => removeDocument('businessLicense')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-600">Upload Business License</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocumentUpload('businessLicense', e.target.files)}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Tax Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Certificate (Optional)</label>
              {formData.documents.taxCertificate ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Tax certificate uploaded</span>
                  </div>
                  <button
                    onClick={() => removeDocument('taxCertificate')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-600">Upload Tax Certificate</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocumentUpload('taxCertificate', e.target.files)}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Insurance Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Certificate (Optional)</label>
              {formData.documents.insuranceCertificate ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Insurance certificate uploaded</span>
                  </div>
                  <button
                    onClick={() => removeDocument('insuranceCertificate')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-600">Upload Insurance Certificate</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocumentUpload('insuranceCertificate', e.target.files)}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Business Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Photos (Optional)</label>
              <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                <div className="text-center">
                  <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-sm text-gray-600">Add Business Photos</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleDocumentUpload('businessPhotos', e.target.files)}
                  className="hidden"
                />
              </label>
              {formData.documents.businessPhotos && formData.documents.businessPhotos.length > 0 && (
                <div className="mt-2 space-y-2">
                  {formData.documents.businessPhotos.map((photo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Photo {index + 1}</span>
                      <button
                        onClick={() => removeDocument('businessPhotos', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <LoadingDots size="sm" color="text-blue-600" />
              <span className="text-sm text-blue-800">{uploadProgress}</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.businessName || !formData.businessEmail}
              className="flex items-center space-x-2 px-6 py-2 bg-navy-blue text-white rounded-lg hover:bg-navy-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingDots size="sm" color="text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
