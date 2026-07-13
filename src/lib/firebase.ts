import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-4z3m1RtXfgpUerbwVN32T1ojlrKbxXA",
  authDomain: "mythical-alignment-m40ks.firebaseapp.com",
  projectId: "mythical-alignment-m40ks",
  storageBucket: "mythical-alignment-m40ks.firebasestorage.app",
  messagingSenderId: "241279486264",
  appId: "1:241279486264:web:13bf19308b8c61ae3c19cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with the specific database ID from the provisioned config
export const db = getFirestore(app, "ai-studio-9500dd98-7879-4efa-955c-f50a5d86dd3c");
