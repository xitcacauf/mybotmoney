const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "divorcio",
  aliases: ["divorce", "separar"],
  description: "Inicia o processo de divórcio",
  cooldown: 60,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    if (dbUser.relationship.status !== "married") return message.reply("❌ Você não está casado(a).");

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle("💔 Confirmar Divórcio")
      .setDescription(`Tem certeza que deseja se divorciar de **${dbUser.relationship.partnerName}**?\n\nEsta ação **não pode ser desfeita**.`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("divorce_confirm").setLabel("💔 Confirmar Divórcio").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("divorce_cancel").setLabel("❌ Cancelar").setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const filter = (i) => i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on("collect", async (i) => {
      if (i.customId === "divorce_confirm") {
        const partnerId = dbUser.relationship.partnerId;
        await User.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { "relationship.status": "divorced", "relationship.partnerId": null, "relationship.partnerName": "" } });
        await User.findOneAndUpdate({ userId: partnerId, guildId: message.guild.id }, { $set: { "relationship.status": "divorced", "relationship.partnerId": null, "relationship.partnerName": "" } });
        const successEmbed = new EmbedBuilder().setColor(config.colors.error).setTitle("💔 Divórcio Concluído").setDescription("O casamento foi dissolvido. Boa sorte na vida!");
        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        await i.update({ embeds: [new EmbedBuilder().setColor(config.colors.success).setTitle("✅ Cancelado").setDescription("Divórcio cancelado.")], components: [] });
      }
      collector.stop();
    });
  },
};
