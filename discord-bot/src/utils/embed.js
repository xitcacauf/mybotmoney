const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");

function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || config.colors.primary)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
  if (options.author) embed.setAuthor({ name: options.author, iconURL: options.authorIcon });
  if (options.fields) embed.addFields(options.fields);
  if (options.url) embed.setURL(options.url);

  return embed;
}

function successEmbed(title, description) {
  return createEmbed({ title: `✅ ${title}`, description, color: config.colors.success });
}

function errorEmbed(title, description) {
  return createEmbed({ title: `❌ ${title}`, description, color: config.colors.error });
}

function warningEmbed(title, description) {
  return createEmbed({ title: `⚠️ ${title}`, description, color: config.colors.warning });
}

function infoEmbed(title, description) {
  return createEmbed({ title: `ℹ️ ${title}`, description, color: config.colors.info });
}

module.exports = { createEmbed, successEmbed, errorEmbed, warningEmbed, infoEmbed };
