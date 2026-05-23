const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const JsonDB = require("../../utils/JsonDB");

const webDB = new JsonDB("webprofiles");

module.exports = {
  name: "web",
  aliases: ["webnamoro", "online", "procurar"],
  description: "Crie ou visualize seu perfil de namoro online. Ex: !web | !web criar | !web ver | !web desativar",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (sub === "criar" || sub === "ativar" || sub === "on") {
      const bio = args.slice(1).join(" ").trim() || dbUser.profile?.bio || "Sem bio definida.";
      const gender = dbUser.profile?.gender || "Não informado";
      const interests = dbUser.profile?.hobbies?.join(", ") || "Não informados";

      await webDB.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $set: {
            userId: message.author.id,
            guildId: message.guild.id,
            username: message.author.username,
            avatar: message.author.displayAvatarURL({ dynamic: true }),
            bio,
            gender,
            interests,
            active: true,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💻 Perfil Web Ativado!")
        .setDescription(`Seu perfil de namoro online está ativo!\nOutros podem te encontrar com \`!web ver\`.`)
        .addFields(
          { name: "📝 Bio", value: bio, inline: false },
          { name: "⚧ Gênero", value: gender, inline: true },
          { name: "🎮 Interesses", value: interests || "—", inline: true },
          { name: "❤️ Status", value: dbUser.relationship?.stage !== "none" ? "Em relacionamento" : "💔 Solteiro(a)", inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Use !web desativar para sair do modo online" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === "desativar" || sub === "off" || sub === "sair") {
      await webDB.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { active: false } }
      );
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription("✅ Seu perfil web foi desativado. Você não aparece mais nas buscas.")],
      });
    }

    if (sub === "ver" || sub === "lista" || sub === "browse") {
      const profiles = await webDB.find({ guildId: message.guild.id, active: true });

      const sorted = profiles
        .filter((p) => p.userId !== message.author.id)
        .slice(0, 8);

      if (!sorted.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.info)
              .setTitle("💻 Web Namoro")
              .setDescription("Nenhum perfil online no momento!\nSeja o primeiro com `!web criar [sua bio]`."),
          ],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💻 Perfis Online — Web Namoro")
        .setDescription("Pessoas disponíveis no momento:")
        .setTimestamp();

      for (const p of sorted) {
        embed.addFields({
          name: `👤 ${p.username}`,
          value: `> ${(p.bio || "Sem bio").slice(0, 100)}\n⚧ ${p.gender || "?"}  |  🎮 ${(p.interests || "—").slice(0, 50)}`,
          inline: false,
        });
      }

      embed.setFooter({ text: `${sorted.length} perfil(s) online • Use !web criar para aparecer aqui` });
      return message.reply({ embeds: [embed] });
    }

    const myProfile = await webDB.findOne({ userId: message.author.id, guildId: message.guild.id });

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💻 Web Namoro — Seu Perfil")
      .setDescription(
        myProfile?.active
          ? `✅ **Status:** Online — aparecendo nas buscas\n📝 **Bio:** ${myProfile.bio || "Sem bio"}`
          : `❌ **Status:** Offline — não aparece nas buscas\n\nUse \`!web criar [sua bio]\` para ativar seu perfil!`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "📋 Comandos", value: "`!web criar [bio]` — Ativar perfil\n`!web ver` — Ver perfis online\n`!web desativar` — Sair", inline: false }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("web_toggle_profile")
        .setLabel(myProfile?.active ? "❌ Desativar Perfil" : "✅ Ativar Perfil")
        .setStyle(myProfile?.active ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    return message.reply({ embeds: [embed], components: [row] });
  },
};
