const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const archetypes = {
  inocente: { emoji: "🌸", desc: "Puro, ingênuo e cheio de esperança. Acredita no amor verdadeiro.", bonus: "Compatibilidade +15% com românticos", color: 0xffb6c1 },
  possessivo: { emoji: "🔒", desc: "Ama intensamente e com exclusividade. Ciúme como forma de afeto.", bonus: "Obsessão cresce 20% mais rápido", color: 0x800000 },
  dominante: { emoji: "👑", desc: "Natural líder. Prefere estar no controle de tudo.", bonus: "Dominância e charme aumentados", color: 0x4b0082 },
  manipulador: { emoji: "🕸️", desc: "Estratégico nas relações. Sabe exatamente o que quer.", bonus: "Manipulação e sedução aumentadas", color: 0x2f4f4f },
  romantico: { emoji: "💝", desc: "Apaixonado pela ideia do amor. Gestos grandiosos e sentimentais.", bonus: "Presentes valem 2x mais em vínculo", color: 0xff69b4 },
  misterioso: { emoji: "🌑", desc: "Difícil de ler. Atrai por ser imprevisível e profundo.", bonus: "Compatibilidade randômica com bônus surpresa", color: 0x1a1a2e },
  obsessivo: { emoji: "⛓️", desc: "Quando se apega, vai fundo. Lealdade absoluta e intensa.", bonus: "Vínculo máximo 50% mais alto", color: 0x8b0000 },
  carente: { emoji: "🥺", desc: "Precisa de atenção constante. Vulnerável mas extremamente leal.", bonus: "Recebe 2x XP de interações", color: 0x87ceeb },
  independente: { emoji: "🦅", desc: "Livre e autossuficiente. Difícil de conquistar, mas vale cada esforço.", bonus: "Resistência a debuffs relacionais", color: 0x556b2f },
};

const auras = {
  comum: { emoji: "⚪", desc: "Nenhuma aura especial." },
  carente: { emoji: "💙", desc: "Aura de vulnerabilidade que atrai protetores." },
  magnetico: { emoji: "🟡", desc: "Atrai pessoas naturalmente. Popularidade aumentada." },
  venenoso: { emoji: "🟣", desc: "Perigoso e irresistível. Alto risco, alta recompensa." },
  divino: { emoji: "✨", desc: "Raro e poderoso. Desbloqueia eventos especiais." },
};

module.exports = {
  name: "personalidade",
  aliases: ["arquetipo", "aura", "psico"],
  description: "Veja ou escolha seu arquétipo psicológico",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (target && target.id !== message.author.id) {
      const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);
      const arch = archetypes[targetDb.profile?.archetype] || archetypes.misterioso;
      const aura = auras[targetDb.profile?.aura] || auras.comum;
      const embed = new EmbedBuilder()
        .setColor(arch.color)
        .setTitle(`${arch.emoji} Perfil Psicológico — ${target.username}`)
        .setDescription(`**Arquétipo:** ${arch.emoji} ${targetDb.profile?.archetype || "misterioso"}\n${arch.desc}`)
        .addFields(
          { name: "✨ Aura", value: `${aura.emoji} ${targetDb.profile?.aura || "comum"} — ${aura.desc}`, inline: false },
          { name: "⚡ Bônus Passivo", value: arch.bonus, inline: false },
          { name: "🎯 Charme", value: `${targetDb.rpg?.charm || 10}`, inline: true },
          { name: "🕸️ Manipulação", value: `${targetDb.rpg?.manipulation || 5}`, inline: true },
          { name: "💋 Sedução", value: `${targetDb.rpg?.seduction || 5}`, inline: true }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const sub = args[0]?.toLowerCase();

    if (sub === "escolher" || sub === "mudar") {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const lastChange = dbUser.profile?._lastArchetypeChange;
      if (lastChange) {
        const daysSince = (Date.now() - new Date(lastChange).getTime()) / 86400000;
        if (daysSince < 7) {
          const daysLeft = Math.ceil(7 - daysSince);
          return message.reply(`❌ Você pode mudar seu arquétipo novamente em **${daysLeft} dia(s)**.\nArquétipo atual: ${dbUser.profile.archetype}`);
        }
      }

      const options = Object.entries(archetypes).map(([key, val]) => ({
        label: `${val.emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}`,
        value: key,
        description: val.desc.slice(0, 50),
        emoji: val.emoji,
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("personality_select")
          .setPlaceholder("Escolha seu arquétipo...")
          .addOptions(options)
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle("🧠 Escolha seu Arquétipo")
        .setDescription("Seu arquétipo define como você se comporta nas relações e os bônus que recebe.\n\n⚠️ Só pode mudar a cada **7 dias**.")
        .addFields(
          Object.entries(archetypes).map(([k, v]) => ({
            name: `${v.emoji} ${k}`,
            value: `${v.desc}\n*${v.bonus}*`,
            inline: false,
          }))
        )
        .setTimestamp();

      return message.reply({ embeds: [embed], components: [row] });
    }

    // Ver próprio perfil
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const arch = archetypes[dbUser.profile?.archetype] || archetypes.misterioso;
    const aura = auras[dbUser.profile?.aura] || auras.comum;

    const embed = new EmbedBuilder()
      .setColor(arch.color)
      .setTitle(`${arch.emoji} Seu Perfil Psicológico`)
      .setDescription(`**Arquétipo:** ${arch.emoji} ${dbUser.profile?.archetype || "misterioso"}\n${arch.desc}`)
      .addFields(
        { name: "✨ Aura", value: `${aura.emoji} ${dbUser.profile?.aura || "comum"} — ${aura.desc}`, inline: false },
        { name: "⚡ Bônus Passivo", value: arch.bonus, inline: false },
        { name: "🎯 Charme", value: `${dbUser.rpg?.charm || 10}`, inline: true },
        { name: "🕸️ Manipulação", value: `${dbUser.rpg?.manipulation || 5}`, inline: true },
        { name: "💋 Sedução", value: `${dbUser.rpg?.seduction || 5}`, inline: true },
        { name: "🧠 Inteligência", value: `${dbUser.rpg?.intelligence || 10}`, inline: true },
        { name: "👑 Dominância", value: `${dbUser.rpg?.dominance || 5}`, inline: true },
        { name: "🥺 Carência", value: `${dbUser.rpg?.carencia || 5}`, inline: true },
      )
      .setFooter({ text: "Use !personalidade escolher para mudar • Cooldown: 7 dias" })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
