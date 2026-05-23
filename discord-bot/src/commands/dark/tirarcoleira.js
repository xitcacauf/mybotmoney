const { EmbedBuilder } = require("discord.js");
const User = require("../../models/User");

module.exports = {
  name: "tirarcoleira",
  aliases: ["removecoleira", "soltar", "libertar"],
  description: "Remove a coleira de alguém (dono ou coleirado podem usar). Ex: !tirarcoleira @user",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    // Modo 1: sem menção → tenta remover a coleira do próprio autor
    if (!target) {
      const selfDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      if (!selfDb.darkLove?.coleira) {
        return message.reply("❌ Você não usa nenhuma coleira.");
      }
      const ownerId = selfDb.darkLove.coleira;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "darkLove.coleira": null, "darkLove.coleiradoAt": null } }
      );

      const embed = new EmbedBuilder()
        .setColor(0x555555)
        .setTitle("🔓 Coleira Removida")
        .setDescription(`<@${message.author.id}> se libertou da coleira de <@${ownerId}>.\n\nO vínculo foi desfeito.`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) return message.reply("❌ Não pode remover coleira de si mesmo.");

    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);
    if (!targetDb.darkLove?.coleira) {
      return message.reply(`❌ <@${target.id}> não usa nenhuma coleira.`);
    }

    const isOwner = targetDb.darkLove.coleira === message.author.id;
    const isSelf = target.id === message.author.id;

    if (!isOwner) {
      return message.reply(
        `❌ Você não é o dono da coleira de <@${target.id}>.\n` +
        `Apenas o dono **<@${targetDb.darkLove.coleira}>** pode remover, ou o próprio coleirado usando \`!tirarcoleira\` sem mencionar ninguém.`
      );
    }

    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $set: { "darkLove.coleira": null, "darkLove.coleiradoAt": null } }
    );

    const embed = new EmbedBuilder()
      .setColor(0x555555)
      .setTitle("🔓 Coleira Removida")
      .setDescription(`<@${message.author.id}> removeu a coleira de <@${target.id}>.\n\nO vínculo foi desfeito.`)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
