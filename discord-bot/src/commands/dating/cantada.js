const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");

const cantadas = [
  "Você tem Wi-Fi? Porque sinto uma conexão entre nós.",
  "Você é um bug no meu código, porque não consigo te ignorar.",
  "Você veio do céu ou fez lag até aqui?",
  "Você é hacker? Porque invadiu meu coração sem permissão.",
  "Posso te adicionar? Quero você na minha party para sempre.",
  "Você é suporte? Porque cuida bem de mim.",
  "Você é Lv.99? Porque é perfeito(a).",
  "Você é a última vida no jogo — a mais preciosa.",
  "Se seu coração fosse um servidor, eu queria ser o admin.",
  "Você é top 1 no ranking do meu coração.",
  "Você é o único drop raro que quero no inventário.",
  "Mesmo com ping 999ms, meu coração bate por você.",
];

module.exports = {
  name: "cantada",
  aliases: ["flirtar"],
  description: "Envie uma cantada para alguém. Ex: !cantada @user",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione alguém para mandar uma cantada!");
    if (target.id === message.author.id) return message.reply("❌ Cantada própria não vale! 😆");

    const cantada = cantadas[Math.floor(Math.random() * cantadas.length)];

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💌 Cantada Chegando!")
      .setDescription(`<@${message.author.id}> está mandando uma cantada para <@${target.id}>:\n\n> *"${cantada}"*`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "💘 Você foi cantado(a)!" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
