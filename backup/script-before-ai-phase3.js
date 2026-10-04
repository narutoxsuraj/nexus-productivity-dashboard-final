const $ = (id) => document.getElementById(id);

function safeOn(id, event, handler) {
  const element = $(id);
  if (element) element.addEventListener(event, handler);
}

const STORAGE = {
  tasks: "nexus_tasks_v2",
  notes: "nexus_notes_v2",
  theme: "nexus_theme_v2",
  name: "nexus_name_v2",
  goal: "nexus_goal_v2",
  focus: "nexus_focus_v2",
  streak: "nexus_streak_v2",
  lastDay: "nexus_last_day_v2",
  profileImage: "nexus_profile_image_v2",
  schedule: "nexus_schedule_v2",
  timerDuration: "nexus_timer_duration_v2"
};

let tasks = JSON.parse(localStorage.getItem(STORAGE.tasks) || "[]");
let focusSeconds = Number(localStorage.getItem(STORAGE.focus) || 0);
let streak = Number(localStorage.getItem(STORAGE.streak) || 0);
let lastDay = localStorage.getItem(STORAGE.lastDay) || "";
let goal = Number(localStorage.getItem(STORAGE.goal) || 4);
let timerDuration = Number(localStorage.getItem(STORAGE.timerDuration) || 25);
let time = timerDuration * 60;

let scheduleItems = JSON.parse(localStorage.getItem(STORAGE.schedule) || "null") || [
  { time: "08:00", text: "College / Classes" },
  { time: "17:00", text: "Project & Coding" },
  { time: "19:00", text: "Study / Revision" },
  { time: "22:00", text: "Plan tomorrow" }
];
let timerInterval = null;

const quotes = [
  "Small progress every day leads to big results.",
  "Focus on the next step, not the whole staircase.",
  "Consistency beats motivation.",
  "Your future self will thank you for starting today.",
  "One focused hour can change your entire day.",
  "Done is better than perfect."
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function saveTasks() {
  localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));

  if (window.nexusSaveTasksToCloud) {
    window.nexusSaveTasksToCloud(tasks);
  }
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function updateDate() {
  const now = new Date();
  $("date").textContent = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const hour = now.getHours();
  let greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = localStorage.getItem(STORAGE.name) || "Naruto";
  $("greeting").textContent = `${greeting}, ${name} 👋`;
  $("profileName").textContent = name;
}

