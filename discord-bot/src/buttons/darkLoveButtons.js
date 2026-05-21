const {
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const GuildConfig = require("../models/GuildConfig");

const darkChallenges = [
  "Envie uma foto segurando um bilhete com seu nome.",
  "Escreva 3 coisas que te fazem tremer.",
  "Descreva seu maior medo em um parágrafo.",
  "Envie uma voz confessando algo que nunca disse para ninguém.",
  "Faça um desenho de como se sente agora.",
  "Escreva uma carta para seu 'eu' do futuro.",
  "Revele um segredo que nunca contou a ninguém.",
  "Descreva o seu tipo ideal em detalhes.",
];

module.exports = {
  customId: ["darklove_profile", "darklove_confession", "darklove_challenge", "open_confession_modal"],
  async execute(interaction, client) {
    const id = interaction.customId;

    if (id === "darklove_profile") {
      const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);
      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle(`🖤 Dark Profile — ${interaction.user.username}`)
        .addFields(
          { name: "🎭 Role", value: dbUser.darkLove.role !== "none" ? dbUser.darkLove.role : "Não definido", inline: true },
          { name: "⛓️ Coleira", value: dbUser.darkLove.coleira ? `De <@${dbUser.darkLove.coleira}>` : "Livre", inline: true },
          { name: "📅 Coleirado em", value: dbUser.darkLove.coleiradoAt ? new Date(dbUser.darkLove.coleiradoAt).toLocaleDateString("pt-BR") : "—", inline: true }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (id === "darklove_confession" || id === "open_confession_modal") {
      const modal = new ModalBuilder().setCustomId("confession_submit").setTitle("🕵️ Confissão Anônima");
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
      const challenge = darkChallenges[Math.floor(Math.random() * darkChallenges.length)];
      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("🎯 Desafio Dark")
        .setDescription(`> **${challenge}**`)
        .setFooter({ text: "Prove que você tem coragem... ou não." })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
