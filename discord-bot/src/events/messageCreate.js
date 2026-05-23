const config = require("../config/config");
const logger = require("../utils/logger");
const { checkCooldown } = require("../utils/cooldown");
const { checkPermission } = require("../utils/permissions");
const { errorEmbed, warningEmbed } = require("../utils/embed");
const AntiSpamSystem = require("../systems/AntiSpam");
const User = require("../models/User");
const { checkLevelUp } = require("../systems/LevelSystem");
const { addBondXP } = require("../systems/ObsessionSystem");
const { addHeat } = require("../systems/SocialHeat");
const { isEventActive } = require("../systems/EventSystem");

const processedMessages = new Set();
const recentChannelUsers = new Map();

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const prefix = config.prefix;
    const isCommand = message.content.startsWith(prefix);

    try {
      await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

      const spamResult = await AntiSpamSystem.check(message, client);
      if (spamResult) return;

      if (!isCommand) {
        let xpGain = 2;
        if (isEventActive("bonus_xp")) xpGain = 6;

        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          {
            $inc: { "social.messages": 1, "social.xp": xpGain },
            $set: { "social.lastSeen": new Date().toISOString() },
          }
        );

        // Verificar level up
        await checkLevelUp(message.author.id, message.guild.id, message.channel).catch(() => {});

        // Calor social
        await addHeat(message.guild.id, 1).catch(() => {});

        // Rastrear vínculo com outros usuários ativos no canal
        const chId = message.channel.id;
        if (!recentChannelUsers.has(chId)) recentChannelUsers.set(chId, new Map());
        const chUsers = recentChannelUsers.get(chId);

        for (const [uid, ts] of chUsers.entries()) {
          if (uid !== message.author.id && Date.now() - ts < 300000) {
            await addBondXP(message.author.id, message.guild.id, uid, 0.5).catch(() => {});
          }
        }
        chUsers.set(message.author.id, Date.now());

        if (chUsers.size > 20) {
          for (const [uid, ts] of chUsers.entries()) {
            if (Date.now() - ts > 300000) chUsers.delete(uid);
          }
        }

        return;
      }
    } catch (err) {
      logger.error(`Erro no sistema de XP/antispam: ${err.message}`);
      if (!isCommand) return;
    }

    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 10000);

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.staffOnly && !checkPermission(message, "staff")) {
      return message
        .reply({ embeds: [errorEmbed("Sem Permissão", "Você não tem permissão para usar este comando.")] })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    if (command.adminOnly && !checkPermission(message, "admin")) {
      return message
        .reply({ embeds: [errorEmbed("Sem Permissão", "Apenas administradores podem usar este comando.")] })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    if (command.ownerOnly && !checkPermission(message, "owner")) {
      return message
        .reply({ embeds: [errorEmbed("Sem Permissão", "Apenas o dono pode usar este comando.")] })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const cooldownSecs = command.cooldown || config.cooldowns.default;
    const cd = checkCooldown(message.author.id, command.name, cooldownSecs);
    if (cd.onCooldown) {
      return message
        .reply({ embeds: [warningEmbed("Cooldown", `Aguarde **${cd.timeLeft}s** antes de usar este comando novamente.`)] })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 4000));
    }

    try {
      await command.execute(message, args, client);
    } catch (err) {
      logger.error(`Erro no comando [${commandName}]: ${err.message}\n${err.stack}`);
      message
        .reply({ embeds: [errorEmbed("Erro Interno", "Ocorreu um erro ao executar o comando.")] })
        .catch(() => {});
    }
  },
};