function renderTasks() {
  const list = $("taskList");
  list.innerHTML = "";
  $("taskCount").textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  $("taskEmpty").style.display = tasks.length ? "none" : "block";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.done ? "done" : ""}`;
    li.innerHTML = `
      <input class="task-check" type="checkbox" ${task.done ? "checked" : ""} aria-label="Complete task">
      <label>${escapeHtml(task.text)}</label>
      <button class="delete-btn" title="Delete task">×</button>
    `;
    li.querySelector(".task-check").addEventListener("change", () => {
      tasks[index].done = !tasks[index].done;
      saveTasks();
      updateStats();
      renderTasks();
    });
    li.querySelector(".delete-btn").addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
      updateStats();
      showToast("Task deleted");
    });
    list.appendChild(li);
  });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function addTask() {
  const input = $("taskInput");
  const text = input.value.trim();
  if (!text) {
    showToast("Write a task first ✍️");
    input.focus();
    return;
  }
  tasks.push({ text, done: false, created: Date.now() });
  input.value = "";
  saveTasks();
  renderTasks();
  updateStats();
  showToast("Task added 🚀");
}

function updateStats() {
  const completed = tasks.filter(t => t.done).length;
  const productivity = Math.min(100, Math.round((completed / Math.max(goal, 1)) * 100));
  $("completedCount").textContent = completed;
  $("productivity").textContent = `${productivity}%`;
  $("productivityBar").style.width = `${productivity}%`;
  $("productivityMessage").textContent =
    productivity >= 100 ? "Goal complete! Amazing work 🔥" :
    productivity >= 50 ? "Keep pushing forward!" : "Let's build some momentum.";

  $("focusMinutes").textContent = `${Math.floor(focusSeconds / 60)}m`;
  $("streak").textContent = streak;
  renderBars();
}

function updateTimer() {
  const timerElement = $("timer");
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
  if (timerInterval !== null) return;
  $("startFocus").textContent = "Pause";
  $("timerStatus").textContent = "Focus session running…";
  timerInterval = setInterval(() => {
    if (time > 0) {
      time--;
      focusSeconds++;
      localStorage.setItem(STORAGE.focus, String(focusSeconds));
      updateTimer();
      updateStats();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      $("startFocus").textContent = "Start Focus";
      $("timerStatus").textContent = "Session completed 🎉";
      showToast("Focus session completed! 🎉");
    }
  }, 1000);
}

function toggleTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
    $("startFocus").textContent = "Start Focus";
    $("timerStatus").textContent = "Focus session paused";
  } else {
    startTimer();
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  time = timerDuration * 60;
  updateTimer();
  $("startFocus").textContent = "Start Focus";
  $("timerStatus").textContent = "Ready for a focus session";
}


function updateProfileAvatar() {
  const avatar = $("profileAvatar");
  if (!avatar) return;

  const savedImage = localStorage.getItem(STORAGE.profileImage);
  if (savedImage) {
    avatar.innerHTML = `<img src="${savedImage}" alt="Profile picture">`;
    avatar.classList.add("has-image");
  } else {
    const name = localStorage.getItem(STORAGE.name) || "Naruto";
    avatar.textContent = name.charAt(0).toUpperCase();
    avatar.classList.remove("has-image");
  }
}

function renderSchedule() {
  const list = $("scheduleList");
  if (!list) return;

  list.innerHTML = scheduleItems.length
    ? scheduleItems.map(item => `
        <div class="schedule-item">
          <span class="time">${escapeHtml(item.time)}</span>
          <span>${escapeHtml(item.text)}</span>
        </div>
      `).join("")
    : `<div class="schedule-empty">No schedule added yet.</div>`;
}

function renderScheduleEditor() {
  const editor = $("scheduleEditor");
  if (!editor) return;

  editor.innerHTML = scheduleItems.map((item, index) => `
    <div class="schedule-edit-row">
      <input class="schedule-time-input" data-index="${index}" type="time" value="${escapeHtml(item.time)}">
      <input class="schedule-text-input" data-index="${index}" type="text" maxlength="80" value="${escapeHtml(item.text)}" placeholder="Schedule item">
      <button class="delete-btn schedule-delete" data-index="${index}" title="Delete schedule">×</button>
    </div>
  `).join("");

  editor.querySelectorAll(".schedule-delete").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      scheduleItems.splice(index, 1);
      renderScheduleEditor();
    });
  });
}

function openScheduleEditor() {
  renderScheduleEditor();
  openModal("scheduleModal");
}

function saveScheduleChanges() {
  const rows = document.querySelectorAll(".schedule-edit-row");
  scheduleItems = Array.from(rows).map(row => ({
    time: row.querySelector(".schedule-time-input").value || "00:00",
    text: row.querySelector(".schedule-text-input").value.trim() || "Untitled schedule"
  }));

  localStorage.setItem(STORAGE.schedule, JSON.stringify(scheduleItems));
  renderSchedule();
  closeModal("scheduleModal");
  showToast("Schedule updated 📅");
}

function addScheduleItem() {
  scheduleItems.push({ time: "12:00", text: "New schedule" });
  renderScheduleEditor();
}

function setTimerDuration(minutes) {
  timerDuration = Number(minutes) || 25;
  localStorage.setItem(STORAGE.timerDuration, String(timerDuration));

  if (timerInterval === null) {
    time = timerDuration * 60;
    updateTimer();
    $("timerStatus").textContent = "Ready for a focus session";
  }
}

function renderBars() {
  const bars = $("bars");
  const completed = tasks.filter(t => t.done).length;
  const values = [
    Math.max(1, Math.min(100, completed * 20)),
    Math.max(1, Math.min(100, completed * 18)),
    Math.max(1, Math.min(100, completed * 22)),
    Math.max(1, Math.min(100, completed * 25)),
    Math.max(1, Math.min(100, completed * 24)),
    Math.max(1, Math.min(100, completed * 28)),
    Math.max(1, Math.min(100, (completed / Math.max(goal,1))*100))
  ];
  const labels = ["M","T","W","T","F","S","Today"];
  bars.innerHTML = values.map((v,i) =>
    `<div class="bar-col"><span class="bar" style="height:${v}%"></span><span class="bar-label">${labels[i]}</span></div>`
  ).join("");
}

function updateStreak() {
  const key = todayKey();
  if (lastDay !== key) {
    const previous = new Date();
    previous.setDate(previous.getDate() - 1);
    const prevKey = previous.toISOString().slice(0,10);
    if (lastDay === prevKey) streak++;
    else if (!lastDay) streak = 1;
    else streak = 1;
    lastDay = key;
    localStorage.setItem(STORAGE.lastDay, lastDay);
    localStorage.setItem(STORAGE.streak, String(streak));
  }
}

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  $("themeBtn").textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem(STORAGE.theme, theme);
}

function openModal(id) { $(id).classList.remove("hidden"); }
function closeModal(id) { $(id).classList.add("hidden"); }

function setAiMessage(message) {
  const el = $("aiMessage");
  if (el) el.innerHTML = message;
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function makePlan() {
  const pending = tasks.filter(t => !t.done);
  if (!pending.length) {
    return "Your task list is empty. Add 2–3 important tasks and I’ll help you prioritize them. 🚀";
  }

  const top = pending.slice(0, 3);
  const lines = top.map((t, i) =>
    `<b>${i + 1}.</b> ${escapeHtml(t.text)} — ${i === 0 ? "Start now 🎯" : "After the previous task"}`
  ).join("<br>");

  return `<b>Today's suggested plan</b><br>${lines}<br><br>Use a 25-minute focus session for the first task, then take a short break.`;
}

