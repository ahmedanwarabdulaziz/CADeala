import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzXap7bILvJS8oyHyqOp53d_KBuxGpFgM",
  authDomain: "cadeala-f75ad.firebaseapp.com",
  projectId: "cadeala-f75ad",
  storageBucket: "cadeala-f75ad.firebasestorage.app",
  messagingSenderId: "324895619552",
  appId: "1:324895619552:web:37d378d6165364962b1385"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
