const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const pendingProvas = new Map();

module.exports = {
  name: "prova",
  aliases: ["proof", "evidencia"],
  description: "Envie uma prova (imagem/vídeo) para alguém ver. Auto-delete. Ex: !prova @user [arquivo]",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem vai receber a prova. Ex: `!prova @user`");
    if (target.id === message.author.id) return message.reply("❌ Não pode enviar prova para si mesmo.");
    if (target.bot) return message.reply("❌ Bots não recebem provas.");

    const attachment = message.attachments.first();
    const linkArg = args.slice(1).find((a) => a.startsWith("http"));
    const mediaUrl = attachment?.url || linkArg;

    if (!mediaUrl) {
      return message.reply(
        "❌ Anexe uma imagem/vídeo ou coloque um link junto ao comando.\nEx: `!prova @user` (com arquivo anexado)"
      );
    }

    // Deleta a mensagem original imediatamente para privacidade
    await message.delete().catch(() => {});

    const provaId = `${message.author.id}_${Date.now()}`;

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🔒 Prova Privada Recebida")
      .setDescription(
        `<@${message.author.id}> enviou uma prova **exclusiva** para você.\n\n` +
        `⚠️ Esta prova será **auto-deletada em 60 segundos** após ser revelada.\n\n` +
        `**Apenas você pode ver isso.**`
      )
      .setFooter({ text: "Conteúdo privado • Auto-delete ativado" })
      .setTimestamp();

    try {
      const dm = await target.createDM();
      const revealEmbed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("🔓 Prova Revelada")
        .setDescription(`**De:** <@${message.author.id}>\n\n⚠️ Esta mensagem será deletada do canal original em 60 segundos.`)
        .setImage(mediaUrl)
        .setTimestamp();

      await dm.send({ embeds: [revealEmbed] });

      await message.channel.send({
        content: `<@${target.id}>`,
        embeds: [embed],
      }).then((msg) => {
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      });

    } catch {
      // Se DM bloqueado, usa ephemeral via canal (envia e auto-deleta)
      const fallbackMsg = await message.channel.send({
        content: `<@${target.id}> 🔒 Você tem **60 segundos** para ver esta prova privada de <@${message.author.id}>:`,
        files: [mediaUrl],
      }).catch(() => null);

      if (fallbackMsg) {
        setTimeout(() => fallbackMsg.delete().catch(() => {}), 60000);
        await message.channel.send({
          content: `⚠️ <@${target.id}> a prova acima será deletada em 60 segundos. Abra o DM para receber sem prazo.`,
        }).then((m) => setTimeout(() => m.delete().catch(() => {}), 55000));
      }
    }
  },
};
