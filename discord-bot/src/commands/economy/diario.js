const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addHeat } = require("../../systems/SocialHeat");
const { addLedgerEntry } = require("./extrato");
const { withLock } = require("../../utils/userLock");

module.exports = {
  name: "diario",
  aliases: ["daily", "recompensa"],
  description: "Resgate sua recompensa diária!",
  cooldown: 3,
  async execute(message, args, client) {
    const key = `diario:${message.author.id}:${message.guild.id}`;
    await withLock(key, async () => {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const now = new Date();
      const lastDaily = dbUser.economy.lastDaily ? new Date(dbUser.economy.lastDaily) : null;
      const cooldownMs = 24 * 60 * 60 * 1000;

      if (lastDaily && now - lastDaily < cooldownMs) {
        const remaining = cooldownMs - (now - lastDaily);
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle("⏳ Já resgatou hoje!")
              .setDescription(`Volte em **${hours}h ${mins}m** para resgatar novamente.`)
              .setTimestamp(),
          ],
        });
      }

      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const hadYesterday = lastDaily && lastDaily >= dayBefore && lastDaily <= yesterday;
      let streak = dbUser.economy?.streak || 0;
      streak = hadYesterday ? Math.min(streak + 1, 30) : 1;

      const baseReward = config.economy.dailyReward || 500;
      const streakBonus = Math.floor(baseReward * 0.1 * Math.min(streak - 1, 10));
      const reward = baseReward + streakBonus;
      const xpBonus = 20 + streak * 5;

      let marriageBonus = 0;
      if (dbUser.relationship?.status === "married" && dbUser.relationship?.partnerId) {
        marriageBonus = Math.floor(reward * 0.2);
      }

      const total = reward + marriageBonus;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": total, "economy.totalEarned": total, "social.xp": xpBonus },
          $set: { "economy.lastDaily": now.toISOString(), "economy.streak": streak },
        }
      );

      await addHeat(message.guild.id, 2).catch(() => {});
      await addLedgerEntry(message.author.id, message.guild.id, "daily", total, `Recompensa diária (streak ${streak})`).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🎁 Recompensa Diária!")
        .addFields(
          { name: "💰 Recompensa Base", value: `${baseReward.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🔥 Bônus Streak", value: `+${streakBonus.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💍 Bônus Casal", value: marriageBonus > 0 ? `+${marriageBonus.toLocaleString("pt-BR")} 💰` : "—", inline: true },
          { name: "💎 Total", value: `**${total.toLocaleString("pt-BR")} 💰**`, inline: true },
          { name: "⭐ XP", value: `+${xpBonus}`, inline: true },
          { name: "🔥 Streak", value: `${streak} dia(s)!`, inline: true },
        )
        .setFooter({ text: "Volte amanhã para manter o streak!" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    });
  },
};
