import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDXduHzBZQJtDeJPn1corJBoTyndaljRLo",
  authDomain: "nexus-productivity-fb6a6.firebaseapp.com",
  projectId: "nexus-productivity-fb6a6",
  storageBucket: "nexus-productivity-fb6a6.firebasestorage.app",
  messagingSenderId: "1056394018384",
  appId: "1:1056394018384:web:61daa6f0ef42b56b05db55"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.nexusFirebaseAuth = auth;
window.nexusFirebaseApp = app;