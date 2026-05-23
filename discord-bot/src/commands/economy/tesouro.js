const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { isEventActive } = require("../../systems/EventSystem");

const attempts = new Map();

module.exports = {
  name: "tesouro",
  aliases: ["treasure", "esconder", "achar"],
  description: "Tente achar o tesouro durante o evento de Caça ao Tesouro!",
  cooldown: 5,
  async execute(message, args, client) {
    if (!isEventActive("caca_tesouro")) {
      return message.reply("❌ Não há nenhuma **Caça ao Tesouro** ativa agora.\nFique de olho nos eventos automáticos do servidor!");
    }

    const key = `${message.author.id}_${message.guild.id}`;
    if (attempts.has(key)) {
      return message.reply("❌ Você já tentou encontrar o tesouro neste evento! Aguarde o próximo.");
    }

    attempts.set(key, true);
    setTimeout(() => attempts.delete(key), 30 * 60 * 1000);

    const chance = Math.random();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    // 30% de chance de achar algo
    if (chance < 0.30) {
      const reward = Math.floor(Math.random() * 1500) + 500;
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": reward, "economy.totalEarned": reward, "social.xp": 20 } }
      );

      const finds = [
        "achou um baú enterrado sob as pedras do jardim",
        "encontrou um mapa que levava ao tesouro",
        "desentocou uma caixinha brilhante atrás da fonte",
        "achou moedas antigas escondidas numa parede",
        "descobriu um envelope de dinheiro misterioso",
      ];

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🗺️ TESOURO ENCONTRADO!")
        .setDescription(`<@${message.author.id}> ${finds[Math.floor(Math.random() * finds.length)]}!\n\n💰 **+${reward.toLocaleString("pt-BR")} moedas** e **+20 XP**!`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // 70% de chance de não achar
    const misses = [
      "cavou por 1 hora e achou só uma minhoca 🪱",
      "seguiu um mapa falso e acabou no banheiro do servidor",
      "achou uma pedra brilhante que era só uma pedra normal",
      "escorregou na lama e voltou de mãos vazias",
      "seguiu as pistas erradas e perdeu o rastro",
    ];

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("😅 Nada por aqui...")
      .setDescription(`<@${message.author.id}> ${misses[Math.floor(Math.random() * misses.length)]}.\n\nO tesouro ainda está escondido! Sorte da próxima vez.`)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
