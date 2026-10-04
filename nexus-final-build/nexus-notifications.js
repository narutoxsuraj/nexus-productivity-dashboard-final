/* =========================================================
   NEXUS — PHASE 4
   Native Android Notifications
   ========================================================= */

(() => {
  "use strict";

  let nativeReady = false;
  let LocalNotifications = null;

  async function loadNotifications() {
    try {
      if (!window.Capacitor?.isNativePlatform?.()) {
        console.log("NEXUS Notifications: Browser mode");
        return false;
      }

      const capacitor = window.Capacitor;

      if (!capacitor?.registerPlugin) {
        console.warn(
          "NEXUS Notifications: Capacitor runtime not available."
        );
        return false;
      }

      // Register the native plugin through the Capacitor runtime.
      // This keeps the same source file usable on GitHub Pages and
      // inside the Android WebView without a browser-side bare import.
      LocalNotifications =
        capacitor.registerPlugin("LocalNotifications");

      nativeReady = !!LocalNotifications;

      if (!nativeReady) {
        return false;
      }

      console.log(
        "NEXUS Native Notifications loaded 🔔"
      );

      return true;

    } catch (error) {
      console.error(
        "NEXUS Notification plugin error:",
        error
      );

      return false;
    }
  }

  async function requestPermission() {
    if (!nativeReady) {
      await loadNotifications();
    }

    if (!nativeReady) {
      return false;
    }

    try {
      const permission =
        await LocalNotifications.checkPermissions();

      if (permission.display === "granted") {
        return true;
      }

      const result =
        await LocalNotifications.requestPermissions();

      return result.display === "granted";

    } catch (error) {
      console.error(
        "NEXUS Notification permission error:",
        error
      );

      return false;
    }
  }

  async function sendNotification({
    id = Date.now(),
    title = "NEXUS",
    body = "You have something to do.",
    extra = {}
  } = {}) {

    const allowed =
      await requestPermission();

    if (!allowed) {
      console.warn(
        "NEXUS notifications are not allowed."
      );

      return false;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Number(id),
            title,
            body,
            smallIcon: "ic_stat_icon_config_sample",
            extra
          }
        ]
      });

      console.log(
        "NEXUS notification scheduled 🔔"
      );

      return true;

    } catch (error) {
      console.error(
        "NEXUS notification error:",
        error
      );

      return false;
    }
  }

  async function sendFocusCompleteNotification() {
    return sendNotification({
      id: 1001,
      title: "🎯 Focus session complete!",
      body: "Great work! Take a short break and keep your momentum going.",
      extra: {
        type: "focus-complete"
      }
    });
  }

  async function sendTaskReminder(taskName) {
    return sendNotification({
      id: 2000 + Math.floor(Math.random() * 1000),
      title: "📋 NEXUS Task Reminder",
      body: taskName
        ? `Don't forget: ${taskName}`
        : "You have a pending task.",
      extra: {
        type: "task-reminder",
        task: taskName || ""
      }
    });
  }

  async function sendDailyReminder() {
    return sendNotification({
      id: 3001,
      title: "⚡ NEXUS Daily Reminder",
      body: "Time to check your tasks and plan your day.",
      extra: {
        type: "daily-reminder"
      }
    });
  }

  window.nexusNotifications = {
    load: loadNotifications,
    requestPermission,
    send: sendNotification,
    focusComplete: sendFocusCompleteNotification,
    taskReminder: sendTaskReminder,
    dailyReminder: sendDailyReminder
  };

  loadNotifications();

})();