function analyzeTasks() {
  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  if (!tasks.length) {
    return "You don't have any tasks yet. Add your first task and I’ll analyze your workload. 📝";
  }

  const priority = pending.length ? escapeHtml(pending[0].text) : "your next project milestone";
  return `<b>Task analysis</b><br>
    ✅ Completed: ${completed.length}<br>
    ⏳ Pending: ${pending.length}<br>
    🎯 Suggested next focus: <b>${priority}</b><br><br>
    Keep the next session small and specific.`;
}
function smartAiReply(text) {
  const input = normalize(text);
  const pending = tasks.filter(task => !task.done);
  const completed = tasks.filter(task => task.done);
  const name = localStorage.getItem(STORAGE.name) || "Naruto";
  const focusMinutes = Math.floor(focusSeconds / 60);

  // Focus
  if (/focus|what should|next|start/.test(input)) {
    if (!pending.length) {
      return `You're all caught up, ${escapeHtml(name)}! 🎉 Add a task and I'll help you choose what to focus on next.`;
    }

    return `
      <b>🎯 Focus on this next:</b><br><br>
      <b>${escapeHtml(pending[0].text)}</b><br><br>
      Start a 25-minute focus session and work only on this task.
    `;
  }

  // Motivation
  if (/motivat|lazy|tired|give up|can't|cant|demotiv/.test(input)) {
    return `
      You've already started, ${escapeHtml(name)}. 💪<br><br>
      Don't try to finish everything at once.
      Pick one small task, focus for 25 minutes,
      and build momentum from there. 🔥
    `;
  }

  // Day Plan
  if (/plan|schedule|day|today/.test(input)) {
    if (!pending.length) {
      return `
        Your task list is empty. 📝<br><br>
        Add 2–3 important tasks and your day plan can start from there.
      `;
    }

    const top = pending.slice(0, 4);

    const lines = top.map((task, i) =>
      `<b>${i + 1}.</b> ${escapeHtml(task.text)} — ${
        i === 0 ? "Start now 🎯" : "After the previous task"
      }`
    ).join("<br>");

    return `
      <b>📅 Today's plan</b><br><br>
      ${lines}<br><br>
      Use one 25-minute focus session per important task
      and take short breaks between sessions.
    `;
  }

  // Task Analysis
  if (/analy|task|workload|pending|completed|progress/.test(input)) {
    const priority = pending.length
      ? escapeHtml(pending[0].text)
      : "your next project milestone";

    return `
      <b>📊 Your productivity</b><br><br>
      ✅ Completed: ${completed.length}<br>
      ⏳ Pending: ${pending.length}<br>
      ⏱️ Focus time: ${focusMinutes} minutes<br>
      🎯 Daily goal: ${goal} tasks<br><br>
      <b>Suggested next focus:</b> ${priority}
    `;
  }

  // Greeting
  if (/hello|hi|hey|namaste/.test(input)) {
    return `
      Hey ${escapeHtml(name)}! 👋
      I'm NEXUS, your productivity assistant.<br><br>
      Ask me what to focus on, ask for a day plan,
      or ask me to analyze your tasks. 🚀
    `;
  }

  // Study Help
  if (/study|dbms|java|python|dsa|exam|college|bca|web technolog/.test(input)) {
    return `
      📚 <b>Study mode activated!</b><br><br>
      Break your study goal into a small task,
      start a 25-minute focus session,
      and avoid switching topics until the session ends. 🎯<br><br>
      <b>Your current pending tasks:</b> ${pending.length}
    `;
  }

  // Default
  return `
    <b>🤖 NEXUS suggestion</b><br><br>
    I can help you with your productivity using
    your current dashboard data.<br><br>

    Try asking:<br>
    • “What should I focus on?”<br>
    • “Plan my day”<br>
    • “Motivate me”<br>
    • “Analyze my tasks”
  `;
}


