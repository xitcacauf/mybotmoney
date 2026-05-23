const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { isEventActive } = require("../../systems/EventSystem");
const { addHeat } = require("../../systems/SocialHeat");
const { addLedgerEntry } = require("./extrato");
const { withLock } = require("../../utils/userLock");

const jobs = [
  { name: "Programador", emoji: "💻", min: 150, max: 400 },
  { name: "Streamer", emoji: "🎮", min: 100, max: 600 },
  { name: "Designer", emoji: "🎨", min: 130, max: 350 },
  { name: "Chef", emoji: "👨‍🍳", min: 120, max: 320 },
  { name: "Médico", emoji: "🏥", min: 200, max: 500 },
  { name: "Professor", emoji: "📚", min: 110, max: 280 },
  { name: "Músico", emoji: "🎵", min: 80, max: 500 },
  { name: "Fotógrafo", emoji: "📸", min: 100, max: 350 },
  { name: "Advogado", emoji: "⚖️", min: 250, max: 600 },
  { name: "Influencer", emoji: "📱", min: 50, max: 800 },
  { name: "Trader", emoji: "📈", min: 0, max: 1000 },
  { name: "Escritor", emoji: "✍️", min: 100, max: 400 },
];

module.exports = {
  name: "trabalhar",
  aliases: ["work", "trabalho", "trampo"],
  description: "Trabalhe e ganhe moedas. Ex: !trabalhar",
  cooldown: 3,
  async execute(message, args, client) {
    const key = `trabalhar:${message.author.id}:${message.guild.id}`;
    await withLock(key, async () => {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const now = new Date();
      const lastWork = dbUser.economy.lastWork ? new Date(dbUser.economy.lastWork) : null;
      const cooldownMs = config.cooldowns.work * 1000;

      if (lastWork && now - lastWork < cooldownMs) {
        const remaining = cooldownMs - (now - lastWork);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle("⏳ Ainda trabalhando!")
              .setDescription(`Você pode trabalhar novamente em **${mins}m ${secs}s**.`)
              .setTimestamp(),
          ],
        });
      }

      const job = jobs[Math.floor(Math.random() * jobs.length)];
      let earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
      earned = Math.max(50, earned);

      let bonusText = "";
      if (isEventActive("bonus_trabalho")) {
        earned *= 2;
        bonusText = "\n🌟 **Evento Hora Extra**: salário dobrado!";
      }

      const xpGain = Math.floor(earned / 10);

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": earned, "economy.totalEarned": earned, "social.xp": xpGain },
          $set: { "economy.lastWork": now.toISOString() },
        }
      );

      await addHeat(message.guild.id, 1).catch(() => {});
      await addLedgerEntry(message.author.id, message.guild.id, "work", earned, `Trabalhou como ${job.name}`).catch(() => {});

      const newWallet = (dbUser.economy?.wallet || 0) + earned;

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${job.emoji} Trabalho Concluído!`)
        .setDescription(
          `Você trabalhou como **${job.name}** e ganhou **${earned.toLocaleString("pt-BR")} 💰**!${bonusText}`
        )
        .addFields(
          { name: "💰 Novo Saldo", value: `${newWallet.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "⭐ XP Ganho", value: `+${xpGain}`, inline: true },
        )
        .setFooter({ text: "Trabalhe novamente em 1 hora • Use !banco para guardar o dinheiro" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    });
  },
};
