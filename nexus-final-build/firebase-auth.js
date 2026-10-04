/* ==========================================
   NEXUS Firebase Authentication
   Login + Signup + Google Sign-in
   ========================================== */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";


const auth = window.nexusFirebaseAuth;


if (!auth) {

  console.error(
    "NEXUS Firebase Auth is not initialized."
  );

} else {

  const authScreen =
    document.getElementById("nexusAuthScreen");

  const authForm =
    document.getElementById("nexusAuthForm");

  const emailInput =
    document.getElementById("nexusAuthEmail");

  const passwordInput =
    document.getElementById("nexusAuthPassword");

  const submitButton =
    document.getElementById("nexusAuthSubmit");

  const googleButton =
    document.getElementById("nexusGoogleBtn");

  const message =
    document.getElementById("nexusAuthMessage");

  const loginTab =
    document.getElementById("nexusLoginTab");

  const signupTab =
    document.getElementById("nexusSignupTab");


  let authMode = "login";


  /* ==========================================
     MESSAGE
     ========================================== */

  function showMessage(
    text,
    isError = false
  ) {

    if (!message) return;

    message.textContent = text;

    message.style.color = isError
      ? "#ff6b81"
      : "rgba(255,255,255,0.65)";
  }


  /* ==========================================
     AUTH MODE
     ========================================== */

  function setMode(mode) {

    authMode = mode;


    if (mode === "login") {

      loginTab?.classList.add("active");

      signupTab?.classList.remove("active");


      if (submitButton) {

        submitButton.textContent =
          "Login";

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

        submitButton.textContent =
          "Create Account";

      }


      passwordInput?.setAttribute(
        "autocomplete",
        "new-password"
      );


      showMessage("");

    }

  }


  /* ==========================================
     LOGIN / SIGNUP TABS
     ========================================== */

  loginTab?.addEventListener(
    "click",
    () => {

      setMode("login");

    }
  );


  signupTab?.addEventListener(
    "click",
    () => {

      setMode("signup");

    }
  );


  /* ==========================================
     EMAIL + PASSWORD LOGIN / SIGNUP
     ========================================== */

  authForm?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        emailInput?.value.trim();

      const password =
        passwordInput?.value || "";


      if (!email || !password) {

        showMessage(
          "Please enter your email and password.",
          true
        );

        return;
      }


      if (password.length < 6) {

        showMessage(
          "Password must be at least 6 characters.",
          true
        );

        return;
      }


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          authMode === "login"
            ? "Logging in..."
            : "Creating account...";

      }


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


        showMessage(
          "Success! Opening NEXUS..."
        );


      } catch (error) {

        console.error(
          "NEXUS Authentication Error:",
          error
        );


        let errorText =
          "Something went wrong. Please try again.";


        switch (error.code) {

          case "auth/invalid-credential":

          case "auth/wrong-password":

          case "auth/user-not-found":

            errorText =
              "Email or password is incorrect.";

            break;


          case "auth/email-already-in-use":

            errorText =
              "This email is already registered.";

            break;


          case "auth/invalid-email":

            errorText =
              "Please enter a valid email address.";

            break;


          case "auth/weak-password":

            errorText =
              "Password is too weak.";

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


        showMessage(
          errorText,
          true
        );


        if (submitButton) {

          submitButton.disabled = false;

          submitButton.textContent =
            authMode === "login"
              ? "Login"
              : "Create Account";

        }

      }

    }
  );


  /* ==========================================
     GOOGLE SIGN-IN
     ========================================== */

  googleButton?.addEventListener(
    "click",
    async () => {

      if (googleButton) {

        googleButton.disabled = true;

        googleButton.style.opacity = "0.7";

      }


      showMessage(
        "Connecting to Google..."
      );


      try {

        const provider =
          new GoogleAuthProvider();


        provider.setCustomParameters({
          prompt: "select_account"
        });


        await signInWithPopup(
          auth,
          provider
        );


        showMessage(
          "Google login successful! Opening NEXUS..."
        );


      } catch (error) {

        console.error(
          "NEXUS Google Sign-in Error:",
          error
        );


        let errorText =
          "Google Sign-in failed. Please try again.";


        switch (error.code) {

          case "auth/popup-closed-by-user":

            errorText =
              "Google Sign-in was cancelled.";

            break;


          case "auth/popup-blocked":

            errorText =
              "Google popup was blocked. Please allow popups and try again.";

            break;


          case "auth/cancelled-popup-request":

            errorText =
              "Google Sign-in request was cancelled.";

            break;


          case "auth/account-exists-with-different-credential":

            errorText =
              "This email already uses another login method.";

            break;


          case "auth/network-request-failed":

            errorText =
              "Network error. Please check your internet.";

            break;


          case "auth/operation-not-allowed":

            errorText =
              "Google Sign-in is not enabled in Firebase yet.";

            break;

          case "auth/unauthorized-domain":

            errorText =
              "This app domain is not authorized in Firebase. Add the app domain in Firebase Authentication → Settings → Authorized domains.";

            break;

        }


        showMessage(
          errorText,
          true
        );


      } finally {

        if (googleButton) {

          googleButton.disabled = false;

          googleButton.style.opacity = "1";

        }

      }

    }
  );


  /* ==========================================
     AUTH STATE
     ========================================== */

  onAuthStateChanged(
    auth,
    (user) => {

      if (user) {

        // User is logged in

        authScreen?.classList.add(
          "is-authenticated"
        );


        setTimeout(
          () => {

            if (authScreen) {

              authScreen.style.display =
                "none";

            }

          },
          250
        );


        console.log(
          "NEXUS user signed in:",
          user.email
        );


      } else {

        // User is logged out

        if (authScreen) {

          authScreen.style.display =
            "grid";


          requestAnimationFrame(
            () => {

              authScreen.classList.remove(
                "is-authenticated"
              );

            }
          );

        }


        console.log(
          "NEXUS user is signed out."
        );

      }

    }
  );


  /* ==========================================
     LOGOUT
     ========================================== */

  window.nexusLogout =
    async function () {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "NEXUS Logout Error:",
          error
        );

      }

    };


  /* ==========================================
     START IN LOGIN MODE
     ========================================== */

  setMode("login");

}