async function aiReply(type) {
  const prompts = {
    focus: "What should I focus on next?",
    motivate: "Motivate me",
    plan: "Plan my day",
    tasks: "Analyze my tasks"
  };

  const message =
    prompts[type] || "Help me with my productivity.";

  setAiMessage("🤔 Thinking...");

  const reply = smartAiReply(message);

  setAiMessage(reply);
}


async function askAi() {
  const input = $("aiInput");

  if (!input) return;

  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  setAiMessage("🤔 Thinking...");

  const reply = smartAiReply(text);

  setAiMessage(reply);

  input.value = "";
  input.focus();
}

async function aiReply(type) {
    const prompts = {
        focus: "What should I focus on next?",
        motivate: "Motivate me",
        plan: "Plan my day",
        tasks: "Analyze my tasks"
    };

    const message = prompts[type] || "Help me with my productivity.";

    setAiMessage("🤔 Thinking...");

    const reply = await smartAiReply(message);

    setAiMessage(reply);
}


async function askAi() {
    const input = $("aiInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) {
        input.focus();
        return;
    }

    setAiMessage("🤔 Thinking...");

    const reply = await smartAiReply(text);

    setAiMessage(reply);

    input.value = "";
    input.focus();
}

function askAi() {
  const input = $("aiInput");
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  setAiMessage(smartAiReply(text));
  input.value = "";
}

function addAiSuggestedTask() {
  const msg = $("aiMessage").innerText;
  const match = msg.match(/Study (.+?) as a task/i);
  if (match) {
    tasks.push({ text: `Study ${match[1]}`, done: false, created: Date.now() });
    saveTasks();
    renderTasks();
    updateStats();
    showToast("AI suggestion added as a task 🤖");
  }
}




safeOn("addTaskBtn", "click", addTask);
safeOn("taskInput", "keydown", e => {
  if (e.key === "Enter") addTask();
});
safeOn("startFocus", "click", toggleTimer);
safeOn("resetFocus", "click", resetTimer);

if ($("timerDuration")) {
  $("timerDuration").value = String(timerDuration);
  safeOn("timerDuration", "change", e => setTimerDuration(e.target.value));
}

safeOn("scheduleBtn", "click", openScheduleEditor);
safeOn("scheduleEditBtn", "click", openScheduleEditor);
safeOn("addScheduleItem", "click", addScheduleItem);
safeOn("saveSchedule", "click", saveScheduleChanges);

safeOn("themeBtn", "click", () => {
  const next = document.body.classList.contains("light") ? "dark" : "light";
  applyTheme(next);
  showToast(next === "light" ? "Light mode enabled ☀️" : "Dark mode enabled 🌙");
});

safeOn("notificationBtn", "click", () => openModal("notificationModal"));

safeOn("profileBtn", "click", () => {
  const nameInput = $("nameInput");
  if (nameInput) {
    nameInput.value = localStorage.getItem(STORAGE.name) || "Naruto";
  }
  openModal("profileModal");
});

safeOn("saveProfile", "click", () => {
  const input = $("nameInput");
  const name = input?.value.trim() || "Naruto";
  localStorage.setItem(STORAGE.name, name);
  updateDate();
  updateProfileAvatar();
  closeModal("profileModal");
  showToast("Profile updated 👤");
});

safeOn("profileImageInput", "change", event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem(STORAGE.profileImage, reader.result);
    updateProfileAvatar();
    showToast("Profile picture updated 🖼️");
  };
  reader.readAsDataURL(file);
});

safeOn("removeProfileImage", "click", () => {
  localStorage.removeItem(STORAGE.profileImage);
  const imageInput = $("profileImageInput");
  if (imageInput) imageInput.value = "";
  updateProfileAvatar();
  showToast("Profile picture removed");
});

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal(modal.id);
  });
});

