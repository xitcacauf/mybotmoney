const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { getObsessionLabel } = require("../../systems/ObsessionSystem");

const archetypeEmojis = {
  inocente: "🌸", possessivo: "🔒", dominante: "👑", manipulador: "🕸️",
  romantico: "💝", misterioso: "🌑", obsessivo: "⛓️", carente: "🥺", independente: "🦅",
};

const stageLabels = {
  none: "💔 Solteiro(a)",
  conhecendo: "👀 Conhecendo alguém",
  flertando: "😏 Flertando",
  ficante: "💫 Ficante",
  namorando: "💕 Namorando",
  alianca: "💍 Aliança",
  casado: "💍 Casado(a)",
  familia: "👨‍👩‍👧 Família",
};

const contractTypeLabels = {
  submissao: "⛓️ Submissão",
  protecao: "🛡️ Proteção",
  fidelidade: "💎 Fidelidade",
  treino: "📋 Treino",
  adoracao: "🌹 Adoração",
};

module.exports = {
  name: "perfil",
  aliases: ["profile", "eu"],
  description: "Veja seu perfil social ou de outro membro",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const stage = dbUser.relationship?.stage || (dbUser.relationship?.status === "married" ? "casado" : "none");
    const stageLabel = stageLabels[stage] || "💔 Solteiro(a)";

    const partnerStr = dbUser.relationship?.partnerId
      ? `\n└ com <@${dbUser.relationship.partnerId}>`
      : "";

    const archetype = dbUser.profile?.archetype || "misterioso";
    const archEmoji = archetypeEmojis[archetype] || "🌑";

    // Título elite
    const eliteTitle = dbUser.profile?.eliteTitle;
    const eliteExpiry = dbUser.profile?.eliteTitleExpiry;
    const titleActive = eliteTitle && eliteExpiry && new Date(eliteExpiry) > new Date();

    // Coleira
    const coleiraStr = dbUser.darkLove?.coleira ? `⛓️ De <@${dbUser.darkLove.coleira}>` : "—";

    // Contrato
    const contractStr = dbUser.darkLove?.contractWith && dbUser.darkLove?.contractType
      ? `${contractTypeLabels[dbUser.darkLove.contractType] || dbUser.darkLove.contractType} com <@${dbUser.darkLove.contractWith}>`
      : "—";

    // Vínculo mais forte
    const bonds = dbUser.bonds || {};
    const topBond = Object.entries(bonds).sort((a, b) => (b[1].bondXP || 0) - (a[1].bondXP || 0))[0];
    const topBondStr = topBond ? `${getObsessionLabel(topBond[1].obsessionLevel || 0)} com <@${topBond[0]}>` : "—";

    // Casa
    const houseLevels = ["🏚️ Sem Casa", "🏠 Barraco", "🏢 Apartamento", "🏡 Casa Gourmet", "🏘️ Chalé", "🏰 Mansão"];
    const houseStr = houseLevels[dbUser.house?.level || 0] || "🏚️ Sem Casa";

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({
        name: `${titleActive ? `[${eliteTitle?.toUpperCase()}] ` : ""}${target.username} — Perfil Social`,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(dbUser.profile?.photo || target.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "📝 Bio", value: dbUser.profile?.bio || "*Sem bio definida.*", inline: false },
        { name: "❤️ Status Rel.", value: stageLabel + partnerStr, inline: true },
        { name: "⭐ Nível", value: `${dbUser.social?.level || 1}`, inline: true },
        { name: "💬 Mensagens", value: `${(dbUser.social?.messages || 0).toLocaleString("pt-BR")}`, inline: true },
        { name: "💰 Fortuna", value: `${((dbUser.economy?.wallet || 0) + (dbUser.economy?.bank || 0)).toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "⭐ Reputação", value: `${dbUser.profile?.reputation || 0}`, inline: true },
        { name: "🏠 Casa", value: houseStr, inline: true },
        { name: `${archEmoji} Arquétipo`, value: archetype, inline: true },
        { name: "🌟 Aura", value: dbUser.profile?.aura || "comum", inline: true },
        { name: "👶 Filhos", value: `${(dbUser.relationship?.children || []).length}`, inline: true },
        { name: "🖤 Dark Role", value: dbUser.darkLove?.role !== "none" ? dbUser.darkLove.role : "—", inline: true },
        { name: "⛓️ Coleira", value: coleiraStr, inline: true },
        { name: "📜 Contrato", value: contractStr, inline: true },
        { name: "🔗 Vínculo Mais Forte", value: topBondStr, inline: false },
        { name: "📸 Memórias", value: `${(dbUser.relationship?.memories || []).length} memória(s)`, inline: true },
        { name: "🎯 Admiradores Secretos", value: `${(dbUser.secretAdmirers || []).length}`, inline: true },
      )
      .setFooter({ text: `ID: ${target.id} • Use !personalidade, !vinculo, !memorias` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rep_${target.id}`)
        .setLabel("⭐ Dar Reputação")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(target.id === message.author.id),
      new ButtonBuilder()
        .setCustomId(`profile_memorias_${target.id}`)
        .setLabel("📸 Memórias")
        .setStyle(ButtonStyle.Secondary),
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
