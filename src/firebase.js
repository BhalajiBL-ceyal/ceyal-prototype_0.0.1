// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAzbELkwSM2VgGxM4duN4zHwk5gj1rYYAA",
  authDomain: "ceyel.firebaseapp.com",
  projectId: "ceyel-prototype",
  storageBucket: "ceyel-prototype.firebasestorage.app",
  messagingSenderId: "8117992703",
  appId: "1:8117992703:web:50a4afb687a4b1b48fa0ca",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export db so App.js can use it
export { db };