document.querySelectorAll("[data-ai]").forEach(btn => {
  btn.addEventListener("click", () => aiReply(btn.dataset.ai));
});

const notesEl = $("notes");
if (notesEl) {
  notesEl.value = localStorage.getItem(STORAGE.notes) || "";
  notesEl.addEventListener("input", () => {
    localStorage.setItem(STORAGE.notes, notesEl.value);
    if ($("noteSaved")) $("noteSaved").textContent = "Saved";
  });
}

safeOn("newQuote", "click", () => {
  const quoteEl = $("quote");
  if (!quoteEl) return;

  const current = quoteEl.textContent.replace(/[“”]/g,"");
  let next = current;
  while (next === current) {
    next = quotes[Math.floor(Math.random() * quotes.length)];
  }
  quoteEl.textContent = `“${next}”`;
});

if ($("goalSelect")) {
  $("goalSelect").value = String(goal);
  if ($("goalText")) $("goalText").textContent = goal;

  safeOn("goalSelect", "change", () => {
    goal = Number($("goalSelect").value);
    localStorage.setItem(STORAGE.goal, String(goal));
    if ($("goalText")) $("goalText").textContent = goal;
    updateStats();
  });
}

updateStreak();
applyTheme(localStorage.getItem(STORAGE.theme) || "dark");
updateDate();
updateProfileAvatar();
renderSchedule();
updateTimer();
renderTasks();
updateStats();
setInterval(updateDate, 60000);

// ===== TIME-BASED GREETING =====
function updateGreeting() {
    const greetingEl = document.getElementById("greeting");
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = "Good evening";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
    }

    const savedName = localStorage.getItem(STORAGE.name) || "Naruto";
    greetingEl.textContent = `${greeting}, ${savedName} 👋`;
}

updateGreeting();
setInterval(updateGreeting, 60000);


// Add a small action when the assistant produces a concrete study suggestion.
safeOn("aiMessage", "dblclick", addAiSuggestedTask);

/* =========================================================
   NEXUS APP NAVIGATION / MULTI-SECTION UI
========================================================= */

function updateNavGlass(page) {
  const nav = $("bottomNav");
  const indicator = nav?.querySelector(".nav-glass-indicator");
  const items = nav ? Array.from(nav.querySelectorAll(".nav-item")) : [];
  const active = items.find((item) => item.dataset.page === page);

  if (!nav || !indicator || !active) return;

  const navRect = nav.getBoundingClientRect();
  const itemRect = active.getBoundingClientRect();
  indicator.style.width = `${itemRect.width}px`;
  indicator.style.transform = `translateX(${itemRect.left - navRect.left}px)`;
}

function openPage(page) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.toggle("active", section.dataset.page === page);
  });

  // Keep the compact 4-button navigation focused on the main destinations.
  // Related pages such as Schedule, Stats and Settings remain accessible from
  // the existing dashboard/settings controls without adding more bottom buttons.
  const navPage = page === "schedule" || page === "stats" || page === "settings" ? "dashboard" : page;

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === navPage);
  });

  updateNavGlass(navPage);

  if (page === "tasks") syncTaskPage();
  if (page === "schedule") syncSchedulePage();
  if (page === "stats") syncStatsPage();
  if (page === "settings") syncSettingsPage();
  if (page === "focus") syncDurationButtons();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item[data-page], [data-nav]").forEach((button) => {
  button.addEventListener("click", () => {
    const page = button.dataset.page || button.dataset.nav;
    if (page) openPage(page);
  });
});

