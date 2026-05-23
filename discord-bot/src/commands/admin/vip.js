const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { checkPermission } = require("../../utils/permissions");

const VIP_DAILY_BONUS = 2;
const VIP_WORK_MULTIPLIER = 1.5;

module.exports = {
  name: "vip",
  aliases: ["addvip", "setvip", "removevip"],
  description: "Gerencia status VIP de membros (staff only). Ex: !vip @user [dias] | !vip ver @user | !vip remover @user",
  cooldown: 5,
  staffOnly: true,
  async execute(message, args, client) {
    if (!checkPermission(message, "staff")) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription("❌ Apenas staff pode gerenciar VIP.")],
      });
    }

    const sub = args[0]?.toLowerCase();

    if (sub === "remover" || sub === "remove" || sub === "revogar") {
      const target = message.mentions.users.first();
      if (!target) return message.reply("❌ Mencione o usuário. Ex: `!vip remover @user`");

      await User.findOneAndUpdate(
        { userId: target.id, guildId: message.guild.id },
        { $set: { "vip.active": false, "vip.expiresAt": null } }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("💎 VIP Removido")
            .setDescription(`O status VIP de <@${target.id}> foi removido.`)
            .setTimestamp(),
        ],
      });
    }

    if (sub === "ver" || sub === "check" || sub === "status") {
      const target = message.mentions.users.first() || message.author;
      const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);
      const vip = dbUser.vip || {};
      const active = vip.active && (!vip.expiresAt || new Date(vip.expiresAt) > new Date());

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(active ? 0xffd700 : config.colors.info)
            .setTitle(`💎 Status VIP — ${target.username}`)
            .addFields(
              { name: "Status", value: active ? "✅ VIP Ativo" : "❌ Não é VIP", inline: true },
              { name: "Expira em", value: vip.expiresAt ? `<t:${Math.floor(new Date(vip.expiresAt).getTime() / 1000)}:R>` : "—", inline: true },
              { name: "Concedido por", value: vip.grantedBy ? `<@${vip.grantedBy}>` : "—", inline: true }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp(),
        ],
      });
    }

    if (sub === "lista" || sub === "listar") {
      const allUsers = await User.find({ guildId: message.guild.id });
      const vips = Array.isArray(allUsers)
        ? allUsers.filter((u) => u.vip?.active && (!u.vip.expiresAt || new Date(u.vip.expiresAt) > new Date()))
        : [];

      if (!vips.length) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription("Nenhum VIP ativo no servidor.")] });
      }

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("💎 VIPs do Servidor")
        .setDescription(vips.map((u) => `• **${u.username}** — expira <t:${Math.floor(new Date(u.vip.expiresAt || Date.now()).getTime() / 1000)}:R>`).join("\n"))
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    if (!target) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle("💎 Gerenciar VIP (Staff Only)")
            .setDescription(
              "**Como usar:**\n" +
              "`!vip @user [dias]` — Conceder VIP (padrão: 30 dias)\n" +
              "`!vip ver @user` — Ver status VIP\n" +
              "`!vip remover @user` — Remover VIP\n" +
              "`!vip lista` — Ver todos os VIPs\n\n" +
              "**Benefícios VIP:**\n" +
              `• 💰 ${VIP_DAILY_BONUS}x recompensa diária\n` +
              `• 💼 ${VIP_WORK_MULTIPLIER}x ganhos no trabalho\n` +
              `• 💎 Aura dourada no perfil\n` +
              `• ⚡ Badge VIP exclusivo`
            ),
        ],
      });
    }

    if (target.bot) return message.reply("❌ Bots não podem ser VIP.");

    const days = parseInt(args[args.length - 1]) || 30;
    if (days < 1 || days > 365) return message.reply("❌ Duração inválida. Use entre 1 e 365 dias.");

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      {
        $set: {
          "vip.active": true,
          "vip.expiresAt": expiresAt,
          "vip.grantedBy": message.author.id,
          "vip.grantedAt": new Date().toISOString(),
          "profile.aura": "vip_dourada",
        },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("💎 VIP Concedido!")
      .setDescription(`<@${target.id}> agora é **VIP** por **${days} dias**! 🎉`)
      .addFields(
        { name: "⏰ Expira em", value: `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>`, inline: true },
        { name: "👑 Concedido por", value: `<@${message.author.id}>`, inline: true },
        {
          name: "✨ Benefícios",
          value: `• 2x recompensa diária\n• ${VIP_WORK_MULTIPLIER}x no trabalho\n• Aura dourada\n• Badge VIP`,
          inline: false,
        }
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle("💎 Você recebeu VIP!")
            .setDescription(`**${message.author.username}** te concedeu **VIP por ${days} dias** em **${message.guild.name}**! 🎉\n\nAproveite seus benefícios exclusivos!`)
            .setTimestamp(),
        ],
      });
    } catch {}
  },
};
