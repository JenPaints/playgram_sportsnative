import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDeOahV8Tb4wrmt5fFk4-Oqh_IldwgUVKI",
  authDomain: "playgram-1327e.firebaseapp.com",
  projectId: "playgram-1327e",
  storageBucket: "playgram-1327e.firebasestorage.app",
  messagingSenderId: "1083965940125",
  appId: "1:1083965940125:web:779deddec7f53d706acf74",
  measurementId: "G-X7Q6TD40H5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, RecaptchaVerifier }; 