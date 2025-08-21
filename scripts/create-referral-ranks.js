const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, addDoc } = require('firebase/firestore');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createReferralRanksForAllBusinesses() {
  try {
    console.log('Starting referral rank creation for all businesses...');
    
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
    
    console.log(`Found ${businesses.length} businesses`);
    
    // Create referral rank for each business
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const business of businesses) {
      try {
        // Check if referral rank already exists
        const existingQuery = query(
          collection(db, 'customerRanks'),
          where('businessId', '==', business.uid),
          where('name', '==', 'Referral')
        );
        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty) {
          console.log(`Skipped: Referral rank already exists for ${business.businessName || business.name || 'Business'}`);
          skippedCount++;
          continue;
        }
        
        // Create new referral rank
        const referralRankData = {
          name: 'Referral',
          businessId: business.uid,
          businessReferenceCode: business.businessName || business.name || 'Business',
          benefits: 'Welcome gift card and exclusive benefits for referred customers',
          isActive: true,
          qrCodeUrl: '',
          signupLink: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'customerRanks'), referralRankData);
        console.log(`Created: Referral rank for ${business.businessName || business.name || 'Business'}`);
        createdCount++;
        
      } catch (error) {
        console.error(`Error creating referral rank for business ${business.uid}:`, error);
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Total businesses: ${businesses.length}`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Skipped (already exists): ${skippedCount}`);
    console.log(`- Failed: ${businesses.length - createdCount - skippedCount}`);
    
  } catch (error) {
    console.error('Error creating referral ranks for all businesses:', error);
    throw error;
  }
}

// Run the script
createReferralRanksForAllBusinesses()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
