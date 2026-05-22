const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "namoro",
  aliases: ["dating", "procurando", "pn"],
  description: "Abrir perfil de namoro / web namoro",
  cooldown: 10,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (dbUser.dating?.active) {
      const p = dbUser.dating.profileData || {};
      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle(`❤️ ${p.name || message.author.username}, ${p.age || "?"}`)
        .setDescription(p.bio || "Sem bio definida.")
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setAuthor({ name: `Perfil de ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

      const fields = [];
      if (p.gender) fields.push({ name: "⚧ Gênero", value: p.gender, inline: true });
      if (p.location) fields.push({ name: "📍 Localização", value: p.location, inline: true });
      if (p.desiredGender) fields.push({ name: "🔍 Procura", value: p.desiredGender, inline: true });
      if (fields.length) embed.addFields(fields);

      embed.setFooter({ text: "Perfil ativo • Outros usuários podem dar match!" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("dating_deactivate").setLabel("❌ Desativar Perfil").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("dating_edit").setLabel("✏️ Editar Perfil").setStyle(ButtonStyle.Secondary)
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    const triggerRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("dating_open_modal").setLabel("❤️ Criar Perfil de Namoro").setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("❤️ Web Namoro")
      .setDescription(
        "Crie seu perfil e apareça para outros usuários do servidor!\n\n" +
        "Quando alguém der match em você, um **chat privado** é criado automaticamente.\n\n" +
        "Clique no botão abaixo para começar:"
      )
      .addFields(
        { name: "📋 O que vai aparecer", value: "• Seu nome e idade\n• Gênero\n• Bio com seus hobbies\n• Foto de perfil do Discord", inline: false }
      )
      .setFooter({ text: "🔞 Apenas maiores de 18 anos • Respeito acima de tudo" })
      .setTimestamp();

    await message.reply({ embeds: [embed], components: [triggerRow] });
  },
};
