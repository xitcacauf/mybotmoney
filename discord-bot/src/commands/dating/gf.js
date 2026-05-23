const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");

module.exports = {
  name: "gf",
  aliases: ["namorada", "namorado", "parceiro", "match"],
  description: "Procure ou ofereça-se como parceiro(a). Ex: !gf | !gf quero | !gf ver",
  cooldown: 15,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (sub === "quero" || sub === "procurando" || sub === "livre") {
      const msg = args.slice(1).join(" ").trim() || "Estou disponível para um relacionamento!";

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "dating.active": true, "dating.profileData": { lookingFor: msg, updatedAt: new Date().toISOString() } } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💌 Procurando Parceiro(a)!")
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setDescription(`**${message.author.username}** está disponível!\n\n> *${msg}*`)
        .addFields(
          { name: "❤️ Status Atual", value: dbUser.relationship?.stage === "none" ? "💔 Solteiro(a)" : "💕 " + (dbUser.relationship?.stage || "Solteiro(a)"), inline: true },
          { name: "⭐ Nível", value: `${dbUser.social?.level || 1}`, inline: true },
          { name: "🌟 Aura", value: dbUser.profile?.aura || "comum", inline: true }
        )
        .setFooter({ text: "Use !gf ver para ver quem está disponível" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gf_interest_${message.author.id}`).setLabel("💌 Demonstrar Interesse").setStyle(ButtonStyle.Primary)
      );

      return message.reply({ embeds: [embed], components: [row] });
    }

    if (sub === "ver" || sub === "lista" || sub === "disponiveis") {
      const allUsers = await User.find({ guildId: message.guild.id, "dating.active": true });

      const available = Array.isArray(allUsers)
        ? allUsers.filter((u) => u.userId !== message.author.id && u.relationship?.stage === "none").slice(0, 8)
        : [];

      if (!available.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.info)
              .setTitle("💌 Procurando Parceiro(a)")
              .setDescription("Nenhuma pessoa disponível no momento.\nUse `!gf quero [mensagem]` para aparecer aqui!"),
          ],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💌 Pessoas Disponíveis")
        .setDescription("Solteiros(as) procurando alguém especial:")
        .setTimestamp();

      for (const u of available) {
        const msg = u.dating?.profileData?.lookingFor || "Disponível para um relacionamento";
        embed.addFields({
          name: `💕 ${u.username} — Nível ${u.social?.level || 1}`,
          value: `> *${msg.slice(0, 120)}*`,
          inline: false,
        });
      }

      embed.setFooter({ text: `${available.length} pessoa(s) disponível(is) • !gf quero [mensagem] para aparecer aqui` });
      return message.reply({ embeds: [embed] });
    }

    if (sub === "parar" || sub === "off") {
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "dating.active": false } }
      );
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription("✅ Você saiu do modo de busca.")],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💌 Procurar Parceiro(a) — GF/BF")
      .setDescription(
        dbUser.dating?.active
          ? "💚 Você está **ativo** nas buscas! Outros podem te encontrar."
          : "❌ Você está **inativo** nas buscas. Use `!gf quero` para aparecer!"
      )
      .addFields(
        { name: "📋 Comandos", value: "`!gf quero [mensagem]` — Aparecer nas buscas\n`!gf ver` — Ver quem está disponível\n`!gf parar` — Sair das buscas", inline: false }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
