require("dotenv").config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  mongoUri: process.env.MONGODB_URI,
  prefix: process.env.PREFIX || "!",
  ownerId: process.env.OWNER_ID,
  guildId: process.env.GUILD_ID,

  colors: {
    primary: 0x8b0000,
    secondary: 0xff1493,
    accent: 0x6a0dad,
    success: 0x00ff88,
    error: 0xff0000,
    warning: 0xff8800,
    info: 0x00bfff,
    dark: 0x0d0d0d,
  },

  emojis: {
    heart: "❤️",
    star: "⭐",
    crown: "👑",
    fire: "🔥",
    gem: "💎",
    money: "💰",
    lock: "🔒",
    unlock: "🔓",
    ticket: "🎫",
    check: "✅",
    cross: "❌",
    warning: "⚠️",
    loading: "⏳",
    ring: "💍",
    baby: "👶",
    house: "🏠",
    chain: "⛓️",
    dark: "🖤",
    pink: "🌸",
    game: "🎮",
    duo: "🎯",
    love: "💘",
  },

  cooldowns: {
    default: 3,
    economy: 5,
    daily: 86400,
    work: 3600,
    crime: 1800,
    dating: 30,
    command: 3,
  },

  economy: {
    dailyReward: 500,
    workMin: 100,
    workMax: 300,
    crimeMin: 50,
    crimeMax: 800,
    crimeFail: 0.35,
    startBalance: 1000,
  },

  tickets: {
    maxPerUser: 3,
    autoCloseMinutes: 1440,
  },

  privateCall: {
    deleteAfterMinutes: 5,
    maxUsers: 10,
  },

  dating: {
    maxAge: 99,
    minAge: 18,
  },

  staffRoles: process.env.STAFF_ROLES
    ? process.env.STAFF_ROLES.split(",")
    : [],
  adminRoles: process.env.ADMIN_ROLES
    ? process.env.ADMIN_ROLES.split(",")
    : [],

  channels: {
    logs: process.env.LOG_CHANNEL,
    modLogs: process.env.MOD_LOG_CHANNEL,
    welcome: process.env.WELCOME_CHANNEL,
    dating: process.env.DATING_CHANNEL,
    duo: process.env.DUO_CHANNEL,
    darkLove: process.env.DARK_LOVE_CHANNEL,
    confessions: process.env.CONFESSIONS_CHANNEL,
    rankings: process.env.RANKINGS_CHANNEL,
  },

  categories: {
    tickets: process.env.TICKET_CATEGORY,
    privateCalls: process.env.PRIVATE_CALL_CATEGORY,
  },
};
