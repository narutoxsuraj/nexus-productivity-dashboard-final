import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set. NEXUS will use its browser-side fallback until configured.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

app.post("/api/ai", async (req, res) => {
  try {
    const { message, profile = {} } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Please enter a message." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OPENAI_API_KEY is not configured. Add it to .env and restart NEXUS."
      });
    }

    const safeProfile = {
      name: String(profile.name || "Naruto").slice(0, 80),
      goal: Number(profile.goal || 4),
      focusMinutes: Number(profile.focusMinutes || 0),
      pendingTasks: Array.isArray(profile.pendingTasks) ? profile.pendingTasks.slice(0, 20) : [],
      completedTasks: Array.isArray(profile.completedTasks) ? profile.completedTasks.slice(0, 20) : [],
      notes: String(profile.notes || "").slice(0, 4000)
    };

    const context = `
User name: ${safeProfile.name}
Daily task goal: ${safeProfile.goal}
Focus minutes completed: ${safeProfile.focusMinutes}
Pending tasks: ${safeProfile.pendingTasks.join(" | ") || "None"}
Completed tasks: ${safeProfile.completedTasks.join(" | ") || "None"}
Notes: ${safeProfile.notes || "None"}
`;

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: `You are NEXUS, a friendly productivity assistant inside a personal dashboard.
Give practical, concise answers. Use the user's task/notes context when useful.
Do not pretend to have access to anything outside the context provided.
If making a plan, keep it realistic and prioritize 1-3 important actions.
Use simple English with occasional emojis. Do not be overly verbose.

Dashboard context:
${context}`,
      input: message
    });

    res.json({ reply: response.output_text });
  } catch (error) {
    console.error("NEXUS AI error:", error);
    res.status(500).json({
      error: "AI request failed. Check your API key, billing, internet connection, and server terminal."
    });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`🚀 NEXUS is running at http://127.0.0.1:${port}`);
});
