const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "coleira",
  aliases: ["collar", "leash", "corrente"],
  description: "Coloque uma coleira digital em alguém. Ex: !coleira @user",
  cooldown: 30,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem vai receber a coleira. Ex: `!coleira @user`");
    if (target.id === message.author.id) return message.reply("❌ Você não pode colocar uma coleira em si mesmo.");
    if (target.bot) return message.reply("❌ Bots não usam coleira.");

    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if (targetDb.darkLove?.coleira) {
      return message.reply(`❌ <@${target.id}> já possui uma coleira de <@${targetDb.darkLove.coleira}>.`);
    }

    if (!client.pendingCollars) client.pendingCollars = new Map();

    if (client.pendingCollars.has(message.author.id)) {
      return message.reply("❌ Você já tem um pedido de coleira pendente! Aguarde a resposta.");
    }

    const proposalTs = Date.now();
    client.pendingCollars.set(message.author.id, {
      targetId: target.id,
      ownerName: message.author.username,
      timestamp: proposalTs,
    });

    // Timestamp guard prevents deleting a newer proposal if somehow a second is set
    setTimeout(() => {
      const pending = client.pendingCollars?.get(message.author.id);
      if (pending && pending.timestamp === proposalTs) {
        client.pendingCollars.delete(message.author.id);
      }
    }, 90000);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("⛓️ Pedido de Coleira")
      .setDescription(
        `<@${message.author.id}> quer colocar uma **coleira digital** em <@${target.id}>.\n\n` +
        `<@${target.id}>, você aceita este vínculo?\n\n` +
        `> *Uma coleira no Dark Love System representa um vínculo de submissão voluntária.*`
      )
      .setFooter({ text: "🔞 +18 only • Conteúdo adulto • Este pedido expira em 90 segundos" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`collar_accept_${message.author.id}`).setLabel("⛓️ Aceitar Coleira").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`collar_reject_${message.author.id}`).setLabel("❌ Recusar").setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
