const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { isEventActive } = require("../../systems/EventSystem");
const { addHeat } = require("../../systems/SocialHeat");
const { addLedgerEntry } = require("./extrato");
const { withLock } = require("../../utils/userLock");

const randomJobs = [
  { name: "Freelancer", emoji: "💻", min: 100, max: 350 },
  { name: "Bico de Entrega", emoji: "📦", min: 80, max: 200 },
  { name: "Caixa Temporário", emoji: "🏪", min: 70, max: 180 },
  { name: "Garçom Temporário", emoji: "🍽️", min: 90, max: 220 },
  { name: "Músico de Rua", emoji: "🎵", min: 50, max: 400 },
  { name: "Influencer", emoji: "📱", min: 30, max: 700 },
  { name: "Trader", emoji: "📈", min: 0, max: 900 },
];

const careerJobs = {
  entregador: { name: "Entregador", emoji: "📦", min: 80, max: 200 },
  vendedor: { name: "Vendedor", emoji: "🛍️", min: 90, max: 220 },
  garcom: { name: "Garçom", emoji: "🍽️", min: 100, max: 240 },
  caixa: { name: "Caixa", emoji: "🏪", min: 85, max: 210 },
  dev_junior: { name: "Dev Junior", emoji: "💻", min: 200, max: 450 },
  designer: { name: "Designer", emoji: "🎨", min: 180, max: 400 },
  social_media: { name: "Social Media", emoji: "📱", min: 150, max: 380 },
  chef: { name: "Chef de Cozinha", emoji: "👨‍🍳", min: 200, max: 420 },
  medico: { name: "Médico", emoji: "🏥", min: 500, max: 900 },
  advogado: { name: "Advogado", emoji: "⚖️", min: 450, max: 850 },
  engenheiro: { name: "Engenheiro", emoji: "🔧", min: 400, max: 780 },
  ceo: { name: "CEO", emoji: "💼", min: 600, max: 1200 },
};

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

      const isVip = dbUser.vip?.active && dbUser.vip?.expiresAt && new Date(dbUser.vip.expiresAt) > now;
      const workCooldownMs = isVip ? 30 * 60 * 1000 : config.cooldowns.work * 1000;

      if (lastWork && now - lastWork < workCooldownMs) {
        const remaining = workCooldownMs - (now - lastWork);
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

      const careerJobId = dbUser.career?.job;
      const job = (careerJobId && careerJobs[careerJobId]) || randomJobs[Math.floor(Math.random() * randomJobs.length)];

      let earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
      earned = Math.max(50, earned);

      let bonusText = "";

      if (isEventActive("bonus_trabalho")) {
        earned = Math.floor(earned * 2);
        bonusText += "\n🌟 **Evento Hora Extra**: salário dobrado!";
      }

      if (isVip) {
        earned = Math.floor(earned * 1.5);
        bonusText += "\n💎 **Bônus VIP**: +50% no salário!";
      }

      const xpGain = Math.floor(earned / 10);

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": earned, "economy.totalEarned": earned, "social.xp": xpGain, "career.experience": 1 },
          $set: { "economy.lastWork": now.toISOString() },
        }
      );

      await addHeat(message.guild.id, 1).catch(() => {});
      await addLedgerEntry(message.author.id, message.guild.id, "work", earned, `Trabalhou como ${job.name}`).catch(() => {});

      const newWallet = (dbUser.economy?.wallet || 0) + earned;
      const isCareerJob = !!careerJobId;

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${job.emoji} Trabalho Concluído!`)
        .setDescription(
          `Você trabalhou como **${job.name}** e ganhou **${earned.toLocaleString("pt-BR")} 💰**!${bonusText}` +
          (!isCareerJob ? "\n\n💡 *Escolha uma profissão com `!emprego` para ganhar mais!*" : "")
        )
        .addFields(
          { name: "💰 Novo Saldo", value: `${newWallet.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "⭐ XP Ganho", value: `+${xpGain}`, inline: true },
          { name: "⏰ Próximo trabalho", value: isVip ? "30 minutos (VIP)" : "1 hora", inline: true }
        )
        .setFooter({ text: "Use !banco para guardar o dinheiro • !emprego para escolher profissão" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    });
  },
};
