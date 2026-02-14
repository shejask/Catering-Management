// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCArCmk9YhkV2YAnrMHcxI6g7Oe-We0euQ",
  authDomain: "aneesh--catering.firebaseapp.com",
  databaseURL: "https://aneesh--catering-default-rtdb.firebaseio.com",
  projectId: "aneesh--catering",
  storageBucket: "aneesh--catering.firebasestorage.app",
  messagingSenderId: "1088701004435",
  appId: "1:1088701004435:web:7b255029dd242a819dab66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;