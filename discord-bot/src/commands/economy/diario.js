const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const logger = require("../../utils/logger");

module.exports = {
  name: "diario",
  aliases: ["daily", "recompensa"],
  description: "Resgate sua recompensa diária!",
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const now = new Date();
      const lastDaily = dbUser.economy.lastDaily ? new Date(dbUser.economy.lastDaily) : null;
      const cooldownMs = 24 * 60 * 60 * 1000;

      if (lastDaily && now - lastDaily < cooldownMs) {
        const rem = cooldownMs - (now - lastDaily);
        const h = Math.floor(rem / 3600000);
        const m = Math.floor((rem % 3600000) / 60000);
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("⏳ Já resgatou hoje!")
            .setDescription(`Volte em **${h}h ${m}m** para resgatar novamente.`)
            .setTimestamp()],
        });
      }

      // Streak
      const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const hadYesterday = lastDaily && lastDaily >= dayBefore && lastDaily <= yesterday;
      let streak = dbUser.economy?.streak || 0;
      streak = hadYesterday ? Math.min(streak + 1, 30) : 1;

      // Valores
      const base = config.economy.dailyReward || 500;
      const streakBonus = Math.floor(base * 0.1 * Math.min(streak - 1, 10));
      const reward = base + streakBonus;
      const xp = 20 + streak * 5;

      const isMarried = dbUser.relationship?.status === "married" && dbUser.relationship?.partnerId;
      const marriageBonus = isMarried ? Math.floor(reward * 0.2) : 0;

      const isVip = dbUser.vip?.active && dbUser.vip?.expiresAt && new Date(dbUser.vip.expiresAt) > now;
      const vipBonus = isVip ? reward + marriageBonus : 0;

      const total = reward + marriageBonus + vipBonus;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": total, "economy.totalEarned": total, "social.xp": xp },
          $set: { "economy.lastDaily": now.toISOString(), "economy.streak": streak },
        }
      );

      // Side effects — nunca bloqueiam a resposta
      const { addHeat } = require("../../systems/SocialHeat");
      const { addLedgerEntry } = require("./extrato");
      addHeat(message.guild.id, 2).catch(() => {});
      addLedgerEntry(message.author.id, message.guild.id, "daily", total, `Diário — streak ${streak}`).catch(() => {});

      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle("🎁 Recompensa Diária!")
          .addFields(
            { name: "💰 Base", value: `${base.toLocaleString("pt-BR")} 💰`, inline: true },
            { name: "🔥 Streak", value: `+${streakBonus.toLocaleString("pt-BR")} 💰 (${streak}d)`, inline: true },
            { name: "💍 Casal", value: marriageBonus > 0 ? `+${marriageBonus.toLocaleString("pt-BR")} 💰` : "—", inline: true },
            { name: "💎 VIP", value: isVip ? `+${vipBonus.toLocaleString("pt-BR")} 💰 (2×)` : "—", inline: true },
            { name: "🏆 Total", value: `**${total.toLocaleString("pt-BR")} 💰**`, inline: true },
            { name: "⭐ XP", value: `+${xp}`, inline: true },
          )
          .setFooter({ text: "Volte amanhã para manter o streak!" })
          .setTimestamp()],
      });
    } catch (err) {
      logger.error(`[DIARIO] ${err.message}\n${err.stack}`);
      message.reply("❌ Erro ao processar o diário. Tente novamente.").catch(() => {});
    }
  },
};
