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
    if (!target) return message.reply("❌ Mencione quem você quer pedir em casamento!");
    if (target.id === message.author.id) return message.reply("❌ Você não pode se casar consigo mesmo.");
    if (target.bot) return message.reply("❌ Bots não casam!");

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if (senderDb.relationship.status === "married") return message.reply("❌ Você já é casado(a)! Use `!divorcio` primeiro.");
    if (targetDb.relationship.status === "married") return message.reply(`❌ **${target.username}** já é casado(a)!`);

    const ring = senderDb.inventory.find((i) => i.itemId === "ring");
    if (!ring) return message.reply("❌ Você precisa de um 💍 **Anel de Noivado** para se casar! Compre na `!loja`.");

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💍 Pedido de Casamento!")
      .setDescription(`<@${message.author.id}> quer se casar com <@${target.id}>! 🥹\n\n<@${target.id}>, você aceita?`)
      .setImage("https://media.giphy.com/media/26FPy3QZQqGtDcrja/giphy.gif")
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`marry_accept_${message.author.id}`).setLabel("💍 Aceitar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`marry_reject_${message.author.id}`).setLabel("💔 Recusar").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });

    const filter = (i) => i.user.id === target.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      if (i.customId.startsWith("marry_accept")) {
        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          { $set: { "relationship.status": "married", "relationship.partnerId": target.id, "relationship.partnerName": target.username, "relationship.marriedAt": new Date() } }
        );
        await User.findOneAndUpdate(
          { userId: target.id, guildId: message.guild.id },
          { $set: { "relationship.status": "married", "relationship.partnerId": message.author.id, "relationship.partnerName": message.author.username, "relationship.marriedAt": new Date() } }
        );
        const successEmbed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle("💍 Casamento Realizado!")
          .setDescription(`🎊 <@${message.author.id}> e <@${target.id}> agora são casados! Parabéns! 🎊`)
          .setTimestamp();
        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        const rejectEmbed = new EmbedBuilder().setColor(config.colors.error).setTitle("💔 Pedido Recusado").setDescription(`<@${target.id}> recusou o pedido de casamento.`);
        await i.update({ embeds: [rejectEmbed], components: [] });
      }
      collector.stop();
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") msg.edit({ components: [] }).catch(() => {});
    });
  },
};
