'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserRole {
  uid: string;
  email: string;
  name: string;
  role: 'Customer' | 'Admin' | 'Business';
  phone?: string;
  businessReferenceCode?: string;
  businessId?: string;
  businessAssociation?: {
    businessId: string;
    businessReferenceCode: string;
    rankId: string;
    rankName: string;
    assignedBy: 'business' | 'admin';
    assignedAt: Date;
  };
  isPublicCustomer?: boolean; // Can browse all businesses
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string, businessAssociation?: {
    businessId: string;
    businessReferenceCode: string;
    rankId: string;
    rankName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from Firestore
  const fetchUserRole = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserRole;
        setUserRole(userData);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserRole(user);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserRole(userCredential.user);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string, businessAssociation?: {
    businessId: string;
    businessReferenceCode: string;
    rankId: string;
    rankName: string;
  }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with the name
      if (userCredential.user) {
        try {
          await updateProfile(userCredential.user, {
            displayName: name
          });
        } catch (profileError) {
          console.warn('Failed to update user profile, but account was created:', profileError);
        }

        // Create user document in Firestore with Customer role
        const userData: UserRole = {
          uid: userCredential.user.uid,
          email: email,
          name: name,
          role: 'Customer', // Default role for sign-up users
          createdAt: new Date()
        };

        // Only add phone if it's provided and not empty
        if (phone && phone.trim() !== '') {
          userData.phone = phone.trim();
        }

        // Add business association if provided
        if (businessAssociation) {
          userData.businessAssociation = {
            ...businessAssociation,
            assignedBy: 'business' as const,
            assignedAt: new Date()
          };
          userData.isPublicCustomer = false;
        }

        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
          setUserRole(userData);
        } catch (firestoreError) {
          console.warn('Failed to create user document in Firestore, but account was created:', firestoreError);
          // Set user role locally even if Firestore fails
          setUserRole(userData);
        }
      }
    } catch (error) {
      // Check if it's a network blocking error
      if (error instanceof Error && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn('Network request was blocked by client (likely ad blocker), but account creation may have succeeded');
        // Don't throw the error since the account might have been created
        return;
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
      throw error;
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      await fetchUserRole(user);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    logout,
    refreshUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
