// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7d8ftjCM_RP9tX0UyCPX08h6d7Kj81ak",
  authDomain: "zlnga-ac3a7.firebaseapp.com",
  projectId: "zlnga-ac3a7",
  storageBucket: "zlnga-ac3a7.appspot.com",
  messagingSenderId: "168879555863",
  appId: "1:168879555863:web:ee6fce2e97959a5ee26352",
  measurementId: "G-XSVYG0S3ZG"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };