import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBC6yFhsbInqPlxTKqjrKkP-OxmBajRdSw",
    authDomain: "sih26-8ba27.firebaseapp.com",
    projectId: "sih26-8ba27",
    storageBucket: "sih26-8ba27.firebasestorage.app",
    messagingSenderId: "306037340397",
    appId: "1:306037340397:web:8a821a5d8828a3539cf4e4",
    measurementId: "G-Y6Q92CNCSX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;