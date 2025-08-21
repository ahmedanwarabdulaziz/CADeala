import { doc, updateDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db } from './firebase';
import { createOrGetReferralRank } from './referralUtils';

export const generateBusinessReferenceCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Get count of approved applications
  const q = query(
    collection(db, 'businessRegistrations'),
    where('status', '==', 'approved')
  );
  
  const snapshot = await getDocs(q);
  const approvedCount = snapshot.size + 1;
  
  return `BUS-${year}-${approvedCount.toString().padStart(3, '0')}`;
};

export const approveBusinessApplication = async (
  applicationId: string,
  userId: string,
  businessReferenceCode: string,
  adminNotes?: string
): Promise<void> => {
  try {
    // Get business name from the application
    const applicationDoc = await getDocs(query(
      collection(db, 'businessRegistrations'),
      where('__name__', '==', applicationId)
    ));
    
    let businessName = 'Business';
    if (!applicationDoc.empty) {
      const appData = applicationDoc.docs[0].data();
      businessName = appData.businessName || 'Business';
    }

    // Update the business application
    await updateDoc(doc(db, 'businessRegistrations', applicationId), {
      status: 'approved',
      businessReferenceCode,
      adminNotes,
      reviewedAt: new Date(),
      updatedAt: new Date()
    });

    // Update the user's role to Business
    await updateDoc(doc(db, 'users', userId), {
      role: 'Business',
      businessReferenceCode,
      businessId: applicationId,
      businessName: businessName,
      updatedAt: new Date()
    });

    // Create referral rank for the new business
    await createOrGetReferralRank(applicationId, businessName);

  } catch (error) {
    console.error('Error approving business application:', error);
    throw error;
  }
};

export const rejectBusinessApplication = async (
  applicationId: string,
  adminNotes?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'businessRegistrations', applicationId), {
      status: 'rejected',
      adminNotes,
      reviewedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error rejecting business application:', error);
    throw error;
  }
};

export const requestMoreInfo = async (
  applicationId: string,
  requiredInfo: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'businessRegistrations', applicationId), {
      status: 'more_info_required',
      requiredInfo,
      reviewedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error requesting more info:', error);
    throw error;
  }
};
