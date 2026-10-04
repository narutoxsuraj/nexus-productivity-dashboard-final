/* ==========================================
   NEXUS Firebase Firestore
   Cloud Database + Full Local Data Sync
   ========================================== */

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const app = window.nexusFirebaseApp;
const auth = window.nexusFirebaseAuth;

if (!app) {
  console.error("NEXUS Firestore: Firebase App is not initialized.");
} else if (!auth) {
  console.error("NEXUS Firestore: Firebase Auth is not initialized.");
} else {
  const db = getFirestore(app);
  window.nexusFirestore = db;

  let cloudReady = false;
  let applyingCloud = false;

  console.log("NEXUS Firestore connected successfully.");

  async function saveAllData() {
    if (applyingCloud || !auth.currentUser || !db) return false;

    try {
      const localData = window.nexusCollectLocalData
        ? window.nexusCollectLocalData()
        : {};

      // Firestore documents have a size limit. Very large profile images
      // are kept locally instead of risking a failed cloud write.
      if (
        typeof localData.profileImage === "string" &&
        localData.profileImage.length > 700000
      ) {
        localData.profileImage = "";
      }

      const userId = auth.currentUser.uid;

      await setDoc(
        doc(db, "users", userId),
        {
          ...localData,
          updatedAt: Date.now()
        },
        { merge: true }
      );

      console.log("NEXUS: All data synced to Firestore.");
      return true;
    } catch (error) {
      console.error("NEXUS: Full cloud sync failed:", error);
      return false;
    }
  }

  window.nexusSaveAllDataToCloud = async function () {
    if (!cloudReady) {
      console.log("NEXUS: Cloud sync waiting for initial load.");
      return false;
    }
    return saveAllData();
  };

  window.nexusSaveUserData = async function (data) {
    if (!auth.currentUser || !db) return false;

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { ...data, updatedAt: Date.now() },
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
    if (!auth.currentUser || !db) return null;

    try {
      const snapshot = await getDoc(
        doc(db, "users", auth.currentUser.uid)
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

  window.nexusSaveTasksToCloud = async function (tasks) {
    if (!cloudReady || !auth.currentUser || !db) {
      console.log("NEXUS: Tasks cloud sync waiting for cloud readiness.");
      return false;
    }

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          tasks,
          tasksUpdatedAt: Date.now(),
          updatedAt: Date.now()
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

  onAuthStateChanged(auth, async (user) => {
    cloudReady = false;

    if (!user) {
      console.log("NEXUS: No signed-in user for Firestore sync.");
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));

      if (snapshot.exists()) {
        applyingCloud = true;

        if (window.nexusApplyCloudData) {
          window.nexusApplyCloudData(snapshot.data());
        }

        applyingCloud = false;
        cloudReady = true;

        console.log("NEXUS: Existing cloud data loaded.");
      } else {
        cloudReady = true;

        // First login for this account: preserve the user's existing
        // local dashboard data and create the initial cloud document.
        await saveAllData();

        console.log("NEXUS: Initial local data uploaded to Firestore.");
      }
    } catch (error) {
      applyingCloud = false;
      cloudReady = false;
      console.error("NEXUS: Initial cloud sync failed:", error);
    }
  });
}
