const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const logger = require("../../utils/logger");

const crimes = [
  { name: "Hackear banco",    success: "💻 Você hackeou um banco e escapou sem deixar rastros!",      fail: "💻 A polícia rastreou o IP e te prendeu!" },
  { name: "Roubar loja",      success: "🏪 Você roubou uma loja e vendeu tudo no mercado negro!",     fail: "🏪 A câmera de segurança te filmou em HD!" },
  { name: "Hackear servidor", success: "🖥️ Você vendeu dados roubados na darkweb!",                   fail: "🖥️ O sistema de segurança te rastreou!" },
  { name: "Contrabando",      success: "📦 A entrega passou pela fronteira sem ser inspecionada!",    fail: "📦 A encomenda foi interceptada pela Receita Federal!" },
  { name: "Golpe do Pix",     success: "📱 O golpe funcionou! Você fugiu antes de ser pego!",          fail: "📱 A vítima não caiu e chamou a polícia!" },
  { name: "Fraude de cartão", success: "💳 Você clonou o cartão e usou antes de bloquear!",           fail: "💳 O banco detectou a fraude em tempo real!" },
  { name: "Pickpocket",       success: "🎩 Você tirou a carteira sem que ninguém percebesse!",        fail: "🎩 Você foi pego no flagra pela câmera!" },
];

module.exports = {
  name: "crime",
  aliases: ["hack", "golpe", "criminoso"],
  description: "Tente cometer um crime — alto risco, alta recompensa. Ex: !crime",
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const now = new Date();
      const lastCrime = dbUser.economy.lastCrime ? new Date(dbUser.economy.lastCrime) : null;
      const cooldownMs = (config.cooldowns.crime || 1800) * 1000;

      if (lastCrime && now - lastCrime < cooldownMs) {
        const rem = cooldownMs - (now - lastCrime);
        const m = Math.floor(rem / 60000);
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("⏳ Aguarde!")
            .setDescription(`Aguarde **${m} minuto(s)** antes do próximo crime.`)
            .setTimestamp()],
        });
      }

      const crime = crimes[Math.floor(Math.random() * crimes.length)];
      const { isEventActive } = require("../../systems/EventSystem");
      let failChance = config.economy.crimeFail || 0.35;
      if (isEventActive("tempestade_economica")) failChance = Math.min(0.85, failChance + 0.5);

      const success = Math.random() > failChance;

      const { addHeat } = require("../../systems/SocialHeat");
      const { addLedgerEntry } = require("./extrato");

      let amount, description, color;

      if (success) {
        amount = Math.floor(Math.random() * (config.economy.crimeMax - config.economy.crimeMin)) + config.economy.crimeMin;
        description = `✅ ${crime.success}\n\nVocê ganhou **${amount.toLocaleString("pt-BR")} 💰**!`;
        color = config.colors.success;
        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          {
            $inc: { "economy.wallet": amount, "economy.totalEarned": amount },
            $set: { "economy.lastCrime": now.toISOString() },
          }
        );
        addHeat(message.guild.id, 2).catch(() => {});
        addLedgerEntry(message.author.id, message.guild.id, "crime", amount, crime.name).catch(() => {});
      } else {
        amount = Math.floor(Math.random() * 300) + 50;
        const fine = Math.min(amount, dbUser.economy.wallet || 0);
        description = `❌ ${crime.fail}\n\nVocê pagou **${fine.toLocaleString("pt-BR")} 💰** de multa!`;
        color = config.colors.error;
        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          {
            $inc: { "economy.wallet": -fine },
            $set: { "economy.lastCrime": now.toISOString() },
          }
        );
        addLedgerEntry(message.author.id, message.guild.id, "spend", -fine, `Multa: ${crime.name}`).catch(() => {});
      }

      if (isEventActive("tempestade_economica")) {
        description += "\n\n⚡ *Tempestade Econômica ativa: riscos aumentados!*";
      }

      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(color)
          .setTitle(`🔫 ${crime.name}`)
          .setDescription(description)
          .setTimestamp()],
      });
    } catch (err) {
      logger.error(`[CRIME] ${err.message}\n${err.stack}`);
      message.reply("❌ Erro ao processar o crime. Tente novamente.").catch(() => {});
    }
  },
};
