const mongoose = require("mongoose");

const guildConfigSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true },

    prefix: { type: String, default: "!" },

    welcome: {
      enabled: { type: Boolean, default: false },
      channelId: String,
      message: { type: String, default: "Bem-vindo(a) ao servidor, {user}!" },
      imageEnabled: { type: Boolean, default: false },
      roleId: String,
    },

    moderation: {
      logChannelId: String,
      modLogChannelId: String,
      antiSpam: { type: Boolean, default: true },
      antiLink: { type: Boolean, default: false },
      antiRaid: { type: Boolean, default: true },
      maxWarnings: { type: Number, default: 3 },
      antiFlood: { type: Boolean, default: true },
    },

    tickets: {
      enabled: { type: Boolean, default: false },
      categoryId: String,
      staffRoleId: String,
      panelChannelId: String,
      panelMessageId: String,
      count: { type: Number, default: 0 },
    },

    privateCalls: {
      enabled: { type: Boolean, default: false },
      categoryId: String,
      joinChannelId: String,
    },

    dating: {
      enabled: { type: Boolean, default: false },
      channelId: String,
      allowedGenders: [String],
    },

    economy: {
      enabled: { type: Boolean, default: true },
      currency: { type: String, default: "💰" },
      currencyName: { type: String, default: "Moedas" },
    },

    roles: {
      memberRoleId: String,
      boosterRoleId: String,
      dominanteRoleId: String,
      submissoRoleId: String,
    },

    antiNuke: {
      enabled: { type: Boolean, default: true },
      maxChannelDeletes: { type: Number, default: 3 },
      maxBans: { type: Number, default: 5 },
      punishAction: { type: String, default: "ban" },
    },
  },
  { timestamps: true }
);

guildConfigSchema.statics.findOrCreate = async function (guildId) {
  let config = await this.findOne({ guildId });
  if (!config) {
    config = await this.create({ guildId });
  }
  return config;
};

module.exports = mongoose.model("GuildConfig", guildConfigSchema);
