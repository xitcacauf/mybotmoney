const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "ranking",
  aliases: ["top", "leaderboard", "rank"],
  description: "Rankings do servidor. Ex: !ranking [ricos|xp|casais]",
  cooldown: 10,
  async execute(message, args, client) {
    const type = args[0]?.toLowerCase() || "ricos";

    let users, title, mapFn;

    if (type === "xp" || type === "nivel") {
      users = await User.find({ guildId: message.guild.id }).sort({ "social.xp": -1 }).limit(10);
      title = "⭐ Top XP";
      mapFn = (u, i) => `**${i + 1}.** <@${u.userId}> — Nível **${u.social.level}** (${u.social.xp} XP)`;
    } else if (type === "msgs" || type === "mensagens") {
      users = await User.find({ guildId: message.guild.id }).sort({ "social.messages": -1 }).limit(10);
      title = "💬 Top Mensagens";
      mapFn = (u, i) => `**${i + 1}.** <@${u.userId}> — **${u.social.messages.toLocaleString("pt-BR")}** msgs`;
    } else {
      users = await User.find({ guildId: message.guild.id }).sort({ "economy.wallet": -1 }).limit(10);
      title = "💰 Top Mais Ricos";
      mapFn = (u, i) => `**${i + 1}.** <@${u.userId}> — **${(u.economy.wallet + u.economy.bank).toLocaleString("pt-BR")}** 💰`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(title)
      .setDescription(users.length ? users.map(mapFn).join("\n") : "Nenhum dado ainda.")
      .setFooter({ text: `Use !ranking ricos | xp | mensagens` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
