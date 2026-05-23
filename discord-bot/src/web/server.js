const express = require("express");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

const DATA_DIR = path.join(__dirname, "../../data");
const PUBLIC_DIR = path.join(__dirname, "public");

const WEB_PORT = process.env.WEB_PORT || 3000;

function readDB(name) {
  try {
    const fp = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(fp)) return [];
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch { return []; }
}

function getUser(userId, guildId) {
  const users = readDB("users");
  return users.find((u) => u.userId === userId && u.guildId === guildId) || null;
}

function getAllUsers(guildId) {
  const users = readDB("users");
  return guildId ? users.filter((u) => u.guildId === guildId) : users;
}

const cardTiers = [
  { name: "Black Elite",  min: 100000, color: "#1a1a2e", glow: "#c9a000", icon: "⚫" },
  { name: "Dominador",    min: 50000,  color: "#16004a", glow: "#9b59b6", icon: "💜" },
  { name: "Luxúria",     min: 25000,  color: "#2d0000", glow: "#e74c3c", icon: "🔴" },
  { name: "Neon",         min: 10000,  color: "#0d001a", glow: "#a855f7", icon: "🟣" },
  { name: "Standard",     min: 0,      color: "#001a0a", glow: "#27ae60", icon: "🟢" },
];

function getCard(total) {
  return cardTiers.find((c) => total >= c.min) || cardTiers[cardTiers.length - 1];
}

function startWebServer(client) {
  const app = express();
  app.use(express.json());
  app.use(express.static(PUBLIC_DIR));

  // ── API: dados de um usuário ────────────────────────────────────────────────
  app.get("/api/user/:userId", (req, res) => {
    const { userId } = req.params;
    const guildId = req.query.guildId || req.query.g;
    const user = getUser(userId, guildId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const wallet = user.economy?.wallet || 0;
    const bank   = user.economy?.bank   || 0;
    const total  = wallet + bank;
    const card   = getCard(total);

    res.json({
      userId: user.userId,
      username: user.username,
      wallet, bank, total,
      totalEarned: user.economy?.totalEarned || 0,
      streak: user.economy?.streak || 0,
      lastDaily: user.economy?.lastDaily || null,
      lastWork: user.economy?.lastWork || null,
      card,
      ledger: (user.economy?.ledger || []).slice().reverse().slice(0, 20),
      activeInvestment: user.economy?.activeInvestment || null,
      house: user.house || {},
      relationship: user.relationship || {},
      social: user.social || {},
      profile: {
        bio: user.profile?.bio || "",
        age: user.profile?.age || 0,
        gender: user.profile?.gender || "",
        location: user.profile?.location || "",
        photo: user.profile?.photo || "",
        archetype: user.profile?.archetype || "misterioso",
        aura: user.profile?.aura || "comum",
        auraExpiry: user.profile?.auraExpiry || null,
        eliteTitle: user.profile?.eliteTitle || null,
        eliteTitleExpiry: user.profile?.eliteTitleExpiry || null,
        reputation: user.profile?.reputation || 0,
        hobbies: user.profile?.hobbies || [],
        favoriteGame: user.profile?.favoriteGame || "",
        badges: user.profile?.badges || [],
        psychProfile: user.profile?.psychProfile || { loneliness: 50, popularity: 50, activityLevel: 0 },
      },
      rpg: user.rpg || { charm: 10, manipulation: 5, seduction: 5, intelligence: 10, dominance: 5, carencia: 5 },
      darkLove: user.darkLove || { role: "none" },
      pet: user.pet || { adopted: false },
      duo: user.duo || { active: false },
      dating: { active: user.dating?.active || false, matchCount: (user.dating?.matches || []).length },
      inventory: user.inventory || [],
      warnings: (user.warnings || []).length,
      punishments: (user.punishments || []).length,
    });
  });

  // ── API: ranking global ─────────────────────────────────────────────────────
  app.get("/api/ranking/:guildId", (req, res) => {
    const users = getAllUsers(req.params.guildId);
    const ranked = users
      .map((u) => ({
        userId: u.userId,
        username: u.username,
        total: (u.economy?.wallet || 0) + (u.economy?.bank || 0),
        card: getCard((u.economy?.wallet || 0) + (u.economy?.bank || 0)),
        level: u.social?.level || 1,
        archetype: u.profile?.archetype || "misterioso",
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
    res.json(ranked);
  });

  // ── Página Bank UI ──────────────────────────────────────────────────────────
  app.get("/bank/:userId", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  app.get("/ranking/:guildId", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  app.get("/", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  app.listen(WEB_PORT, "0.0.0.0", () => {
    logger.info("🌐 Bank UI online!");
  });

  return app;
}

module.exports = { startWebServer };
