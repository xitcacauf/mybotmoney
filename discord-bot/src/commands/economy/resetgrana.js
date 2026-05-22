const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const config = require("../../config/config");

module.exports = {
  name: "resetgrana",
  aliases: ["resetmoney", "resetsaldo", "zeargrana"],
  description: "[ADMIN] Zera o dinheiro de um usuário. Ex: !resetgrana @user",
  cooldown: 5,
  adminOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target || target.bot) {
      return message.reply({ embeds: [errorEmbed("Erro", "Mencione um usuário válido. Ex: `!resetgrana @user`")] });
    }

    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);
    const saldoAtual = (dbUser.economy?.wallet || 0) + (dbUser.economy?.bank || 0);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("⚠️ Confirmar Reset")
      .setDescription(`Tem certeza que quer zerar **toda** a grana de <@${target.id}>?\n\n💰 Carteira: **${dbUser.economy?.wallet?.toLocaleString("pt-BR") || 0}**\n🏦 Banco: **${dbUser.economy?.bank?.toLocaleString("pt-BR") || 0}**\n\nTotal a zerar: **${saldoAtual.toLocaleString("pt-BR")} 💰**`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Esta ação não pode ser desfeita!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`resetgrana_confirm_${target.id}`).setLabel("✅ Confirmar Reset").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`resetgrana_cancel_${target.id}`).setLabel("❌ Cancelar").setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const filter = (i) => i.user.id === message.author.id &&
      (i.customId === `resetgrana_confirm_${target.id}` || i.customId === `resetgrana_cancel_${target.id}`);
    const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on("collect", async (i) => {
      if (i.customId.startsWith("resetgrana_confirm")) {
        await User.findOneAndUpdate(
          { userId: target.id, guildId: message.guild.id },
          { $set: { "economy.wallet": 0, "economy.bank": 0 } }
        );
        const successEmbed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle("🗑️ Grana Zerada")
          .setDescription(`A grana de <@${target.id}> foi zerada por <@${message.author.id}>.\nCarteira: **0 💰** | Banco: **0 💰**`)
          .setTimestamp();
        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        await i.update({ embeds: [new EmbedBuilder().setColor(config.colors.secondary).setTitle("❌ Cancelado").setDescription("Reset cancelado.")], components: [] });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  },
};
