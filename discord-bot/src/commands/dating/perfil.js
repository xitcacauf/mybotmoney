const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "perfil",
  aliases: ["profile", "eu"],
  description: "Veja seu perfil social ou de outro membro",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(target.id);
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const statusMap = {
      single: "💔 Solteiro(a)",
      dating: `💕 Namorando <@${dbUser.relationship.partnerId}>`,
      married: `💍 Casado(a) com <@${dbUser.relationship.partnerId}>`,
      divorced: "💔 Divorciado(a)",
    };

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({ name: `${target.username} — Perfil Social`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(dbUser.profile.photo || target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "📝 Bio", value: dbUser.profile.bio || "Sem bio definida.", inline: false },
        { name: "❤️ Status", value: statusMap[dbUser.relationship.status] || "Solteiro(a)", inline: true },
        { name: "⭐ Nível", value: `${dbUser.social.level}`, inline: true },
        { name: "💬 Mensagens", value: `${dbUser.social.messages.toLocaleString("pt-BR")}`, inline: true },
        { name: "💰 Fortuna Total", value: `${(dbUser.economy.wallet + dbUser.economy.bank).toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "⭐ Reputação", value: `${dbUser.profile.reputation}`, inline: true },
        { name: "🏠 Casa", value: dbUser.house.level > 0 ? `Nível ${dbUser.house.level}` : "Sem casa", inline: true },
        { name: "🖤 Dark Role", value: dbUser.darkLove.role !== "none" ? dbUser.darkLove.role : "—", inline: true },
        { name: "🐾 Coleira", value: dbUser.darkLove.coleira ? `⛓️ De <@${dbUser.darkLove.coleira}>` : "—", inline: true },
        { name: "👶 Filhos", value: `${dbUser.relationship.children.length}`, inline: true }
      )
      .setFooter({ text: `ID: ${target.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rep_${target.id}`).setLabel("⭐ Dar Reputação").setStyle(ButtonStyle.Primary).setDisabled(target.id === message.author.id)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
