const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "casar",
  aliases: ["marry", "pedido"],
  description: "Faça um pedido de casamento. Ex: !casar @user",
  cooldown: 30,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem você quer pedir em casamento! Ex: `!casar @user`");
    if (target.id === message.author.id) return message.reply("❌ Você não pode se casar consigo mesmo.");
    if (target.bot) return message.reply("❌ Bots não casam!");

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if (senderDb.relationship.status === "married") return message.reply("❌ Você já é casado(a)! Use `!divorcio` primeiro.");
    if (targetDb.relationship.status === "married") return message.reply(`❌ **${target.username}** já é casado(a)!`);

    const ring = senderDb.inventory.find((i) => i.itemId === "ring");
    if (!ring) return message.reply("❌ Você precisa de um 💍 **Anel de Noivado** para se casar!\nCompre na `!loja` por **8.000 💰** usando `!comprar ring`.");

    if (client.pendingMarriages?.has(message.author.id)) {
      return message.reply("❌ Você já tem um pedido de casamento pendente! Aguarde a resposta.");
    }

    if (!client.pendingMarriages) client.pendingMarriages = new Map();
    client.pendingMarriages.set(message.author.id, {
      targetId: target.id,
      proposerName: message.author.username,
      timestamp: Date.now(),
    });

    const proposalTs = Date.now();
    setTimeout(() => {
      const pending = client.pendingMarriages?.get(message.author.id);
      if (pending && pending.timestamp === proposalTs) {
        client.pendingMarriages.delete(message.author.id);
      }
    }, 120000);

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💍 Pedido de Casamento!")
      .setDescription(`<@${message.author.id}> quer se casar com <@${target.id}>! 🥹\n\n<@${target.id}>, você aceita?`)
      .setImage("https://media.giphy.com/media/26FPy3QZQqGtDcrja/giphy.gif")
      .setFooter({ text: "Este pedido expira em 2 minutos" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`marry_accept_${message.author.id}`).setLabel("💍 Aceitar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`marry_reject_${message.author.id}`).setLabel("💔 Recusar").setStyle(ButtonStyle.Danger)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
