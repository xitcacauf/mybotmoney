const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "coleira",
  aliases: ["collar", "leash"],
  description: "Coloque uma coleira digital em alguém. Ex: !coleira @user",
  cooldown: 30,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem vai receber a coleira.");
    if (target.id === message.author.id) return message.reply("❌ Você não pode se colocar uma coleira.");
    if (target.bot) return message.reply("❌ Bots não usam coleira.");

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if (targetDb.darkLove.coleira) {
      return message.reply(`❌ <@${target.id}> já possui uma coleira de <@${targetDb.darkLove.coleira}>.`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("⛓️ Pedido de Coleira")
      .setDescription(`<@${message.author.id}> quer colocar uma **coleira digital** em <@${target.id}>.\n\n<@${target.id}>, você aceita?`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`collar_accept_${message.author.id}`).setLabel("⛓️ Aceitar Coleira").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`collar_reject_${message.author.id}`).setLabel("❌ Recusar").setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
    const filter = (i) => i.user.id === target.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      if (i.customId.startsWith("collar_accept")) {
        await User.findOneAndUpdate(
          { userId: target.id, guildId: message.guild.id },
          { $set: { "darkLove.coleira": message.author.id, "darkLove.coleiradoAt": new Date() } }
        );
        const successEmbed = new EmbedBuilder()
          .setColor(0x1a0a2e)
          .setTitle("⛓️ Coleira Colocada!")
          .setDescription(`<@${target.id}> agora usa a coleira de <@${message.author.id}>. 🖤`);
        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        await i.update({ embeds: [new EmbedBuilder().setColor(config.colors.error).setTitle("❌ Recusado").setDescription(`<@${target.id}> recusou a coleira.`)], components: [] });
      }
      collector.stop();
    });
  },
};
