import QRCode from 'qrcode';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { appConfig } from '@/config/app';

export interface CustomerRank {
  id?: string;
  businessId: string;
  businessReferenceCode: string;
  name: string;
  description?: string;
  benefits?: string;
  qrCodeUrl: string;
  signupLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerRankFormData {
  name: string;
  description?: string;
  benefits?: string;
}

export interface Customer {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  businessAssociation?: {
    businessId: string;
    businessReferenceCode: string;
    rankId: string;
    rankName: string;
    assignedBy: 'business' | 'admin';
    assignedAt: Date;
  };
  isPublicCustomer?: boolean;
  createdAt: Date;
}

export interface CustomerRankStats {
  rankId: string;
  rankName: string;
  customerCount: number;
  customers: Customer[];
}

// Generate QR code for a signup link
export const generateQRCode = async (signupLink: string): Promise<string> => {
  try {
    const qrCodeUrl = await QRCode.toDataURL(signupLink, {
      width: 300,
      margin: 2,
      color: {
        dark: '#274290',
        light: '#FFFFFF'
      }
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate signup link for a business and rank
export const generateSignupLink = (businessReferenceCode: string, rankName: string): string => {
  return appConfig.getSignupUrl(businessReferenceCode, rankName);
};

// Create a new customer rank
export const createCustomerRank = async (
  businessId: string,
  businessReferenceCode: string,
  rankData: CustomerRankFormData
): Promise<string> => {
  try {
    const signupLink = generateSignupLink(businessReferenceCode, rankData.name);
    const qrCodeUrl = await generateQRCode(signupLink);

    const customerRank: Omit<CustomerRank, 'id'> = {
      businessId,
      businessReferenceCode,
      name: rankData.name,
      description: rankData.description,
      benefits: rankData.benefits,
      qrCodeUrl,
      signupLink,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'customerRanks'), customerRank);
    return docRef.id;
  } catch (error) {
    console.error('Error creating customer rank:', error);
    throw error;
  }
};

// Get all customer ranks for a business
export const getCustomerRanks = async (businessId: string): Promise<CustomerRank[]> => {
  try {
    const q = query(
      collection(db, 'customerRanks'),
      where('businessId', '==', businessId)
    );
    
    const querySnapshot = await getDocs(q);
    const ranks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CustomerRank[];
    
    // Sort by createdAt descending (newest first)
    return ranks.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching customer ranks:', error);
    throw error;
  }
};

// Get customers for a business
export const getBusinessCustomers = async (businessId: string): Promise<Customer[]> => {
  try {
    // For now, we'll fetch all users and filter client-side to avoid index issues
    // In production, you might want to create a composite index for this query
    const q = query(collection(db, 'users'));
    
    const querySnapshot = await getDocs(q);
    const allUsers = querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as Customer[];
    
    // Filter users associated with this business
    const customers = allUsers.filter(user => 
      user.businessAssociation && user.businessAssociation.businessId === businessId
    );
    
    // Sort by createdAt descending (newest first)
    return customers.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching business customers:', error);
    throw error;
  }
};

// Get customer statistics by rank for a business
export const getCustomerRankStats = async (businessId: string): Promise<CustomerRankStats[]> => {
  try {
    // Get all ranks for the business
    const ranks = await getCustomerRanks(businessId);
    
    // Get all customers for the business
    const customers = await getBusinessCustomers(businessId);
    
    // Group customers by rank
    const rankStats: CustomerRankStats[] = ranks.map(rank => ({
      rankId: rank.id!,
      rankName: rank.name,
      customerCount: 0,
      customers: []
    }));
    
    // Count customers in each rank
    customers.forEach(customer => {
      if (customer.businessAssociation) {
        const rankStat = rankStats.find(stat => stat.rankId === customer.businessAssociation!.rankId);
        if (rankStat) {
          rankStat.customerCount++;
          rankStat.customers.push(customer);
        }
      }
    });
    
    // Sort by customer count (highest first)
    return rankStats.sort((a, b) => b.customerCount - a.customerCount);
  } catch (error) {
    console.error('Error fetching customer rank stats:', error);
    throw error;
  }
};

// Update a customer rank
export const updateCustomerRank = async (
  rankId: string,
  rankData: Partial<CustomerRankFormData>
): Promise<void> => {
  try {
    const updateData: Partial<CustomerRank> & { updatedAt: Date } = {
      ...rankData,
      updatedAt: new Date()
    };

    // If name changed, regenerate QR code and signup link
    if (rankData.name) {
      const rankDoc = await getDocs(query(
        collection(db, 'customerRanks'),
        where('__name__', '==', rankId)
      ));
      
      if (!rankDoc.empty) {
        const rank = rankDoc.docs[0].data() as CustomerRank;
        const newSignupLink = generateSignupLink(rank.businessReferenceCode, rankData.name);
        const newQrCodeUrl = await generateQRCode(newSignupLink);
        
        updateData.signupLink = newSignupLink;
        updateData.qrCodeUrl = newQrCodeUrl;
      }
    }

    await updateDoc(doc(db, 'customerRanks', rankId), updateData);
  } catch (error) {
    console.error('Error updating customer rank:', error);
    throw error;
  }
};

// Delete a customer rank
export const deleteCustomerRank = async (rankId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'customerRanks', rankId));
  } catch (error) {
    console.error('Error deleting customer rank:', error);
    throw error;
  }
};

// Toggle customer rank active status
export const toggleCustomerRankStatus = async (rankId: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, 'customerRanks', rankId), {
      isActive,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error toggling customer rank status:', error);
    throw error;
  }
};

