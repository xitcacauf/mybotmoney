const config = require("../config/config");
const logger = require("../utils/logger");
const { checkCooldown } = require("../utils/cooldown");
const { checkPermission } = require("../utils/permissions");
const { errorEmbed, warningEmbed } = require("../utils/embed");
const AntiSpamSystem = require("../systems/AntiSpam");
const User = require("../models/User");

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    try {
      await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

      const spamResult = await AntiSpamSystem.check(message, client);
      if (spamResult) return;

      const prefix = config.prefix;

      if (!message.content.startsWith(prefix)) {
        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          { $inc: { "social.messages": 1, "social.xp": 2 } }
        );
        return;
      }

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

      await command.execute(message, args, client);
    } catch (err) {
      logger.error(`Erro no messageCreate [${message.content?.slice(0, 30)}]: ${err.message}`);
      message
        .reply({ embeds: [errorEmbed("Erro Interno", "Ocorreu um erro ao executar o comando.")] })
        .catch(() => {});
    }
  },
};
