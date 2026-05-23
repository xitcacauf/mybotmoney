const { EmbedBuilder, ChannelType } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "controlar",
  aliases: ["control", "comandar", "dominar"],
  description: "Controles de dono de coleira. Ex: !controlar apelido @user <nick> | !controlar mutar @user | !controlar mover @user #canal",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (!sub) {
      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("⛓️ Controles do Dono — Como Usar")
        .setDescription(
          "Como dono da coleira você pode controlar seu submisso:\n\n" +
          "`!controlar apelido @user <apelido>` — Mudar apelido no servidor\n" +
          "`!controlar mutar @user` — Mutar em call de voz\n" +
          "`!controlar desmutar @user` — Desmutar em call de voz\n" +
          "`!controlar mover @user #canal` — Mover para outro canal de voz\n" +
          "`!controlar tirar @user` — Kickar do canal de voz\n\n" +
          "⚠️ *Todos os controles ficam registrados. Use com responsabilidade.*"
        )
        .setFooter({ text: "Apenas donos de coleira ativa podem usar estes comandos" });
      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply("❌ Mencione o usuário alvo. Ex: `!controlar mutar @user`");
    }

    if (target.id === message.author.id) {
      return message.reply("❌ Você não pode se controlar.");
    }

    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.user.username);
    const isCollarOwner = targetDb.darkLove?.coleira === message.author.id;

    if (!isCollarOwner) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.error)
            .setDescription(`❌ Você não é o dono da coleira de <@${target.id}>.\n\nApenas o dono registrado pode usar controles.`),
        ],
      });
    }

    const botMember = message.guild.members.me;

    if (sub === "apelido" || sub === "nick" || sub === "renomear") {
      const newNick = args.slice(2).join(" ").trim();
      if (!newNick) {
        return message.reply("❌ Informe o apelido. Ex: `!controlar apelido @user novo apelido aqui`");
      }
      if (newNick.length > 32) {
        return message.reply("❌ Apelido muito longo. Máximo 32 caracteres.");
      }

      if (!botMember.permissions.has("ManageNicknames")) {
        return message.reply("❌ Preciso da permissão **Gerenciar Apelidos** para fazer isso.");
      }

      if (target.roles.highest.position >= botMember.roles.highest.position) {
        return message.reply("❌ Não posso mudar o apelido de alguém com cargo mais alto que o meu.");
      }

      const oldNick = target.displayName;
      await target.setNickname(newNick, `Controle de coleira por ${message.author.tag}`).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("✏️ Apelido Alterado")
        .setDescription(`O apelido de <@${target.id}> foi alterado.\n\n> Antes: **${oldNick}**\n> Agora: **${newNick}**`)
        .setFooter({ text: `Ação de ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === "mutar" || sub === "mute" || sub === "silenciar") {
      if (!target.voice?.channel) {
        return message.reply(`❌ <@${target.id}> não está em nenhum canal de voz.`);
      }

      if (!botMember.permissions.has("MuteMembers")) {
        return message.reply("❌ Preciso da permissão **Mutar Membros** para fazer isso.");
      }

      await target.voice.setMute(true, `Controle de coleira por ${message.author.tag}`).catch(() => {});

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1a0a2e)
            .setDescription(`🔇 <@${target.id}> foi **mutado** no canal de voz por <@${message.author.id}>.`)
            .setTimestamp(),
        ],
      });
    }

    if (sub === "desmutar" || sub === "unmute" || sub === "dessilenciar") {
      if (!target.voice?.channel) {
        return message.reply(`❌ <@${target.id}> não está em nenhum canal de voz.`);
      }

      if (!botMember.permissions.has("MuteMembers")) {
        return message.reply("❌ Preciso da permissão **Mutar Membros** para fazer isso.");
      }

      await target.voice.setMute(false, `Controle de coleira por ${message.author.tag}`).catch(() => {});

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`🔊 <@${target.id}> foi **desmutado** no canal de voz.`)
            .setTimestamp(),
        ],
      });
    }

    if (sub === "mover" || sub === "move") {
      if (!target.voice?.channel) {
        return message.reply(`❌ <@${target.id}> não está em nenhum canal de voz.`);
      }

      if (!botMember.permissions.has("MoveMembers")) {
        return message.reply("❌ Preciso da permissão **Mover Membros** para fazer isso.");
      }

      const voiceChannel = message.mentions.channels.first();
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        return message.reply("❌ Mencione um canal de voz válido. Ex: `!controlar mover @user #canal-de-voz`");
      }

      await target.voice.setChannel(voiceChannel, `Controle de coleira por ${message.author.tag}`).catch(() => {});

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1a0a2e)
            .setDescription(`🔊 <@${target.id}> foi **movido** para ${voiceChannel.name} por <@${message.author.id}>.`)
            .setTimestamp(),
        ],
      });
    }

    if (sub === "tirar" || sub === "kick" || sub === "expulsar") {
      if (!target.voice?.channel) {
        return message.reply(`❌ <@${target.id}> não está em nenhum canal de voz.`);
      }

      if (!botMember.permissions.has("MoveMembers")) {
        return message.reply("❌ Preciso da permissão **Mover Membros** para fazer isso.");
      }

      await target.voice.disconnect(`Controle de coleira por ${message.author.tag}`).catch(() => {});

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1a0a2e)
            .setDescription(`🚪 <@${target.id}> foi **kickado** do canal de voz por <@${message.author.id}>.`)
            .setTimestamp(),
        ],
      });
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.warning)
          .setDescription(
            "❌ Subcomando inválido.\n\n" +
            "`!controlar apelido @user <nick>` — Mudar apelido\n" +
            "`!controlar mutar @user` — Mutar em voz\n" +
            "`!controlar desmutar @user` — Desmutar em voz\n" +
            "`!controlar mover @user #canal` — Mover de canal\n" +
            "`!controlar tirar @user` — Kickar do canal de voz"
          ),
      ],
    });
  },
};
