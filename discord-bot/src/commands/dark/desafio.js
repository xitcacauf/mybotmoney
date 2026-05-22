const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const challenges = [
  { text: "Envie uma mensagem de voz confessando algo que nunca disse para ninguém.", level: "🔥 Difícil" },
  { text: "Escreva 3 segredos seus que nunca contou a ninguém.", level: "🔥 Difícil" },
  { text: "Descreva em detalhes seu tipo ideal de parceiro(a).", level: "😏 Médio" },
  { text: "Revele o maior medo que você tem num relacionamento.", level: "😏 Médio" },
  { text: "Escreva uma carta para seu 'eu' do futuro sobre o que você quer em amor.", level: "💜 Suave" },
  { text: "Descreva como você se sente quando está apaixonado(a).", level: "💜 Suave" },
  { text: "Qual é a coisa mais ousada que você já fez por alguém?", level: "😏 Médio" },
  { text: "Conte uma fantasia que você nunca teve coragem de falar em voz alta.", level: "🔥 Difícil" },
  { text: "Se você pudesse escolher qualquer pessoa deste servidor para conversar às 3 da manhã, quem seria?", level: "😏 Médio" },
  { text: "O que você faz quando está sozinho que nunca contaria a ninguém?", level: "🔥 Difícil" },
  { text: "Descreva o momento mais intenso que você já viveu com outra pessoa.", level: "🔥 Difícil" },
  { text: "Qual música descreve exatamente como você se sente agora?", level: "💜 Suave" },
];

module.exports = {
  name: "desafio",
  aliases: ["challenge", "darkdesafio", "provocacao"],
  description: "Receba um desafio dark aleatório",
  cooldown: 10,
  async execute(message, args, client) {
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🎯 Desafio Dark")
      .setDescription(`> **${challenge.text}**`)
      .addFields({ name: "Nível", value: challenge.level, inline: true })
      .setFooter({ text: "Prove que tem coragem... ou admita que tem medo. 😈" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("darklove_challenge")
        .setLabel("🎲 Outro Desafio")
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
