const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");
const { addHeat } = require("../../systems/SocialHeat");

const pixMessages = [
  "💸 O PIX chegou na hora!",
  "⚡ Transferência instantânea concluída!",
  "💳 Pagamento processado com sucesso!",
  "🏦 Banco Love Link: transação aprovada!",
  "📱 PIX recebido! Notificação enviada.",
  "✅ Transação concluída pelo sistema Love Link.",
];

const pixEmojis = ["⚡", "💸", "💳", "🏦", "📲", "✨"];

module.exports = {
  name: "pix",
  aliases: ["transferir", "enviar", "mandar"],
  description: "Faça um PIX estilizado para alguém. Ex: !pix @user 1000 [mensagem]",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione o destinatário. Ex: `!pix @user 500 obrigado!`");
    if (target.id === message.author.id) return message.reply("❌ Você não pode fazer PIX para si mesmo.");
    if (target.bot) return message.reply("❌ Bots não recebem PIX.");

    const amount = parseInt(args[1]);
    if (!amount || isNaN(amount) || amount < 1) {
      return message.reply("❌ Valor inválido. Ex: `!pix @user 500`");
    }

    const pixMsg = args.slice(2).join(" ").trim() || null;

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    if ((senderDb.economy?.wallet || 0) < amount) {
      return message.reply(
        `❌ Saldo insuficiente na carteira!\n` +
        `Você tem: **${(senderDb.economy?.wallet || 0).toLocaleString("pt-BR")} 💰**\n` +
        `Use \`!banco sacar\` para trazer dinheiro do banco.`
      );
    }

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { "economy.wallet": -amount } }
    );
    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $inc: { "economy.wallet": amount } }
    );

    await addBondXP(message.author.id, message.guild.id, target.id, 5).catch(() => {});
    await addHeat(message.guild.id, 2).catch(() => {});

    const emoji = pixEmojis[Math.floor(Math.random() * pixEmojis.length)];
    const pixText = pixMessages[Math.floor(Math.random() * pixMessages.length)];
    const timestamp = new Date();
    const pixId = Math.random().toString(36).slice(2, 10).toUpperCase();

    const senderNew = (senderDb.economy?.wallet || 0) - amount;
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);
    const targetNew = (targetDb.economy?.wallet || 0) + amount;

    const embed = new EmbedBuilder()
      .setColor(0x00d4aa)
      .setTitle(`${emoji} PIX Enviado!`)
      .setDescription(
        `> ${pixText}\n\n` +
        `**De:** <@${message.author.id}>\n` +
        `**Para:** <@${target.id}>\n` +
        `**Valor:** **${amount.toLocaleString("pt-BR")} 💰**\n` +
        (pixMsg ? `**Mensagem:** *"${pixMsg}"*\n` : "") +
        `\n\`\`\`\n` +
        `ID: ${pixId}\n` +
        `Hora: ${timestamp.toLocaleTimeString("pt-BR")}\n` +
        `Status: APROVADO ✅\n` +
        `\`\`\``
      )
      .addFields(
        { name: `👜 ${message.author.username}`, value: `${senderNew.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: `👜 ${target.username}`, value: `${targetNew.toLocaleString("pt-BR")} 💰`, inline: true },
      )
      .setFooter({ text: "Love Link Bank • PIX instantâneo 24h" })
      .setTimestamp();

    await message.reply({ content: `<@${target.id}> você recebeu um PIX! ${emoji}`, embeds: [embed] });

    // Notificar via DM
    try {
      const dm = await target.createDM();
      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00d4aa)
            .setTitle(`${emoji} Você recebeu um PIX!`)
            .setDescription(
              `<@${message.author.id}> te enviou **${amount.toLocaleString("pt-BR")} 💰** no servidor **${message.guild.name}**!\n` +
              (pixMsg ? `\n💬 Mensagem: *"${pixMsg}"*` : "")
            )
            .setTimestamp(),
        ],
      });
    } catch {}
  },
};
