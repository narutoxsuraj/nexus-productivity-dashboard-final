/* ==========================================
   NEXUS Firebase Firestore
   Cloud Database Connection
   ========================================== */

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const app = window.nexusFirebaseApp;

if (!app) {
  console.error("NEXUS Firebase App is not initialized.");
} else {
  const db = getFirestore(app);

  window.nexusFirestore = db;

  console.log("NEXUS Firestore connected successfully.");
}
// ==========================================
// NEXUS Firestore - User Data Helpers
// ==========================================

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

window.nexusSaveUserData = async function (data) {
  const auth = window.nexusFirebaseAuth;
  const db = window.nexusFirestore;

  if (!auth || !db || !auth.currentUser) {
    console.warn("NEXUS: User is not signed in.");
    return false;
  }

  try {
    const userId = auth.currentUser.uid;

    await setDoc(
      doc(db, "users", userId),
      data,
      { merge: true }
    );

    console.log("NEXUS: User data saved to Firestore.");
    return true;
  } catch (error) {
    console.error("NEXUS: Firestore save failed:", error);
    return false;
  }
};

window.nexusLoadUserData = async function () {
  const auth = window.nexusFirebaseAuth;
  const db = window.nexusFirestore;

  if (!auth || !db || !auth.currentUser) {
    console.warn("NEXUS: User is not signed in.");
    return null;
  }

  try {
    const userId = auth.currentUser.uid;

    const snapshot = await getDoc(
      doc(db, "users", userId)
    );

    if (!snapshot.exists()) {
      console.log("NEXUS: No cloud data found yet.");
      return null;
    }

    console.log("NEXUS: User data loaded from Firestore.");
    return snapshot.data();
  } catch (error) {
    console.error("NEXUS: Firestore load failed:", error);
    return null;
  }
};
// ==========================================
// NEXUS - Tasks Cloud Sync
// ==========================================

window.nexusSaveTasksToCloud = async function (tasks) {
  const auth = window.nexusFirebaseAuth;
  const db = window.nexusFirestore;

  if (!auth?.currentUser || !db) {
    console.warn("NEXUS: Tasks cloud sync skipped.");
    return false;
  }

  try {
    const userId = auth.currentUser.uid;

    await setDoc(
      doc(db, "users", userId),
      {
        tasks: tasks,
        tasksUpdatedAt: Date.now()
      },
      { merge: true }
    );

    console.log("NEXUS: Tasks synced to Firestore.");
    return true;
  } catch (error) {
    console.error("NEXUS: Tasks cloud sync failed:", error);
    return false;
  }
};