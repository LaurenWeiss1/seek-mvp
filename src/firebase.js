// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // ✅ Firestore import
import { getAuth } from 'firebase/auth';



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKYf_Jd6-sShpq6-3JpraADVDwiGeViRU",
  authDomain: "seekmvp-ba363.firebaseapp.com",
  projectId: "seekmvp-ba363",
  storageBucket: "seekmvp-ba363.firebasestorage.app",
  messagingSenderId: "181116474805",
  appId: "1:181116474805:web:3dca29fcf98980fd30b5fc",
  measurementId: "G-W141CK5F51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // ✅ Export Firestore database
export const auth = getAuth(app);
