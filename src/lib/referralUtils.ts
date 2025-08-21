import { collection, doc, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { appConfig } from '@/config/app';

// Import CustomerRank type
export interface CustomerRank {
  id: string;
  name: string;
  businessId: string;
  businessReferenceCode: string;
  benefits: string;
  isActive: boolean;
  qrCodeUrl: string;
  signupLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralCode {
  id: string;
  userId: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  referralCode: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerEmail: string;
  referredUserId: string;
  referredUserEmail: string;
  businessId: string;
  businessName: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalPoints: number;
}

/**
 * Generate a unique referral code for a user
 */
export const generateReferralCode = (userName: string): string => {
  // Get first 3-4 characters of the name, uppercase
  const namePart = userName?.substring(0, 4).toUpperCase() || 'USER';
  
  // Generate random 3-digit number
  const randomPart = Math.floor(Math.random() * 900) + 100;
  
  return `${namePart}${randomPart}`;
};

/**
 * Create or get existing referral code for a user
 */
export const createOrGetReferralCode = async (
  userId: string, 
  userEmail: string, 
  userName: string,
  businessId: string,
  businessName: string
): Promise<ReferralCode> => {
  try {
    // Check if user already has a referral code
    const existingQuery = query(
      collection(db, 'referralCodes'),
      where('userId', '==', userId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      return {
        id: existingDoc.id,
        ...existingDoc.data()
      } as ReferralCode;
    }
    
    // Generate new referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      referralCode = generateReferralCode(userName);
      
      // Check if code is unique
      const codeQuery = query(
        collection(db, 'referralCodes'),
        where('referralCode', '==', referralCode)
      );
      const codeSnapshot = await getDocs(codeQuery);
      
      if (codeSnapshot.empty) {
        isUnique = true;
      } else {
        attempts++;
      }
    }
    
    if (!isUnique) {
      throw new Error('Unable to generate unique referral code');
    }
    
    // Create new referral code document
    const referralCodeData: Omit<ReferralCode, 'id'> = {
      userId,
      userEmail,
      businessId,
      businessName,
      referralCode: referralCode!,
      createdAt: new Date(),
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, 'referralCodes'), referralCodeData);
    
    return {
      id: docRef.id,
      ...referralCodeData
    };
  } catch (error) {
    console.error('Error creating referral code:', error);
    throw error;
  }
};

/**
 * Generate referral link for sharing
 */
export const generateReferralLink = (referralCode: string): string => {
  const baseUrl = appConfig.getAppUrl();
  return `${baseUrl}/signup?ref=${referralCode}`;
};

/**
 * Get referral code by code string
 */
export const getReferralCodeByCode = async (code: string): Promise<ReferralCode | null> => {
  try {
    const referralQuery = query(
      collection(db, 'referralCodes'),
      where('referralCode', '==', code),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(referralQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ReferralCode;
  } catch (error) {
    console.error('Error getting referral code:', error);
    return null;
  }
};

/**
 * Create referral record when new user signs up
 */
export const createReferralRecord = async (
  referrerId: string,
  referrerEmail: string,
  referredUserId: string,
  referredUserEmail: string,
  businessId: string,
  businessName: string,
  referralCode: string
): Promise<string> => {
  try {
    const referralData: Omit<Referral, 'id'> = {
      referrerId,
      referrerEmail,
      referredUserId,
      referredUserEmail,
      businessId,
      businessName,
      referralCode,
      status: 'completed', // Set as completed immediately since signup is successful
      createdAt: new Date(),
      completedAt: new Date() // Set completion time immediately
    };
    
    const docRef = await addDoc(collection(db, 'referrals'), referralData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating referral record:', error);
    throw error;
  }
};

/**
 * Complete referral when user completes registration
 */
export const completeReferral = async (referralId: string): Promise<void> => {
  try {
    const referralRef = doc(db, 'referrals', referralId);
    await updateDoc(referralRef, {
      status: 'completed',
      completedAt: new Date()
    });
  } catch (error) {
    console.error('Error completing referral:', error);
    throw error;
  }
};

/**
 * Find and complete referral by referred user email
 */
export const completeReferralByEmail = async (referredUserEmail: string): Promise<void> => {
  try {
    const query = query(
      collection(db, 'referrals'),
      where('referredUserEmail', '==', referredUserEmail),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(query);
    
    if (!snapshot.empty) {
      const referralDoc = snapshot.docs[0];
      await updateDoc(referralDoc.ref, {
        status: 'completed',
        completedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error completing referral by email:', error);
    throw error;
  }
};

/**
 * Get referral statistics for a user
 */
export const getReferralStats = async (userId: string): Promise<ReferralStats> => {
  try {
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId)
    );
    const snapshot = await getDocs(referralsQuery);
    
    const referrals = snapshot.docs.map(doc => doc.data() as Referral);
    
    return {
      totalReferrals: referrals.length,
      successfulReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      totalPoints: 0 // Will be implemented later
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      totalPoints: 0
    };
  }
};

/**
 * Get referral history for a user
 */
export const getReferralHistory = async (userId: string): Promise<Referral[]> => {
  try {
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId)
    );
    const snapshot = await getDocs(referralsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Referral));
  } catch (error) {
    console.error('Error getting referral history:', error);
    return [];
  }
};

/**
 * Create or get the permanent "Referral" customer rank for a business
 */
export const createOrGetReferralRank = async (businessId: string, businessName: string): Promise<CustomerRank> => {
  try {
    // Check if referral rank already exists for this business
    const existingQuery = query(
      collection(db, 'customerRanks'),
      where('businessId', '==', businessId),
      where('name', '==', 'Referral')
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      return {
        id: existingDoc.id,
        ...existingDoc.data()
      } as CustomerRank;
    }
    
    // Create new referral rank
    const referralRankData: Omit<CustomerRank, 'id'> = {
      name: 'Referral',
      businessId,
      businessReferenceCode: businessName,
      benefits: 'Welcome gift card and exclusive benefits for referred customers',
      isActive: true,
      qrCodeUrl: '',
      signupLink: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'customerRanks'), referralRankData);
    
    return {
      id: docRef.id,
      ...referralRankData
    };
  } catch (error) {
    console.error('Error creating referral rank:', error);
    throw error;
  }
};

/**
 * Create referral ranks for all existing businesses
 */
export const createReferralRanksForAllBusinesses = async (): Promise<void> => {
  try {
    // Get all businesses
    const businessesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'Business')
    );
    const businessesSnapshot = await getDocs(businessesQuery);
    
    const businesses = businessesSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    // Create referral rank for each business
    for (const business of businesses) {
      try {
        await createOrGetReferralRank(
          business.uid,
          business.businessName || business.name || 'Business'
        );
        console.log(`Created referral rank for business: ${business.businessName || business.name}`);
      } catch (error) {
        console.error(`Error creating referral rank for business ${business.uid}:`, error);
      }
    }
    
    console.log(`Processed ${businesses.length} businesses for referral ranks`);
  } catch (error) {
    console.error('Error creating referral ranks for all businesses:', error);
    throw error;
  }
};
