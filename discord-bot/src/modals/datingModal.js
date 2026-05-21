const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { sanitizeText, isValidAge } = require("../utils/sanitize");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  customId: "dating_create",
  async execute(interaction, client) {
    const name = sanitizeText(interaction.fields.getTextInputValue("name"), 32);
    const ageRaw = interaction.fields.getTextInputValue("age");
    const gender = sanitizeText(interaction.fields.getTextInputValue("gender"), 20);
    const bio = sanitizeText(interaction.fields.getTextInputValue("bio"), 300);
    const location = sanitizeText(interaction.fields.getTextInputValue("location") || "", 50);

    if (!isValidAge(ageRaw)) {
      return interaction.reply({ content: "❌ Idade inválida. Informe um número válido.", ephemeral: true });
    }
    const age = parseInt(ageRaw);

    await User.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      {
        $set: {
          "dating.active": true,
          "dating.profileData": { name, age, gender, bio, location, hobbies: bio, favoriteGame: "", desiredGender: "Qualquer" },
        },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle(`❤️ ${name}, ${age} anos`)
      .setDescription(bio)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "⚧ Gênero", value: gender, inline: true },
        { name: "📍 Localização", value: location || "Não informado", inline: true }
      )
      .setAuthor({ name: `Perfil de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: "Clique em ✅ para dar match!" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`match_accept_${interaction.user.id}`)
        .setLabel("✅ Aceitar Match")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`match_ignore_${interaction.user.id}`)
        .setLabel("❌ Ignorar")
        .setStyle(ButtonStyle.Danger)
    );

    const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
    const datingChannel = interaction.guild.channels.cache.get(gConfig.dating?.channelId);

    if (datingChannel) {
      await datingChannel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: "✅ Perfil publicado no canal de namoro!", ephemeral: true });
    }

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
