const JsonDB = require("../utils/JsonDB");

const db = new JsonDB("users");

const defaultUser = (userId, guildId, username) => ({
  userId,
  guildId,
  username: username || "",
  profile: { bio: "", age: 0, gender: "", location: "", photo: "", personality: "", hobbies: [], favoriteGame: "", badges: [], reputation: 0 },
  economy: { wallet: 1000, bank: 0, totalEarned: 0, lastDaily: null, lastWork: null, lastCrime: null },
  inventory: [],
  house: { level: 0, name: "", furniture: [], value: 0 },
  relationship: { status: "single", partnerId: null, partnerName: "", marriedAt: null, children: [] },
  social: { xp: 0, level: 1, messages: 0, voiceMinutes: 0 },
  darkLove: { role: "none", coleira: null, coleiradoAt: null },
  dating: { active: false, profileData: {}, matches: [] },
  duo: { active: false, profileData: {} },
  punishments: [],
  warnings: [],
});

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
    return user;
  },
};

module.exports = User;
