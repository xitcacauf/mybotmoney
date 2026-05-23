const { EmbedBuilder } = require("discord.js");

const NEWS_CHANNEL_ID = "1507081710339096596";
const COLLAR_CHANNEL_ID = "1507081479509905478";
const CONFESSION_CHANNEL_ID = "1507081398283014205";

async function postNews(client, guildId, embed) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const channel = guild.channels.cache.get(NEWS_CHANNEL_ID);
    if (!channel) return;
    await channel.send({ embeds: [embed] });
  } catch {}
}

async function postCollarNews(client, guildId, embed) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const channel = guild.channels.cache.get(COLLAR_CHANNEL_ID);
    if (!channel) return;
    await channel.send({ embeds: [embed] });
  } catch {}
}

async function postConfession(client, guildId, embed) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const channel = guild.channels.cache.get(CONFESSION_CHANNEL_ID);
    if (!channel) return;
    await channel.send({ embeds: [embed] });
  } catch {}
}

module.exports = { postNews, postCollarNews, postConfession, NEWS_CHANNEL_ID, COLLAR_CHANNEL_ID, CONFESSION_CHANNEL_ID };