// Regenerate QR code for a customer rank
export const regenerateCustomerRankQR = async (rankId: string): Promise<void> => {
  try {
    const rankDoc = await getDocs(query(
      collection(db, 'customerRanks'),
      where('__name__', '==', rankId)
    ));
    
    if (!rankDoc.empty) {
      const rank = rankDoc.docs[0].data() as CustomerRank;
      // Regenerate the signup link with current domain
      const newSignupLink = generateSignupLink(rank.businessReferenceCode, rank.name);
      const newQrCodeUrl = await generateQRCode(newSignupLink);
      
      await updateDoc(doc(db, 'customerRanks', rankId), {
        signupLink: newSignupLink,
        qrCodeUrl: newQrCodeUrl,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    throw error;
  }
};

// Regenerate all signup links for a business (useful when domain changes)
export const regenerateAllBusinessSignupLinks = async (businessId: string): Promise<void> => {
  try {
    const ranks = await getCustomerRanks(businessId);
    
    for (const rank of ranks) {
      const newSignupLink = generateSignupLink(rank.businessReferenceCode, rank.name);
      const newQrCodeUrl = await generateQRCode(newSignupLink);
      
      await updateDoc(doc(db, 'customerRanks', rank.id!), {
        signupLink: newSignupLink,
        qrCodeUrl: newQrCodeUrl,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error regenerating all signup links:', error);
    throw error;
  }
};

// Validate business and rank from signup link
export const validateSignupLink = async (businessReferenceCode: string, rankName: string): Promise<CustomerRank | null> => {
  try {
    const q = query(
      collection(db, 'customerRanks'),
      where('businessReferenceCode', '==', businessReferenceCode),
      where('name', '==', rankName),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as CustomerRank;
    }
    return null;
  } catch (error) {
    console.error('Error validating signup link:', error);
    throw error;
  }
};

// Assign customer to business and rank
export const assignCustomerToBusiness = async (
  userId: string,
  businessId: string,
  businessReferenceCode: string,
  rankId: string,
  rankName: string
): Promise<void> => {
  try {
    const businessAssociation = {
      businessId,
      businessReferenceCode,
      rankId,
      rankName,
      assignedBy: 'business' as const,
      assignedAt: new Date()
    };

    await updateDoc(doc(db, 'users', userId), {
      businessAssociation,
      isPublicCustomer: false
    });
  } catch (error) {
    console.error('Error assigning customer to business:', error);
    throw error;
  }
};