function syncTaskPage() {
  const list = $("taskListPage");
  if (!list) return;

  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.done ? "done" : ""}`;
    li.innerHTML = `
      <input class="task-check" type="checkbox" ${task.done ? "checked" : ""}>
      <label>${escapeHtml(task.text)}</label>
      <button class="delete-btn" title="Delete task">×</button>
    `;

    li.querySelector(".task-check").addEventListener("change", () => {
      tasks[index].done = !tasks[index].done;
      saveTasks();
      renderTasks();
      syncTaskPage();
      updateStats();
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
      syncTaskPage();
      updateStats();
      showToast("Task deleted");
    });

    list.appendChild(li);
  });

  const empty = $("taskEmptyPage");
  if (empty) empty.style.display = tasks.length ? "none" : "block";
  document.querySelectorAll("#taskCount").forEach((el) => {
    el.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  });
}


/* ===== TASK FILTERS ===== */
let activeTaskFilter = "all";

function syncTaskFilterButtons() {
  document.querySelectorAll(".task-filters .filter").forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    const filter = label === "pending" ? "pending" : label === "completed" ? "completed" : "all";
    button.classList.toggle("active", filter === activeTaskFilter);
  });
}

function syncTaskPageFiltered() {
  const list = $("taskListPage");
  if (!list) return;

  const filtered = tasks.filter((task) => {
    if (activeTaskFilter === "pending") return !task.done;
    if (activeTaskFilter === "completed") return task.done;
    return true;
  });

  list.innerHTML = "";

  filtered.forEach((task) => {
    const originalIndex = tasks.indexOf(task);
    const li = document.createElement("li");
    li.className = `task-item ${task.done ? "done" : ""}`;
    li.innerHTML = `
      <input class="task-check" type="checkbox" ${task.done ? "checked" : ""} aria-label="Complete task">
      <label>${escapeHtml(task.text)}</label>
      <button class="delete-btn" title="Delete task">×</button>
    `;

    li.querySelector(".task-check").addEventListener("change", () => {
      tasks[originalIndex].done = !tasks[originalIndex].done;
      saveTasks();
      renderTasks();
      syncTaskPageFiltered();
      updateStats();
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      tasks.splice(originalIndex, 1);
      saveTasks();
      renderTasks();
      syncTaskPageFiltered();
      updateStats();
      showToast("Task deleted");
    });

    list.appendChild(li);
  });

  const empty = $("taskEmptyPage");
  if (empty) {
    empty.style.display = filtered.length ? "none" : "block";
    empty.textContent =
      activeTaskFilter === "pending" ? "No pending tasks 🎯" :
      activeTaskFilter === "completed" ? "No completed tasks yet." :
      "No tasks yet. Add your first task 🚀";
  }

  document.querySelectorAll("#taskCount").forEach((el) => {
    el.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  });

  syncTaskFilterButtons();
}

document.querySelectorAll(".task-filters .filter").forEach((button) => {
  button.addEventListener("click", () => {
    const label = button.textContent.trim().toLowerCase();
    activeTaskFilter =
      label === "pending" ? "pending" :
      label === "completed" ? "completed" : "all";
    syncTaskPageFiltered();
  });
});

const originalSyncTaskPage = syncTaskPage;
syncTaskPage = function () {
  originalSyncTaskPage();
  syncTaskPageFiltered();
};

const taskPageInput = $("taskInputPage");
const taskPageButton = $("addTaskPage");

function addTaskFromPage() {
  if (!taskPageInput) return;
  const text = taskPageInput.value.trim();
  if (!text) return;
  tasks.push({ text, done: false, created: Date.now() });
  taskPageInput.value = "";
  saveTasks(); renderTasks(); syncTaskPage(); updateStats();
  showToast("Task added 🚀");
}
if (taskPageButton) taskPageButton.addEventListener("click", addTaskFromPage);
if (taskPageInput) taskPageInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTaskFromPage(); });

function syncSchedulePage() {
  const pageList = $("scheduleListPage");
  if (!pageList) return;
  pageList.innerHTML = scheduleItems.length ? scheduleItems.map((item) => `
    <div class="schedule-item"><span class="time">${escapeHtml(item.time)}</span><span>${escapeHtml(item.text)}</span></div>`).join("") : `<div class="schedule-empty">No schedule added yet.</div>`;
}

function syncStatsPage() {
  if ($("completedStats")) $("completedStats").textContent = tasks.filter(t => t.done).length;
  if ($("focusStats")) $("focusStats").textContent = `${Math.floor(focusSeconds / 60)}m`;
  if ($("streakStats")) $("streakStats").textContent = streak;
  if ($("goalTextStats")) $("goalTextStats").textContent = goal;
  renderBars();
}

function syncSettingsPage() {
  const name = localStorage.getItem(STORAGE.name) || "Naruto";
  if ($("settingsName")) $("settingsName").textContent = name;
  const source = localStorage.getItem(STORAGE.profileImage);
  const avatar = $("settingsAvatar");
  if (avatar) {
    if (source) { avatar.innerHTML = `<img src="${source}" alt="Profile picture">`; avatar.classList.add("has-image"); }
    else { avatar.textContent = name.charAt(0).toUpperCase(); avatar.classList.remove("has-image"); }
  }
}

function syncDurationButtons() {
  document.querySelectorAll("[data-duration]").forEach((button) => button.classList.toggle("selected", Number(button.dataset.duration) === timerDuration));
}
document.querySelectorAll("[data-duration]").forEach((button) => {
  button.addEventListener("click", () => { setTimerDuration(Number(button.dataset.duration)); if ($("timerDuration")) $("timerDuration").value = String(timerDuration); syncDurationButtons(); });
});

if ($("aiSendPage")) $("aiSendPage").addEventListener("click", () => {
  const input = $("aiInputPage"); if (!input || !input.value.trim()) return;
  if ($("aiMessagePage")) $("aiMessagePage").innerHTML = smartAiReply(input.value.trim());
  input.value = "";
});
if ($("aiInputPage")) $("aiInputPage").addEventListener("keydown", (e) => { if (e.key === "Enter") $("aiSendPage")?.click(); });
document.querySelectorAll('.ai-page-card [data-ai]').forEach((button) => button.addEventListener("click", () => { if ($("aiMessagePage")) $("aiMessagePage").innerHTML = smartAiReply(button.dataset.ai); }));

if ($("settingsProfileBtn")) $("settingsProfileBtn").addEventListener("click", () => { if ($("nameInput")) $("nameInput").value = localStorage.getItem(STORAGE.name) || "Naruto"; openModal("profileModal"); });
if ($("settingsThemeBtn")) $("settingsThemeBtn").addEventListener("click", () => { const next = document.body.classList.contains("light") ? "dark" : "light"; applyTheme(next); syncSettingsPage(); });
if ($("settingsNotificationBtn")) $("settingsNotificationBtn").addEventListener("click", () => openModal("notificationModal"));

const originalUpdateProfileAvatar = updateProfileAvatar;
updateProfileAvatar = function() { originalUpdateProfileAvatar(); syncSettingsPage(); };

syncTaskPage();
syncSchedulePage();
syncStatsPage();
syncSettingsPage();
syncDurationButtons();
updateNavGlass("dashboard");
window.addEventListener("resize", () => {
  const active = document.querySelector(".nav-item.active");
  if (active) updateNavGlass(active.dataset.page);
});
/* ==========================================
   NEXUS Native Navigation Polish
   ========================================== */

(function () {
  const pageSections = document.querySelectorAll(".page-section");
  const navItems = document.querySelectorAll(".nav-item[data-page]");

  function addPageTransition() {
    pageSections.forEach((page) => {
      page.addEventListener("animationend", () => {
        page.classList.remove("nexus-page-enter");
      });
    });
  }

  function polishNavigation() {
    navItems.forEach((item) => {
      item.addEventListener("pointerdown", () => {
        item.classList.add("nexus-nav-press");
      });

      item.addEventListener("pointerup", () => {
        setTimeout(() => {
          item.classList.remove("nexus-nav-press");
        }, 120);
      });

      item.addEventListener("pointercancel", () => {
        item.classList.remove("nexus-nav-press");
      });
    });
  }

  addPageTransition();
  polishNavigation();
})();
/* ==========================================
   NEXUS Splash Screen Controller
   ========================================== */

window.addEventListener("load", () => {
  const splash = document.getElementById("nexusSplash");

  if (!splash) return;

  setTimeout(() => {
    splash.classList.add("is-hidden");

    setTimeout(() => {
      splash.remove();
    }, 600);
  }, 1200);
});

/* =========================================================
   NEXUS SETTINGS + LOGOUT — FINAL STABLE HANDLERS
   ========================================================= */

// Open the Settings page from the top-right gear button.
safeOn("nexusSettingsBtn", "click", () => {
  openPage("settings");
});

// Logout from Settings. Firebase Auth owns the actual sign-out.
safeOn("settingsLogoutBtn", "click", async () => {
  const button = $("settingsLogoutBtn");
  if (button) button.disabled = true;

  try {
    if (typeof window.nexusLogout === "function") {
      await window.nexusLogout();
    } else {
      console.error("NEXUS: Firebase logout function is not available.");
      showToast("Logout service is not ready. Please refresh and try again.");
      if (button) button.disabled = false;
    }
  } catch (error) {
    console.error("NEXUS: Logout failed:", error);
    showToast("Logout failed. Please try again.");
    if (button) button.disabled = false;
  }
});
