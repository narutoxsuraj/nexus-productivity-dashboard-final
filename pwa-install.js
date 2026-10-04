let deferredPrompt = null;

const installCard = document.getElementById("nexusPwaInstall");
const installBtn = document.getElementById("nexusInstallBtn");
const installClose = document.getElementById("nexusInstallClose");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;

  if (installCard) {
    installCard.style.display = "block";
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      if (installCard) {
        installCard.style.display = "none";
      }
    }

    deferredPrompt = null;
  });
}

if (installClose) {
  installClose.addEventListener("click", () => {
    if (installCard) {
      installCard.style.display = "none";
    }

    localStorage.setItem("nexus_pwa_install_dismissed", "1");
  });
}

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;

  if (installCard) {
    installCard.style.display = "none";
  }
});

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        console.log("NEXUS Service Worker registered");
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }
});