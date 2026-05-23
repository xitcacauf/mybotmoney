const JsonDB = require("../utils/JsonDB");

const db = new JsonDB("users");

const defaultUser = (userId, guildId, username) => ({
  userId,
  guildId,
  username: username || "",
  profile: {
    bio: "",
    age: 0,
    gender: "",
    location: "",
    photo: "",
    personality: "",
    hobbies: [],
    favoriteGame: "",
    badges: [],
    reputation: 0,
    archetype: "misterioso",
    aura: "comum",
    auraExpiry: null,
    eliteTitle: null,
    eliteTitleExpiry: null,
    lastPost: null,
    _lastArchetypeChange: null,
    psychProfile: { loneliness: 50, popularity: 50, activityLevel: 0, lastAnalyzed: null },
  },
  economy: {
    wallet: 1000,
    bank: 0,
    totalEarned: 0,
    lastDaily: null,
    lastWork: null,
    lastCrime: null,
    lastInterest: null,
    streak: 0,
    invested: 0,
    investedAt: null,
    investmentType: null,
  },
  inventory: [],
  house: {
    level: 0,
    name: "",
    furniture: [],
    value: 0,
    description: "",
    theme: "default",
    visitors: 0,
    decorations: [],
    musicPlaylist: "",
  },
  relationship: {
    status: "single",
    partnerId: null,
    partnerName: "",
    marriedAt: null,
    children: [],
    stage: "none",
    stageStartedAt: null,
    obsessionLevel: 0,
    bondXP: 0,
    memories: [],
    anniversary: null,
  },
  social: { xp: 0, level: 1, messages: 0, voiceMinutes: 0, lastSeen: null, socialHeat: 0 },
  darkLove: {
    role: "none",
    coleira: null,
    coleiradoAt: null,
    contractWith: null,
    contractType: null,
    contractTerms: null,
    trustLevel: 0,
    tasksCompleted: 0,
    punishments: 0,
  },
  dating: { active: false, profileData: {}, matches: [] },
  duo: { active: false, profileData: {} },
  pet: {
    adopted: false,
    name: "",
    type: "",
    emoji: "",
    hunger: 100,
    happiness: 100,
    lastCare: null,
    adoptedAt: null,
  },
  punishments: [],
  warnings: [],
  bonds: {},
  secretAdmiring: null,
  secretAdmirers: [],
  rpg: { charm: 10, manipulation: 5, seduction: 5, intelligence: 10, dominance: 5, carencia: 5 },
});

const ensureFields = (user) => {
  if (!user.bonds) user.bonds = {};
  if (!user.rpg) user.rpg = { charm: 10, manipulation: 5, seduction: 5, intelligence: 10, dominance: 5, carencia: 5 };
  if (!user.darkLove) user.darkLove = { role: "none", coleira: null, coleiradoAt: null, contractWith: null, contractType: null, contractTerms: null, trustLevel: 0, tasksCompleted: 0, punishments: 0 };
  if (user.darkLove && user.darkLove.contractWith === undefined) { user.darkLove.contractWith = null; user.darkLove.contractType = null; user.darkLove.contractTerms = null; }
  if (!user.profile) user.profile = {};
  if (user.profile.archetype === undefined) user.profile.archetype = "misterioso";
  if (user.profile.aura === undefined) user.profile.aura = "comum";
  if (user.profile.auraExpiry === undefined) user.profile.auraExpiry = null;
  if (user.profile.eliteTitle === undefined) user.profile.eliteTitle = null;
  if (user.profile.eliteTitleExpiry === undefined) user.profile.eliteTitleExpiry = null;
  if (user.profile._lastArchetypeChange === undefined) user.profile._lastArchetypeChange = null;
  if (user.profile.lastPost === undefined) user.profile.lastPost = null;
  if (!user.profile.psychProfile) user.profile.psychProfile = { loneliness: 50, popularity: 50, activityLevel: 0, lastAnalyzed: null };
  if (user.secretAdmiring === undefined) user.secretAdmiring = null;
  if (!user.secretAdmirers) user.secretAdmirers = [];
  if (!user.relationship.memories) user.relationship.memories = [];
  if (user.relationship.stage === undefined) user.relationship.stage = user.relationship.status === "married" ? "casado" : user.relationship.status === "dating" ? "namorando" : "none";
  if (user.relationship.children === undefined) user.relationship.children = [];
  if (!user.economy.lastInterest) user.economy.lastInterest = null;
  if (user.economy.streak === undefined) user.economy.streak = 0;
  if (user.economy.invested === undefined) user.economy.invested = 0;
  if (user.economy.totalEarned === undefined) user.economy.totalEarned = 0;
  if (!user.economy.ledger) user.economy.ledger = [];
  if (user.economy.activeInvestment === undefined) user.economy.activeInvestment = null;
  if (!user.house.description) user.house.description = "";
  if (!user.social.lastSeen) user.social.lastSeen = null;
  if (!user.inventory) user.inventory = [];
  return user;
};

const User = {
  async findOne(query) { return db.findOne(query); },
  find(query) { return db.find(query); },
  async create(data) { return db.create(data); },
  async findOneAndUpdate(query, update, options = {}) {
    return db.findOneAndUpdate(query, update, options);
  },
  async findOrCreate(userId, guildId, username) {
    let user = await db.findOne({ userId, guildId });
    if (!user) user = await db.create(defaultUser(userId, guildId, username));
    return ensureFields(user);
  },
};

module.exports = User;
