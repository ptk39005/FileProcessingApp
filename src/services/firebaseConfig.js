import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Initialize Firebase with only the storage bucket (no API keys in frontend)
const firebaseConfig = {
  storageBucket: "file-processing-app.firebasestorage.app", // Replace with your actual Firebase Storage bucket name
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage
export const storage = getStorage(app);
