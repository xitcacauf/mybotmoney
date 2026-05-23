const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");

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
  { text: "Se você pudesse mandar uma mensagem anônima para alguém deste servidor, o que diria?", level: "😏 Médio" },
  { text: "Qual é o pensamento mais sombrio que você já teve sobre um relacionamento?", level: "🔥 Difícil" },
  { text: "Descreva sua maior fraqueza emocional.", level: "😏 Médio" },
];

module.exports = {
  name: "desafio",
  aliases: ["challenge", "darkdesafio"],
  description: "Envie um desafio para alguém. Ex: !desafio @user [texto opcional]",
  cooldown: 30,
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    // Sem menção: desafio aleatório para si mesmo (modo solo)
    if (!target) {
      const challenge = challenges[Math.floor(Math.random() * challenges.length)];
      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("🎯 Desafio Dark")
        .setDescription(`<@${message.author.id}>, seu desafio:\n\n> **${challenge.text}**`)
        .addFields({ name: "Nível", value: challenge.level, inline: true })
        .setFooter({ text: "Use !desafio @user para desafiar alguém" })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) return message.reply("❌ Não pode se desafiar.");
    if (target.bot) return message.reply("❌ Bots não aceitam desafios.");

    const customText = args.slice(1).join(" ").trim();
    const challenge = customText || challenges[Math.floor(Math.random() * challenges.length)].text;
    const level = customText ? "🎯 Personalizado" : challenges.find((c) => c.text === challenge)?.level || "😏 Médio";

    await addBondXP(message.author.id, message.guild.id, target.id, 3);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🎯 Desafio Enviado!")
      .setDescription(
        `<@${message.author.id}> desafiou <@${target.id}>!\n\n` +
        `> **${challenge}**`
      )
      .addFields({ name: "Nível", value: level, inline: true })
      .setFooter({ text: "Aceite o desafio ou seja covarde... 😈" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("darklove_challenge").setLabel("🎲 Sortear Outro").setStyle(ButtonStyle.Primary)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
