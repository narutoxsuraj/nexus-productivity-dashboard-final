/* =========================================================
   NEXUS AI — PHASE 3
   Smart Productivity Intelligence Layer
   ========================================================= */

(() => {
  "use strict";

  const AI_NAME = "NEXUS AI";

  function aiNormalize(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function aiEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getUserName() {
    try {
      return localStorage.getItem("nexus_name") || "Naruto";
    } catch {
      return "Naruto";
    }
  }

  function getTasks() {
    try {
      return Array.isArray(tasks) ? tasks : [];
    } catch {
      return [];
    }
  }

  function getSchedule() {
    try {
      return Array.isArray(scheduleItems) ? scheduleItems : [];
    } catch {
      return [];
    }
  }

  function getFocusMinutes() {
    try {
      return Math.floor(Number(focusSeconds || 0) / 60);
    } catch {
      return 0;
    }
  }

  function getGoal() {
    try {
      return Number(goal || 4);
    } catch {
      return 4;
    }
  }

  function getStreak() {
    try {
      return Number(streak || 0);
    } catch {
      return 0;
    }
  }

  function refreshUI() {
    try {
      if (typeof saveTasks === "function") saveTasks();
    } catch {}

    try {
      if (typeof renderTasks === "function") renderTasks();
    } catch {}

    try {
      if (typeof syncTaskPage === "function") syncTaskPage();
    } catch {}

    try {
      if (typeof updateStats === "function") updateStats();
    } catch {}

    try {
      if (typeof syncStatsPage === "function") syncStatsPage();
    } catch {}
  }

  function notify(message) {
    try {
      if (typeof showToast === "function") {
        showToast(message);
      }
    } catch {}
  }

  /* ---------------------------------------------------------
     TASK MATCHING
     --------------------------------------------------------- */

  function findTask(taskQuery) {
    const list = getTasks();
    const query = aiNormalize(taskQuery);

    if (!query) return null;

    // Exact match
    let index = list.findIndex(
      task => aiNormalize(task.text) === query
    );

    if (index >= 0) {
      return { task: list[index], index };
    }

    // Contains match
    index = list.findIndex(
      task =>
        aiNormalize(task.text).includes(query) ||
        query.includes(aiNormalize(task.text))
    );

    if (index >= 0) {
      return { task: list[index], index };
    }

    // Word match
    const words = query
      .split(" ")
      .filter(word => word.length > 2);

    let bestIndex = -1;
    let bestScore = 0;

    list.forEach((task, i) => {
      const taskText = aiNormalize(task.text);

      let score = 0;

      words.forEach(word => {
        if (taskText.includes(word)) score++;
      });

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    if (bestIndex >= 0 && bestScore > 0) {
      return {
        task: list[bestIndex],
        index: bestIndex
      };
    }

    return null;
  }

  /* ---------------------------------------------------------
     SMART PRIORITY
     --------------------------------------------------------- */

  function taskPriorityScore(task) {
    const text = aiNormalize(task.text);

    let score = 0;

    const highPriorityWords = [
      "urgent",
      "important",
      "today",
      "deadline",
      "submit",
      "submission",
      "exam",
      "test",
      "assignment",
      "project",
      "interview",
      "presentation"
    ];

    const studyWords = [
      "study",
      "java",
      "dbms",
      "dsa",
      "os",
      "python",
      "web",
      "coding",
      "programming",
      "computer"
    ];

    highPriorityWords.forEach(word => {
      if (text.includes(word)) score += 5;
    });

    studyWords.forEach(word => {
      if (text.includes(word)) score += 2;
    });

    // Older tasks get slightly higher priority
    if (task.created) {
      const age =
        Date.now() - Number(task.created);

      const days =
        age / (1000 * 60 * 60 * 24);

      score += Math.min(Math.floor(days), 5);
    }

    return score;
  }

  function getSmartNextTask() {
    const pending = getTasks()
      .filter(task => !task.done);

    if (!pending.length) return null;

    return [...pending]
      .sort(
        (a, b) =>
          taskPriorityScore(b) -
          taskPriorityScore(a)
      )[0];
  }

  /* ---------------------------------------------------------
     SCHEDULE
     --------------------------------------------------------- */

  function getUpcomingSchedule() {
    const list = getSchedule();

    if (!list.length) return [];

    const now = new Date();
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    return list
      .map(item => {
        const parts =
          String(item.time || "")
            .split(":")
            .map(Number);

        const hour = Number(parts[0]);
        const minute = Number(parts[1]);

        const itemMinutes =
          hour * 60 + minute;

        return {
          ...item,
          _minutes: itemMinutes,
          _difference:
            itemMinutes - currentMinutes
        };
      })
      .filter(item => item._difference >= 0)
      .sort(
        (a, b) =>
          a._minutes - b._minutes
      );
  }

  /* ---------------------------------------------------------
     PRODUCTIVITY
     --------------------------------------------------------- */

  function productivityReport() {
    const list = getTasks();

    const completed =
      list.filter(task => task.done).length;

    const pending =
      list.filter(task => !task.done).length;

    const total = list.length;

    const completion =
      total > 0
        ? Math.round(
            (completed / total) * 100
          )
        : 0;

    const dailyGoal = getGoal();

    const goalProgress =
      dailyGoal > 0
        ? Math.min(
            100,
            Math.round(
              (completed / dailyGoal) * 100
            )
          )
        : 0;

    return {
      completed,
      pending,
      total,
      completion,
      goalProgress,
      focusMinutes: getFocusMinutes(),
      streak: getStreak()
    };
  }

  /* ---------------------------------------------------------
     ADD TASK
     --------------------------------------------------------- */

  function aiAddTask(text) {
    const taskText = String(text || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!taskText) {
      return "Tell me what task you want me to add. 🙂";
    }

    const existing =
      getTasks().find(
        task =>
          aiNormalize(task.text) ===
          aiNormalize(taskText)
      );

    if (existing) {
      return `
        <b>⚠️ Task already exists</b><br><br>
        ${aiEscape(existing.text)}
      `;
    }

    tasks.push({
      text: taskText,
      done: false,
      created: Date.now()
    });

    refreshUI();
    notify("AI added a new task 🤖");

    return `
      <b>✅ Task added</b><br><br>
      <b>${aiEscape(taskText)}</b><br><br>
      I've added it to your NEXUS task list.
    `;
  }

  /* ---------------------------------------------------------
     COMPLETE TASK
     --------------------------------------------------------- */

  function aiCompleteTask(query) {
    const result = findTask(query);

    if (!result) {
      return `
        <b>❌ I couldn't find that task.</b><br><br>
        Try something like:<br>
        <b>Complete my Java task</b>
      `;
    }

    if (result.task.done) {
      return `
        <b>ℹ️ Already completed</b><br><br>
        ${aiEscape(result.task.text)}
      `;
    }

    result.task.done = true;

    refreshUI();
    notify("Task completed by NEXUS AI ✅");

    return `
      <b>✅ Task completed!</b><br><br>
      <b>${aiEscape(result.task.text)}</b><br><br>
      Nice work. Keep the momentum going 🔥
    `;
  }

  /* ---------------------------------------------------------
     DELETE TASK
     --------------------------------------------------------- */

  function aiDeleteTask(query) {
    const result = findTask(query);

    if (!result) {
      return `
        <b>❌ I couldn't find that task.</b><br><br>
        Try:<br>
        <b>Delete my Python task</b>
      `;
    }

    const removed =
      getTasks().splice(result.index, 1)[0];

    refreshUI();
    notify("Task deleted by NEXUS AI 🗑️");

    return `
      <b>🗑️ Task deleted</b><br><br>
      <b>${aiEscape(removed.text)}</b>
    `;
  }

  /* ---------------------------------------------------------
     START FOCUS
     --------------------------------------------------------- */

  function aiStartFocus() {
    try {
      // If already running, don't accidentally pause it.
      if (
        typeof timerInterval !== "undefined" &&
        timerInterval !== null
      ) {
        return `
          <b>⏱️ Focus session is already running.</b><br><br>
          Stay locked in and keep going 🔥
        `;
      }

      if (typeof startTimer === "function") {
        startTimer();
      } else if (typeof toggleTimer === "function") {
        toggleTimer();
      }

      const next =
        getSmartNextTask();

      if (next) {
        return `
          <b>🎯 Focus mode started!</b><br><br>
          Your recommended task:<br>
          <b>${aiEscape(next.text)}</b><br><br>
          Stay focused for this session. 💪
        `;
      }

      return `
        <b>⏱️ Focus mode started!</b><br><br>
        No pending tasks right now. Use this session for your next project or study goal.
      `;
    } catch (error) {
      console.error(
        "NEXUS AI Focus Error:",
        error
      );

      return `
        <b>⚠️ I couldn't start Focus mode.</b><br><br>
        Please use the Focus button once manually.
      `;
    }
  }

  /* ---------------------------------------------------------
     NOTES AWARENESS
     --------------------------------------------------------- */

  function notesSummary() {
    try {
      const possibleKeys = [
        "nexus_notes",
        "nexus_notes_v2",
        "notes"
      ];

      let notes = null;

      for (const key of possibleKeys) {
        const value =
          localStorage.getItem(key);

        if (value) {
          notes = value;
          break;
        }
      }

      if (!notes) {
        return `
          <b>📝 Notes</b><br><br>
          I don't see any saved notes yet.
        `;
      }

      let count = 1;

      try {
        const parsed =
          JSON.parse(notes);

        if (Array.isArray(parsed)) {
          count = parsed.length;
        }
      } catch {}

      return `
        <b>📝 Your Notes</b><br><br>
        NEXUS has saved notes available.<br>
        <b>${count}</b> saved note${count === 1 ? "" : "s"} detected.
      `;
    } catch {
      return `
        <b>📝 Notes</b><br><br>
        Notes data is currently unavailable.
      `;
    }
  }

  /* ---------------------------------------------------------
     DAY PLAN
     --------------------------------------------------------- */

  function createDayPlan() {
    const pending =
      getTasks()
        .filter(task => !task.done)
        .sort(
          (a, b) =>
            taskPriorityScore(b) -
            taskPriorityScore(a)
        );

    const upcoming =
      getUpcomingSchedule();

    if (!pending.length && !upcoming.length) {
      return `
        <b>🗓️ Your day is clear!</b><br><br>
        No pending tasks or upcoming schedule items found. 🎉
      `;
    }

    let html =
      `<b>🗓️ Your NEXUS Day Plan</b><br><br>`;

    if (upcoming.length) {
      html += `<b>⏰ Upcoming schedule</b><br>`;

      upcoming
        .slice(0, 3)
        .forEach(item => {
          html += `
            • <b>${aiEscape(item.time)}</b>
            — ${aiEscape(item.text)}<br>
          `;
        });

      html += `<br>`;
    }

    if (pending.length) {
      html += `<b>🎯 Recommended task order</b><br>`;

      pending
        .slice(0, 4)
        .forEach((task, index) => {
          html += `
            ${index + 1}. ${aiEscape(task.text)}<br>
          `;
        });

      html += `<br>`;
    }

    html += `
      <b>💡 Strategy:</b><br>
      Finish the highest-priority task first,
      then move to the next one. Use a 25-minute Focus session for deep work.
    `;

    return html;
  }

  /* ---------------------------------------------------------
     SMART AI REPLY
     --------------------------------------------------------- */

  function phase3SmartAiReply(text) {
    const raw = String(text || "").trim();
    const input = aiNormalize(raw);

    const name = getUserName();
    const list = getTasks();

    const pending =
      list.filter(task => !task.done);

    const completed =
      list.filter(task => task.done);

    const report =
      productivityReport();

    /* ADD TASK */

    if (
      /^(add|create)\s+(a\s+)?task\b/i.test(raw)
    ) {
      const taskText =
        raw.replace(
          /^(add|create)\s+(a\s+)?task\s*:?\s*/i,
          ""
        );

      return aiAddTask(taskText);
    }

    if (
      /^remind me to\s+/i.test(raw)
    ) {
      const taskText =
        raw.replace(
          /^remind me to\s+/i,
          ""
        );

      return aiAddTask(taskText);
    }

    /* COMPLETE TASK */

    if (
      /^(complete|finish|done|mark)\b/i.test(raw) ||
      /\bmark\b.+\b(done|complete)\b/i.test(input)
    ) {
      let query =
        raw
          .replace(
            /^(complete|finish|done)\s+(my\s+)?(task\s+)?/i,
            ""
          )
          .replace(
            /^mark\s+(my\s+)?/i,
            ""
          )
          .replace(
            /\s+(as\s+)?(done|complete)$/i,
            ""
          )
          .trim();

      return aiCompleteTask(query);
    }

    /* DELETE TASK */

    if (
      /^(delete|remove)\s+(my\s+)?(task\s+)?/i.test(raw)
    ) {
      const query =
        raw.replace(
          /^(delete|remove)\s+(my\s+)?(task\s+)?/i,
          ""
        );

      return aiDeleteTask(query);
    }

    /* START FOCUS */

    if (
      /^(start|begin|launch)\s+(my\s+)?(focus|focus mode|focus session)/i.test(raw) ||
      /\bstart focus\b/i.test(input)
    ) {
      return aiStartFocus();
    }

    /* NOTES */

    if (
      /\b(notes|note)\b/.test(input) &&
      /\b(show|check|have|saved|my|about)\b/.test(input)
    ) {
      return notesSummary();
    }

    /* PRODUCTIVITY */

    if (
      /productiv|progress|performance|how am i doing|stats|statistics/.test(input)
    ) {
      return `
        <b>📊 Your Productivity</b><br><br>

        ✅ Completed: <b>${report.completed}</b><br>
        ⏳ Pending: <b>${report.pending}</b><br>
        📈 Completion: <b>${report.completion}%</b><br>
        🎯 Goal progress: <b>${report.goalProgress}%</b><br>
        ⏱️ Focus time: <b>${report.focusMinutes} minutes</b><br>
        🔥 Streak: <b>${report.streak} day${report.streak === 1 ? "" : "s"}</b><br><br>

        ${
          report.completion >= 80
            ? "You're doing excellent. Keep the momentum! 🚀"
            : report.completion >= 50
            ? "You're making solid progress. Keep pushing! 💪"
            : "Let's build momentum one task at a time. 🎯"
        }
      `;
    }

    /* WHAT NEXT / PRIORITY */

    if (
      /what should i do next|what should i focus|next task|priority|prioritize|focus on/.test(input)
    ) {
      const next =
        getSmartNextTask();

      if (!next) {
        return `
          <b>🎉 You're all caught up, ${aiEscape(name)}!</b><br><br>
          No pending tasks right now.
          Enjoy the progress or add a new goal. 🚀
        `;
      }

      return `
        <b>🎯 Your smartest next move</b><br><br>

        <b>${aiEscape(next.text)}</b><br><br>

        This task looks like the best next choice based on
        priority, keywords and task age.<br><br>

        <b>Recommendation:</b>
        Start a 25-minute Focus session and work only on this.
      `;
    }

    /* DAY PLAN */

    if (
      /\b(plan|schedule)\b/.test(input) ||
      /\bplan my day\b/.test(input) ||
      /\bwhat should i do today\b/.test(input)
    ) {
      return createDayPlan();
    }

    /* TASK ANALYSIS */

    if (
      /\b(task|tasks|pending|completed|workload)\b/.test(input)
    ) {
      const next =
        getSmartNextTask();

      return `
        <b>📋 Task Analysis</b><br><br>

        Total tasks: <b>${list.length}</b><br>
        ✅ Completed: <b>${completed.length}</b><br>
        ⏳ Pending: <b>${pending.length}</b><br>
        🎯 Daily goal: <b>${getGoal()}</b><br><br>

        ${
          next
            ? `<b>Best next task:</b><br>${aiEscape(next.text)}`
            : "No pending task right now. 🎉"
        }
      `;
    }

    /* STUDY */

    if (
      /\b(study|exam|revision|revise|learn|college|bca|java|dbms|dsa|os|python)\b/.test(input)
    ) {
      const next =
        getSmartNextTask();

      return `
        <b>📚 Study Mode</b><br><br>

        ${
          next
            ? `Your current priority is:<br><br>
               <b>${aiEscape(next.text)}</b><br><br>`
            : `You don't have a pending study task right now.<br><br>`
        }

        <b>Suggested study cycle:</b><br>
        25 min — Deep study 📖<br>
        5 min — Break ☕<br>
        25 min — Practice ✍️<br>
        5 min — Break<br><br>

        Small consistent sessions beat last-minute panic. 🔥
      `;
    }

    /* MOTIVATION */

    if (
      /motivat|lazy|tired|demotivat|give up|can't|cant|stress/.test(input)
    ) {
      return `
        <b>🔥 You've got this, ${aiEscape(name)}.</b><br><br>

        You don't need to finish everything right now.<br><br>

        Pick <b>one task</b>.<br>
        Start a <b>25-minute Focus session</b>.<br>
        Ignore everything else until the timer ends.<br><br>

        Progress first. Perfection later. 💪
      `;
    }

    /* GREETING */

    if (
      /^(hi|hello|hey|hii|namaste|yo)\b/.test(input)
    ) {
      return `
        Hey ${aiEscape(name)}! 👋<br><br>

        I'm <b>NEXUS AI</b>.<br>
        I can now understand your tasks,
        schedule and productivity data.<br><br>

        Try:<br>
        🎯 <b>What should I focus on?</b><br>
        ➕ <b>Add task DBMS Unit 3</b><br>
        ✅ <b>Complete my Java task</b><br>
        🗑️ <b>Delete my Python task</b><br>
        ⏱️ <b>Start focus</b><br>
        📊 <b>Analyze my productivity</b>
      `;
    }

    /* DEFAULT */

    return `
      <b>🤖 I'm ready, ${aiEscape(name)}.</b><br><br>

      I can help manage your NEXUS workspace.<br><br>

      Try asking:<br>

      🎯 What should I focus on?<br>
      🗓️ Plan my day<br>
      📊 Analyze my productivity<br>
      ➕ Add task DBMS Unit 3<br>
      ✅ Complete my Java task<br>
      🗑️ Delete my Python task<br>
      ⏱️ Start focus<br>
      💪 Motivate me
    `;
  }

  /* ---------------------------------------------------------
     OVERRIDE EXISTING SMART AI
     --------------------------------------------------------- */

  window.smartAiReply =
    phase3SmartAiReply;

  window.nexusAiPhase3 = {
    version: "3.0",
    reply: phase3SmartAiReply,
    addTask: aiAddTask,
    completeTask: aiCompleteTask,
    deleteTask: aiDeleteTask,
    startFocus: aiStartFocus,
    productivity: productivityReport
  };

  /* ---------------------------------------------------------
     AI STATUS
     --------------------------------------------------------- */

  function updateAiStatus() {
    document
      .querySelectorAll(".ai-status")
      .forEach(status => {
        status.innerHTML =
          `<span class="status-dot"></span> Smart AI 2.0 • Phase 3 • Ready`;
      });
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      updateAiStatus,
      { once: true }
    );
  } else {
    updateAiStatus();
  }

  console.log(
    "NEXUS AI Phase 3 loaded successfully 🤖"
  );
})();