const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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

    if (dbUser.dating.active) {
      const p = dbUser.dating.profileData;
      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle(`❤️ ${p.name || message.author.username}`)
        .setDescription(p.bio || "Sem bio.")
        .addFields(
          { name: "🎂 Idade", value: `${p.age || "?"}`, inline: true },
          { name: "⚧ Gênero", value: p.gender || "?", inline: true },
          { name: "🔍 Procura", value: p.desiredGender || "Qualquer", inline: true },
          { name: "💆 Personalidade", value: p.personality || "?", inline: true },
          { name: "🎮 Jogo favorito", value: p.favoriteGame || "?", inline: true },
          { name: "📍 Localização", value: p.location || "?", inline: true },
          { name: "🎯 Hobbies", value: p.hobbies || "?", inline: false }
        )
        .setThumbnail(p.photo || message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Reaja para dar match!" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("dating_deactivate").setLabel("❌ Desativar Perfil").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("dating_edit").setLabel("✏️ Editar").setStyle(ButtonStyle.Secondary)
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    const modal = new ModalBuilder()
      .setCustomId("dating_create")
      .setTitle("❤️ Perfil de Web Namoro");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("name").setLabel("Seu nome").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("age").setLabel("Sua idade").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("gender").setLabel("Seu gênero (Homem/Mulher/Outro)").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("bio").setLabel("Sua bio (hobbies, personalidade, jogo fav)").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("location").setLabel("Sua localização (cidade/estado)").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
      )
    );

    const triggerRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("dating_open_modal").setLabel("❤️ Criar Perfil de Namoro").setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("❤️ Web Namoro")
      .setDescription("Clique no botão abaixo para criar seu perfil e encontrar alguém especial!")
      .setFooter({ text: "Apenas maiores de 18 anos" });

    await message.reply({ embeds: [embed], components: [triggerRow] });
  },
};
