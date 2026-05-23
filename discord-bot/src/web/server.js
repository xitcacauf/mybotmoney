const express = require("express");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

const DATA_DIR = path.join(__dirname, "../../data");
const PUBLIC_DIR = path.join(__dirname, "public");

const WEB_PORT = process.env.WEB_PORT || 3000;
const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}:${WEB_PORT}`
  : `http://localhost:${WEB_PORT}`;

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
      card,
      ledger: (user.economy?.ledger || []).slice().reverse().slice(0, 20),
      activeInvestment: user.economy?.activeInvestment || null,
      house: user.house || {},
      relationship: user.relationship || {},
      social: user.social || {},
      profile: { archetype: user.profile?.archetype, aura: user.profile?.aura, badges: user.profile?.badges || [] },
      inventory: user.inventory || [],
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
    logger.info(`🌐 Bank UI online: ${BASE_URL}`);
  });

  return { BASE_URL };
}

module.exports = { startWebServer, BASE_URL };
