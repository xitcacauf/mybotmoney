const JsonDB = require("../utils/JsonDB");

const db = new JsonDB("guildconfigs");

const defaultConfig = (guildId) => ({
  guildId,
  prefix: "!",
  welcome: { enabled: false, channelId: null, message: "Bem-vindo(a) ao servidor, {user}!", imageEnabled: false, roleId: null },
  moderation: { logChannelId: null, modLogChannelId: null, antiSpam: true, antiLink: false, antiRaid: true, maxWarnings: 3, antiFlood: true },
  tickets: { enabled: false, categoryId: null, staffRoleId: null, panelChannelId: null, panelMessageId: null, count: 0 },
  privateCalls: { enabled: false, categoryId: null, joinChannelId: null },
  dating: { enabled: false, channelId: null, allowedGenders: [] },
  economy: { enabled: true, currency: "💰", currencyName: "Moedas" },
  roles: { memberRoleId: null, boosterRoleId: null },
  antiNuke: { enabled: true, maxChannelDeletes: 3, maxBans: 5, punishAction: "ban" },
});

const GuildConfig = {
  async findOne(query) { return db.findOne(query); },
  async findOneAndUpdate(query, update, options = {}) {
    return db.findOneAndUpdate(query, update, { ...options, upsert: true });
  },
  async findOrCreate(guildId) {
    let config = await db.findOne({ guildId });
    if (!config) config = await db.create(defaultConfig(guildId));
    return config;
  },
};

module.exports = GuildConfig;
