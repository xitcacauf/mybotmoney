const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "diario",
  aliases: ["daily", "recompensa"],
  description: "Coleta sua recompensa diária",
  cooldown: 3,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const now = new Date();
    const lastDaily = dbUser.economy.lastDaily ? new Date(dbUser.economy.lastDaily) : null;

    if (lastDaily) {
      const diff = now - lastDaily;
      const msDay = 24 * 60 * 60 * 1000;
      if (diff < msDay) {
        const remaining = msDay - diff;
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        return message.reply({ embeds: [new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle("⏳ Já coletado!")
          .setDescription(`Volte em **${hours}h ${minutes}m** para coletar novamente.`)
          .setTimestamp()] });
      }
    }

    const reward = config.economy.dailyReward;
    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      {
        $inc: { "economy.wallet": reward, "economy.totalEarned": reward },
        $set: { "economy.lastDaily": now.toISOString() },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle("✅ Recompensa Diária Coletada!")
      .setDescription(`Você recebeu **${reward.toLocaleString("pt-BR")} 💰 moedas**!`)
      .addFields({ name: "💜 Novo saldo", value: `${(dbUser.economy.wallet + reward).toLocaleString("pt-BR")} 💰` })
      .setFooter({ text: "Volte amanhã para mais recompensas!" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
