const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "segredo",
  aliases: ["admira", "crush", "admirar"],
  description: "Admire alguém em segredo ou veja seus admiradores. Ex: !segredo @user | !segredo ver",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === "ver" || sub === "admiradores") {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const count = (dbUser.secretAdmirers || []).length;

      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setTitle("💌 Seus Admiradores Secretos")
        .setDescription(
          count === 0
            ? "Ninguém te admira secretamente ainda... 🥺"
            : `Você tem **${count} admirador(es) secreto(s)**!\n\n🔒 As identidades são reveladas apenas quando ambos se admiram mutuamente.\n\nUse \`!segredo revelar\` para tentar revelar.`
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (sub === "revelar") {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const admiring = dbUser.secretAdmiring;
      const admirers = dbUser.secretAdmirers || [];

      if (!admiring) {
        return message.reply("❌ Você não está admirando ninguém. Use `!segredo @user` primeiro.");
      }

      if (admirers.includes(admiring)) {
        const embed = new EmbedBuilder()
          .setColor(0xff1493)
          .setTitle("💘 Match de Admiração!")
          .setDescription(
            `Incrível! Você e <@${admiring}> se admiram mutuamente!\n\n` +
            `Hora de dar o próximo passo... 😏\n*Use \`!cantada @user\` para quebrar o gelo!*`
          )
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      return message.reply(`🔒 Ainda sem revelação. <@${admiring}> ainda não te admira de volta... ou ainda não revelou.`);
    }

    const target = message.mentions.users.first();
    if (!target) {
      return message.reply(
        "❌ Use:\n`!segredo @user` — admirar alguém em segredo\n`!segredo ver` — ver quantos admiradores você tem\n`!segredo revelar` — tentar revelar match"
      );
    }

    if (target.id === message.author.id) return message.reply("❌ Não pode se admirar.");
    if (target.bot) return message.reply("❌ Bots não podem ser admirados.");

    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (dbUser.secretAdmiring === target.id) {
      return message.reply(`❌ Você já admira <@${target.id}> em segredo.`);
    }

    // Remove do anterior se havia
    if (dbUser.secretAdmiring) {
      await User.findOneAndUpdate(
        { userId: dbUser.secretAdmiring, guildId: message.guild.id },
        { $set: { secretAdmirers: (await User.findOne({ userId: dbUser.secretAdmiring, guildId: message.guild.id }))?.secretAdmirers?.filter((id) => id !== message.author.id) || [] } }
      );
    }

    // Adiciona o autor como admirador do target
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);
    const updatedAdmirers = [...new Set([...(targetDb.secretAdmirers || []), message.author.id])];

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $set: { secretAdmiring: target.id } }
    );
    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $set: { secretAdmirers: updatedAdmirers } }
    );

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle("💌 Admiração Secreta Registrada!")
      .setDescription(
        `Você passou a admirar <@${target.id}> em segredo.\n\n` +
        `🔒 Sua identidade só é revelada se o sentimento for mútuo.\n` +
        `<@${target.id}> agora sabe que tem um admirador secreto, mas não sabe quem é... 😈`
      )
      .setTimestamp();

    // Notifica o target de forma anônima
    try {
      const dm = await target.createDM();
      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff69b4)
            .setTitle("💌 Alguém te admira em segredo!")
            .setDescription(
              `Alguém no servidor **${message.guild.name}** passou a te admirar secretamente!\n\n` +
              `🔒 Use \`!segredo ver\` para saber quantos admiradores você tem.\n` +
              `Use \`!segredo revelar\` para tentar descobrir se é uma admiração mútua.`
            )
            .setTimestamp(),
        ],
      });
    } catch {}

    return message.reply({ embeds: [embed] });
  },
};
