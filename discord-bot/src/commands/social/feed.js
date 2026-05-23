const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const JsonDB = require("../../utils/JsonDB");
const { addHeat } = require("../../systems/SocialHeat");
const { postNews } = require("../../utils/newsChannel");

const feedDB = new JsonDB("feed");
const POST_COOLDOWN_MS = 5 * 60 * 1000;

const RECOGNIZED_SUBS = ["ver", "timeline", "postar", "post", "publicar", "reagir", "react"];

module.exports = {
  name: "feed",
  aliases: ["post", "postar", "publicar", "timeline"],
  description: "Poste no feed social. Ex: !feed <texto> | !feed ver | !feed reagir <id>",
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
          .setDescription("Nenhuma publicação ainda!\nUse `!feed <mensagem>` para ser o primeiro.")
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
        const reactionStr = Object.entries(reactions)
          .filter(([, ids]) => Array.isArray(ids) && ids.length > 0)
          .map(([e, ids]) => `${e} ${ids.length}`)
          .join(" ") || "sem reações";
        const ts = Math.floor(new Date(post.createdAt).getTime() / 1000);
        embed.addFields({
          name: `👤 ${post.authorName || "Anônimo"} — <t:${ts}:R>`,
          value: `> ${post.content.slice(0, 200)}\n${reactionStr}`,
          inline: false,
        });
      }

      embed.setFooter({ text: "Use !feed <texto> para publicar" });
      return message.reply({ embeds: [embed] });
    }

    const isPostSub = sub === "postar" || sub === "post" || sub === "publicar";
    const isDirectPost = !RECOGNIZED_SUBS.includes(sub);

    const content = isDirectPost
      ? args.join(" ").trim()
      : args.slice(1).join(" ").trim();

    if (isPostSub || isDirectPost) {
      if (!content) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle("📱 Como usar o Feed")
              .setDescription(
                "**Postar algo:**\n`!feed Olá a todos! Estou animado hoje!`\n\n" +
                "**Ver o feed:**\n`!feed ver`\n\n" +
                "Máximo: 280 caracteres por post. Cooldown: 5 minutos."
              ),
          ],
        });
      }

      if (content.length > 280) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription("❌ Post muito longo! Máximo 280 caracteres.")],
        });
      }

      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

      if (dbUser.profile?.lastPost && Date.now() - new Date(dbUser.profile.lastPost).getTime() < POST_COOLDOWN_MS) {
        const nextPost = new Date(new Date(dbUser.profile.lastPost).getTime() + POST_COOLDOWN_MS);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setDescription(`⏳ Aguarde para postar novamente: <t:${Math.floor(nextPost.getTime() / 1000)}:R>`),
          ],
        });
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
      await addHeat(message.guild.id, 2).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("📱 Publicado no Feed!")
        .setDescription(`> ${content}`)
        .addFields({ name: "💡 Dica", value: "Outros podem reagir ao seu post com os botões abaixo", inline: false })
        .setFooter({ text: `+5 XP` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`feed_react_${post.createdAt}_❤️`).setLabel("❤️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`feed_react_${post.createdAt}_🔥`).setLabel("🔥").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`feed_react_${post.createdAt}_😏`).setLabel("😏").setStyle(ButtonStyle.Secondary),
      );

      const newsEmbed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setDescription(`📱 **${message.author.username}** postou no feed: *"${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"*`)
        .setTimestamp();

      await postNews(client, message.guild.id, newsEmbed).catch(() => {});

      return message.reply({ embeds: [embed], components: [row] });
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle("📱 Feed Social")
          .setDescription("`!feed <texto>` — Postar algo\n`!feed ver` — Ver posts recentes"),
      ],
    });
  },
};
