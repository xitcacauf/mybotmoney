const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "ranking",
  aliases: ["top", "leaderboard"],
  description: "Rankings do servidor. Ex: !ranking [ricos|xp|msgs|casais|ativos]",
  cooldown: 10,
  async execute(message, args, client) {
    const type = args[0]?.toLowerCase() || "ricos";

    let users, title, mapFn;

    if (type === "xp" || type === "nivel") {
      users = await User.find({ guildId: message.guild.id }).sort({ "social.xp": -1 }).limit(10);
      title = "⭐ Top XP do Servidor";
      mapFn = (u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
        return `${medal} <@${u.userId}> — Nível **${u.social?.level || 1}** (${(u.social?.xp || 0).toLocaleString("pt-BR")} XP)`;
      };
    } else if (type === "msgs" || type === "mensagens") {
      users = await User.find({ guildId: message.guild.id }).sort({ "social.messages": -1 }).limit(10);
      title = "💬 Top Mensagens";
      mapFn = (u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
        return `${medal} <@${u.userId}> — **${(u.social?.messages || 0).toLocaleString("pt-BR")}** msgs`;
      };
    } else if (type === "casais" || type === "relacionamentos") {
      users = await User.find({ guildId: message.guild.id, "relationship.status": { $in: ["married"] } }).limit(20);
      const couples = [];
      const seen = new Set();
      for (const u of (users._results || [])) {
        if (u.relationship?.partnerId && !seen.has(u.userId) && !seen.has(u.relationship.partnerId)) {
          seen.add(u.userId);
          seen.add(u.relationship.partnerId);
          const marriedAt = u.relationship.marriedAt;
          const days = marriedAt ? Math.floor((Date.now() - new Date(marriedAt).getTime()) / 86400000) : 0;
          couples.push({ uid: u.userId, partnerId: u.relationship.partnerId, days, stage: u.relationship.stage || "casado" });
        }
      }
      couples.sort((a, b) => b.days - a.days);

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💑 Top Casais do Servidor")
        .setDescription(
          couples.length
            ? couples.slice(0, 8).map((c, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
                return `${medal} <@${c.uid}> ❤️ <@${c.partnerId}> — **${c.days} dia(s)** juntos`;
              }).join("\n")
            : "Nenhum casal casado ainda."
        )
        .setFooter({ text: "Use !ranking ricos | xp | msgs | casais | ativos" })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    } else if (type === "ativos" || type === "atividade") {
      users = await User.find({ guildId: message.guild.id }).sort({ "social.voiceMinutes": -1 }).limit(10);
      title = "🎙️ Top Minutos em Call";
      mapFn = (u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
        const mins = u.social?.voiceMinutes || 0;
        const hours = Math.floor(mins / 60);
        return `${medal} <@${u.userId}> — **${hours}h ${mins % 60}m** em call`;
      };
    } else {
      // Default: ricos (saldo total = carteira + banco)
      users = await User.find({ guildId: message.guild.id }).sort({ "economy.wallet": -1 }).limit(10);
      title = "💰 Top Mais Ricos";
      mapFn = (u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
        const total = (u.economy?.wallet || 0) + (u.economy?.bank || 0);
        const arch = u.profile?.archetype || "misterioso";
        const archEmojis = { inocente: "🌸", possessivo: "🔒", dominante: "👑", manipulador: "🕸️", romantico: "💝", misterioso: "🌑", obsessivo: "⛓️", carente: "🥺", independente: "🦅" };
        return `${medal} ${archEmojis[arch] || ""} <@${u.userId}> — **${total.toLocaleString("pt-BR")} 💰**`;
      };
    }

    const list = (users._results || []);
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(title)
      .setDescription(list.length ? list.map(mapFn).join("\n") : "Nenhum dado ainda.")
      .setFooter({ text: "Use !ranking ricos | xp | msgs | casais | ativos" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
