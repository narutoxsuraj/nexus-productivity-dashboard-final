/* ==========================================
   NEXUS Firebase Authentication
   Login + Signup
   ========================================== */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const auth = window.nexusFirebaseAuth;

if (!auth) {
  console.error("NEXUS Firebase Auth is not initialized.");
} else {

  const authScreen = document.getElementById("nexusAuthScreen");
  const authForm = document.getElementById("nexusAuthForm");
  const emailInput = document.getElementById("nexusAuthEmail");
  const passwordInput = document.getElementById("nexusAuthPassword");
  const submitButton = document.getElementById("nexusAuthSubmit");
  const message = document.getElementById("nexusAuthMessage");

  const loginTab = document.getElementById("nexusLoginTab");
  const signupTab = document.getElementById("nexusSignupTab");

  let authMode = "login";

  function showMessage(text, isError = false) {
    if (!message) return;

    message.textContent = text;
    message.style.color = isError
      ? "#ff6b81"
      : "rgba(255,255,255,0.65)";
  }

  function setMode(mode) {
    authMode = mode;

    if (mode === "login") {
      loginTab?.classList.add("active");
      signupTab?.classList.remove("active");

      if (submitButton) {
        submitButton.textContent = "Login";
      }

      passwordInput?.setAttribute(
        "autocomplete",
        "current-password"
      );

      showMessage("");
    } else {
      signupTab?.classList.add("active");
      loginTab?.classList.remove("active");

      if (submitButton) {
        submitButton.textContent = "Create Account";
      }

      passwordInput?.setAttribute(
        "autocomplete",
        "new-password"
      );

      showMessage("");
    }
  }

  loginTab?.addEventListener("click", () => {
    setMode("login");
  });

  signupTab?.addEventListener("click", () => {
    setMode("signup");
  });

  authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showMessage("Please enter your email and password.", true);
      return;
    }

    if (password.length < 6) {
      showMessage(
        "Password must be at least 6 characters.",
        true
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent =
      authMode === "login"
        ? "Logging in..."
        : "Creating account...";

    showMessage("");

    try {

      if (authMode === "login") {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      } else {

        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      }

      showMessage("Success! Opening NEXUS...");

    } catch (error) {

      console.error("NEXUS Authentication Error:", error);

      let errorText = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          errorText = "Email or password is incorrect.";
          break;

        case "auth/email-already-in-use":
          errorText = "This email is already registered.";
          break;

        case "auth/invalid-email":
          errorText = "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          errorText = "Password is too weak.";
          break;

        case "auth/too-many-requests":
          errorText =
            "Too many attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          errorText =
            "Network error. Please check your internet.";
          break;
      }

      showMessage(errorText, true);

      submitButton.disabled = false;
      submitButton.textContent =
        authMode === "login"
          ? "Login"
          : "Create Account";
    }
  });

  onAuthStateChanged(auth, (user) => {

    if (user) {
      // User is logged in
      authScreen?.classList.add("is-authenticated");

      setTimeout(() => {
        if (authScreen) {
          authScreen.style.display = "none";
        }
      }, 250);

      console.log(
        "NEXUS user signed in:",
        user.email
      );

    } else {
      // User is logged out
      if (authScreen) {
        authScreen.style.display = "grid";

        requestAnimationFrame(() => {
          authScreen.classList.remove("is-authenticated");
        });
      }

      console.log("NEXUS user is signed out.");
    }
  });

  // Available globally for future Logout button
  window.nexusLogout = async function () {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("NEXUS Logout Error:", error);
    }
  };

  // Start in Login mode
  setMode("login");
}