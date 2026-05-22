const {
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");

const darkChallenges = [
  { text: "Envie uma mensagem de voz confessando algo que nunca disse para ninguém.", level: "🔥 Difícil" },
  { text: "Escreva 3 segredos seus que nunca contou a ninguém.", level: "🔥 Difícil" },
  { text: "Descreva em detalhes seu tipo ideal de parceiro(a).", level: "😏 Médio" },
  { text: "Revele o maior medo que você tem num relacionamento.", level: "😏 Médio" },
  { text: "Escreva uma carta para seu 'eu' do futuro sobre o que quer em amor.", level: "💜 Suave" },
  { text: "Qual é a coisa mais ousada que você já fez por alguém?", level: "😏 Médio" },
  { text: "Conte uma fantasia que nunca teve coragem de falar em voz alta.", level: "🔥 Difícil" },
  { text: "Se pudesse escolher alguém deste servidor para conversar às 3 da manhã, quem seria?", level: "😏 Médio" },
  { text: "O que você faz quando está sozinho que nunca contaria a ninguém?", level: "🔥 Difícil" },
  { text: "Qual música descreve exatamente como você se sente agora?", level: "💜 Suave" },
];

module.exports = {
  customId: ["darklove_profile", "darklove_confession", "darklove_challenge", "open_confession_modal"],
  async execute(interaction, client) {
    const id = interaction.customId;

    if (id === "darklove_profile") {
      await interaction.deferReply({ ephemeral: true });
      const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);
      const role = dbUser.darkLove?.role !== "none" ? dbUser.darkLove.role : "Não definido";
      const coleira = dbUser.darkLove?.coleira ? `⛓️ De <@${dbUser.darkLove.coleira}>` : "🕊️ Livre";
      const coleiradoEm = dbUser.darkLove?.coleiradoAt
        ? `<t:${Math.floor(new Date(dbUser.darkLove.coleiradoAt).getTime() / 1000)}:D>`
        : "—";

      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle(`🖤 Dark Profile — ${interaction.user.username}`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "🎭 Role", value: role, inline: true },
          { name: "⛓️ Coleira", value: coleira, inline: true },
          { name: "📅 Coleirado em", value: coleiradoEm, inline: true }
        )
        .setFooter({ text: "Use !darklove para alterar seu role" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (id === "darklove_confession" || id === "open_confession_modal") {
      const modal = new ModalBuilder()
        .setCustomId("confession_submit")
        .setTitle("🕵️ Confissão Anônima");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("confession_text")
            .setLabel("Sua confissão (100% anônima)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000)
            .setPlaceholder("Escreva aqui... ninguém saberá que foi você.")
        )
      );
      return interaction.showModal(modal);
    }

    if (id === "darklove_challenge") {
      await interaction.deferReply({ ephemeral: true });
      const challenge = darkChallenges[Math.floor(Math.random() * darkChallenges.length)];
      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("🎯 Desafio Dark")
        .setDescription(`> **${challenge.text}**`)
        .addFields({ name: "Nível", value: challenge.level, inline: true })
        .setFooter({ text: "Prove que tem coragem... ou admita que tem medo. 😈" })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
