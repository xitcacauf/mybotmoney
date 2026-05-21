const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const crimes = [
  { name: "Hackear banco", success: "💻 Você hackeou um banco e escapou!", fail: "💻 A polícia rastreou você!" },
  { name: "Roubar loja", success: "🏪 Você roubou uma loja sem ser visto!", fail: "🏪 A câmera te filmou!" },
  { name: "Hackear servidor", success: "🖥️ Você vendeu dados roubados!", fail: "🖥️ O sistema te rastreou!" },
  { name: "Contrabando", success: "📦 A entrega passou pela fronteira!", fail: "📦 A encomenda foi interceptada!" },
];

module.exports = {
  name: "crime",
  aliases: ["roubar", "hack"],
  description: "Tente cometer um crime (arrisque!)",
  cooldown: 3,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const now = new Date();
    const lastCrime = dbUser.economy.lastCrime;
    const cooldownMs = config.cooldowns.crime * 1000;

    if (lastCrime && now - lastCrime < cooldownMs) {
      const remaining = cooldownMs - (now - lastCrime);
      const mins = Math.floor(remaining / 60000);
      return message.reply(`⏳ Aguarde **${mins} minutos** antes do próximo crime.`);
    }

    const crime = crimes[Math.floor(Math.random() * crimes.length)];
    const success = Math.random() > config.economy.crimeFail;

    let amount, description, color;
    if (success) {
      amount = Math.floor(Math.random() * (config.economy.crimeMax - config.economy.crimeMin)) + config.economy.crimeMin;
      description = `✅ ${crime.success}\n\nVocê ganhou **${amount.toLocaleString("pt-BR")} 💰 moedas**!`;
      color = config.colors.success;
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": amount, "economy.totalEarned": amount }, $set: { "economy.lastCrime": now } }
      );
    } else {
      amount = Math.floor(Math.random() * 200) + 50;
      description = `❌ ${crime.fail}\n\nVocê pagou **${amount.toLocaleString("pt-BR")} 💰** de multa!`;
      color = config.colors.error;
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": -Math.min(amount, dbUser.economy.wallet) }, $set: { "economy.lastCrime": now } }
      );
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🔫 ${crime.name}`)
      .setDescription(description)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
