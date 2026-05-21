const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const jobs = [
  { name: "Programador", emoji: "💻" },
  { name: "Streamer", emoji: "🎮" },
  { name: "Designer", emoji: "🎨" },
  { name: "Chef", emoji: "👨‍🍳" },
  { name: "Médico", emoji: "🏥" },
  { name: "Professor", emoji: "📚" },
  { name: "Músico", emoji: "🎵" },
  { name: "Fotógrafo", emoji: "📸" },
];

module.exports = {
  name: "trabalhar",
  aliases: ["work", "trabalho"],
  description: "Trabalhe e ganhe moedas",
  cooldown: 3,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const now = new Date();
    const lastWork = dbUser.economy.lastWork;
    const cooldownMs = config.cooldowns.work * 1000;

    if (lastWork && now - lastWork < cooldownMs) {
      const remaining = cooldownMs - (now - lastWork);
      const mins = Math.floor(remaining / 60000);
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle("⏳ Ainda trabalhando!")
        .setDescription(`Você pode trabalhar novamente em **${mins} minutos**.`)
        .setTimestamp()] });
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (config.economy.workMax - config.economy.workMin + 1)) + config.economy.workMin;

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      {
        $inc: { "economy.wallet": earned, "economy.totalEarned": earned },
        $set: { "economy.lastWork": now },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`${job.emoji} Trabalho Concluído!`)
      .setDescription(`Você trabalhou como **${job.name}** e ganhou **${earned.toLocaleString("pt-BR")} 💰 moedas**!`)
      .setFooter({ text: "Trabalhe novamente em 1 hora" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
