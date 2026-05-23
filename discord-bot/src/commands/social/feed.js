const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const JsonDB = require("../../utils/JsonDB");
const { addHeat } = require("../../systems/SocialHeat");
const { addBondXP } = require("../../systems/ObsessionSystem");

const feedDB = new JsonDB("feed");

module.exports = {
  name: "feed",
  aliases: ["post", "postar", "publicar", "timeline"],
  description: "Poste no feed social. Ex: !feed postar <texto> | !feed ver | !feed reagir <id>",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "ver" || sub === "timeline") {
      const posts = await feedDB.find({ guildId: message.guild.id })
        .sort({ "createdAt": -1 })
        .limit(5);

      if (!posts.length) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle("📱 Feed Social")
          .setDescription("Nenhuma publicação ainda!\nUse `!feed postar <mensagem>` para ser o primeiro.")
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle("📱 Feed Social do Servidor")
        .setDescription("Últimas publicações:")
        .setTimestamp();

      for (const post of posts) {
        const reactions = post.reactions || {};
        const reactionStr = Object.entries(reactions).map(([e, ids]) => `${e} ${ids.length}`).join(" ") || "sem reações";
        embed.addFields({
          name: `#${post._id?.slice(-4) || "?"} — ${post.authorName || "Anônimo"} <t:${Math.floor(new Date(post.createdAt).getTime() / 1000)}:R>`,
          value: `> ${post.content.slice(0, 200)}\n${reactionStr}`,
          inline: false,
        });
      }

      embed.setFooter({ text: "Use !feed postar <texto> para publicar • !feed reagir <id> ❤️" });
      return message.reply({ embeds: [embed] });
    }

    if (sub === "postar" || sub === "post") {
      const content = args.slice(1).join(" ").trim();
      if (!content) return message.reply("❌ Escreva algo para postar. Ex: `!feed postar Olá a todos!`");
      if (content.length > 280) return message.reply("❌ Post muito longo! Máximo 280 caracteres.");

      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const cooldownMs = 5 * 60 * 1000;
      if (dbUser.profile?.lastPost && Date.now() - new Date(dbUser.profile.lastPost).getTime() < cooldownMs) {
        return message.reply("⏳ Aguarde 5 minutos entre posts.");
      }

      const post = await feedDB.create({
        guildId: message.guild.id,
        authorId: message.author.id,
        authorName: message.author.username,
        authorAvatar: message.author.displayAvatarURL(),
        content,
        reactions: { "❤️": [], "😂": [], "🔥": [], "😏": [], "💔": [] },
        views: 0,
      });

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "profile.lastPost": new Date().toISOString() }, $inc: { "social.xp": 5 } }
      );
      await addHeat(message.guild.id, 2);

      const postId = post.createdAt ? new Date(post.createdAt).getTime().toString().slice(-6) : "000000";

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("📱 Publicado no Feed!")
        .setDescription(`> ${content}`)
        .addFields({ name: "💡 Dica", value: "Outros podem reagir ao seu post com `!feed reagir`", inline: false })
        .setFooter({ text: `+5 XP | Post ID: ${postId}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`feed_react_${post.createdAt}_❤️`).setLabel("❤️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`feed_react_${post.createdAt}_🔥`).setLabel("🔥").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`feed_react_${post.createdAt}_😏`).setLabel("😏").setStyle(ButtonStyle.Secondary),
      );

      return message.reply({ embeds: [embed], components: [row] });
    }

    return message.reply("❌ Use: `!feed` (ver timeline) | `!feed postar <texto>`");
  },
};
