const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const houseLevels = [
  { level: 0, name: "Sem Casa", emoji: "🏚️", description: "Você não tem casa ainda. Compre uma na loja!", cost: 0, perks: [] },
  { level: 1, name: "Barraco", emoji: "🏠", description: "Uma casinha simples, mas é sua.", cost: 5000, perks: ["Espaço básico", "+5% XP em calls"] },
  { level: 2, name: "Apartamento", emoji: "🏢", description: "Confortável e moderno no centro.", cost: 15000, perks: ["Garagem privada", "+10% XP em calls", "Chat privado"] },
  { level: 3, name: "Casa Gourmet", emoji: "🏡", description: "Uma bela casa com jardim e churrasqueira.", cost: 35000, perks: ["Jardim de visitas", "+15% bônus econômico", "Visitas ilimitadas"] },
  { level: 4, name: "Chalé Premium", emoji: "🏘️", description: "Um chalé de luxo nas montanhas.", cost: 60000, perks: ["Lareira VIP", "+20% em tudo", "Badge exclusiva"] },
  { level: 5, name: "Mansão", emoji: "🏰", description: "O luxo absoluto. Status máximo.", cost: 100000, perks: ["Piscina olimpíca", "Título Magnata", "+30% em tudo", "Acesso VIP a eventos"] },
];

const themes = ["default", "dark", "neon", "romantico", "gamer", "luxo"];
const themeEmojis = { default: "🏠", dark: "🖤", neon: "💡", romantico: "🌹", gamer: "🎮", luxo: "✨" };

module.exports = {
  name: "casa",
  aliases: ["house", "lar", "moradia", "home"],
  description: "Gerencie sua casa virtual. Ex: !casa | !casa info | !casa tema neon",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const currentLevel = dbUser.house?.level || 0;
    const current = houseLevels[currentLevel];
    const next = houseLevels[currentLevel + 1];
    const theme = dbUser.house?.theme || "default";

    if (sub === "tema" || sub === "decorar" || sub === "theme") {
      const newTheme = args[1]?.toLowerCase();
      if (!newTheme || !themes.includes(newTheme)) {
        const themeList = themes.map((t) => `\`${t}\` ${themeEmojis[t]}`).join(" | ");
        return message.reply(`❌ Tema inválido.\nTemas disponíveis: ${themeList}`);
      }
      if (currentLevel === 0) return message.reply("❌ Você precisa ter uma casa antes de decorar!");

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "house.theme": newTheme } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${themeEmojis[newTheme]} Tema Aplicado!`)
        .setDescription(`Sua casa agora tem o tema **${newTheme}** ${themeEmojis[newTheme]}!`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (sub === "descricao" || sub === "desc" || sub === "bio") {
      if (currentLevel === 0) return message.reply("❌ Você precisa ter uma casa primeiro!");
      const desc = args.slice(1).join(" ").trim();
      if (!desc) return message.reply("❌ Digite uma descrição. Ex: `!casa desc Bem-vindos à minha mansão!`");
      if (desc.length > 150) return message.reply("❌ Descrição muito longa! Máximo 150 caracteres.");

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "house.description": desc } }
      );
      return message.reply("✅ Descrição da casa atualizada!");
    }

    if (sub === "visitar" || sub === "visit") {
      const target = message.mentions.users.first();
      if (!target) return message.reply("❌ Mencione quem você quer visitar. Ex: `!casa visitar @user`");

      const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);
      const tLevel = targetDb.house?.level || 0;
      if (tLevel === 0) return message.reply(`❌ <@${target.id}> não tem casa ainda.`);

      const hInfo = houseLevels[tLevel];
      const tTheme = targetDb.house?.theme || "default";

      await User.findOneAndUpdate(
        { userId: target.id, guildId: message.guild.id },
        { $inc: { "house.visitors": 1 } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(`${hInfo.emoji} Casa de ${target.username}`)
        .setDescription(targetDb.house?.description || `*Sem descrição definida.*`)
        .addFields(
          { name: "🏠 Tipo", value: `${hInfo.emoji} ${hInfo.name}`, inline: true },
          { name: `${themeEmojis[tTheme]} Tema`, value: tTheme, inline: true },
          { name: "👀 Visitantes", value: `${targetDb.house?.visitors || 0}`, inline: true },
          { name: "🎁 Benefícios", value: hInfo.perks.join("\n") || "—", inline: false },
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Proprietário: ${target.username}` })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Vista padrão
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${current.emoji} ${current.name}`)
      .setDescription(
        (dbUser.house?.description ? `*"${dbUser.house.description}"*\n\n` : "") +
        `**${current.description}**`
      )
      .addFields(
        { name: "🏠 Nível", value: `${currentLevel}/5`, inline: true },
        { name: `${themeEmojis[theme]} Tema`, value: theme, inline: true },
        { name: "👀 Visitantes", value: `${dbUser.house?.visitors || 0}`, inline: true },
        { name: "🎁 Benefícios Ativos", value: current.perks.length ? current.perks.join("\n") : "Nenhum — compre uma casa!", inline: false },
      );

    if (next) {
      embed.addFields({
        name: `⬆️ Próximo: ${next.emoji} ${next.name}`,
        value: `**${next.cost.toLocaleString("pt-BR")} 💰** — ${next.description}`,
        inline: false,
      });
    }

    const buttons = [];
    if (next) {
      const canAfford = (dbUser.economy?.wallet || 0) >= next.cost;
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`house_upgrade_${message.author.id}`)
          .setLabel(`⬆️ Melhorar (${next.cost.toLocaleString("pt-BR")} 💰)`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!canAfford)
      );
    }
    if (currentLevel > 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`house_info_${message.author.id}`)
          .setLabel("ℹ️ Detalhes")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const components = buttons.length > 0 ? [new ActionRowBuilder().addComponents(...buttons)] : [];
    await message.reply({ embeds: [embed], components });
  },
};
