const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const JsonDB = require("../../utils/JsonDB");

const webDB = new JsonDB("webprofiles");

module.exports = {
  name: "web",
  aliases: ["webnamoro", "online", "procurar"],
  description: "Perfil de namoro online. Ex: !web criar [bio] | !web ver | !web desativar",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (sub === "criar" || sub === "ativar" || sub === "on") {
      const bio = args.slice(1).join(" ").trim() || dbUser.profile?.bio || "Sem bio definida.";
      const gender = dbUser.profile?.gender || "Não informado";
      const interests = dbUser.profile?.hobbies?.join(", ") || "Não informados";

      try {
        const existing = await webDB.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (existing) {
          await webDB.findOneAndUpdate(
            { userId: message.author.id, guildId: message.guild.id },
            { $set: { bio, gender, interests, active: true, username: message.author.username } }
          );
        } else {
          await webDB.create({
            userId: message.author.id,
            guildId: message.guild.id,
            username: message.author.username,
            avatar: message.author.displayAvatarURL({ dynamic: true }),
            bio, gender, interests,
            active: true,
            createdAt: new Date().toISOString(),
          });
        }
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("💻 Perfil Web Ativado!")
        .setDescription(`Seu perfil está ativo! Outros podem te encontrar com \`!web ver\`.`)
        .addFields(
          { name: "📝 Bio", value: bio, inline: false },
          { name: "⚧ Gênero", value: gender, inline: true },
          { name: "🎮 Interesses", value: interests || "—", inline: true },
          { name: "❤️ Status", value: dbUser.relationship?.stage !== "none" ? "Em relacionamento" : "💔 Solteiro(a)", inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Use !web desativar para sair das buscas" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === "desativar" || sub === "off" || sub === "sair") {
      try {
        await webDB.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          { $set: { active: false } }
        );
      } catch {}
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription("✅ Seu perfil web foi desativado.")],
      });
    }

    if (sub === "ver" || sub === "lista" || sub === "browse") {
      let profiles = [];
      try {
        const raw = await webDB.find({ guildId: message.guild.id, active: true });
        profiles = (Array.isArray(raw) ? raw : []).filter((p) => p.userId !== message.author.id).slice(0, 8);
      } catch {}

      if (!profiles.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.info)
              .setTitle("💻 Web Namoro")
              .setDescription("Nenhum perfil online no momento!\nUse `!web criar [sua bio]` para ser o primeiro."),
          ],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💻 Perfis Online — Web Namoro")
        .setDescription("Pessoas disponíveis no momento:")
        .setTimestamp();

      for (const p of profiles) {
        embed.addFields({
          name: `👤 ${p.username}`,
          value: `> ${(p.bio || "Sem bio").slice(0, 100)}\n⚧ ${p.gender || "?"}  |  🎮 ${(p.interests || "—").slice(0, 50)}`,
          inline: false,
        });
      }

      embed.setFooter({ text: `${profiles.length} perfil(s) online • !web criar para aparecer aqui` });
      return message.reply({ embeds: [embed] });
    }

    let myProfile = null;
    try {
      myProfile = await webDB.findOne({ userId: message.author.id, guildId: message.guild.id });
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💻 Web Namoro — Seu Perfil")
      .setDescription(
        myProfile?.active
          ? `✅ **Status:** Online — aparecendo nas buscas\n📝 **Bio:** ${myProfile.bio || "Sem bio"}`
          : `❌ **Status:** Offline — não aparece nas buscas`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields({
        name: "📋 Comandos",
        value: "`!web criar [bio]` — Ativar perfil\n`!web ver` — Ver perfis online\n`!web desativar` — Sair",
        inline: false,
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
