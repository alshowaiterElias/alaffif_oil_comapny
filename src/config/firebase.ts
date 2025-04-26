import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAriErOeNa_UZ1_BXdrHwBPWvYCcEMAD6s",
  authDomain: "alafifwasteoil.firebaseapp.com",
  projectId: "alafifwasteoil",
  storageBucket: "alafifwasteoil.firebasestorage.app",
  messagingSenderId: "890054179184",
  appId: "1:890054179184:web:e014880b6764c8bc69b7b5",
  measurementId: "G-W0K896Y0P1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 