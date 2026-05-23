const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");
const { addMemory } = require("../../systems/MemorySystem");
const { addHeat } = require("../../systems/SocialHeat");

const stageFlow = {
  none: "conhecendo",
  conhecendo: "flertando",
  flertando: "ficante",
  ficante: "namorando",
  namorando: "alianca",
};

const stageLabels = {
  none: "Nenhum",
  conhecendo: "👀 Conhecendo",
  flertando: "😏 Flertando",
  ficante: "💫 Ficante",
  namorando: "💕 Namorando",
  alianca: "💍 Aliança",
  casado: "💍 Casado(a)",
};

const stageCosts = {
  conhecendo: 0,
  flertando: 0,
  ficante: 0,
  namorando: 0,
  alianca: 3000,
};

const { pendingStage } = require("../../utils/pendingState");

module.exports = {
  name: "namoro",
  aliases: ["dating", "stage", "etapa", "relacionar"],
  description: "Progrida no relacionamento com alguém. Ex: !namoro @user | !namoro ver",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    // Ver status do relacionamento
    if (!message.mentions.users.first() || sub === "ver") {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const stage = dbUser.relationship?.stage || "none";
      const partnerId = dbUser.relationship?.partnerId;
      const stageStarted = dbUser.relationship?.stageStartedAt;
      const daysSince = stageStarted ? Math.floor((Date.now() - new Date(stageStarted).getTime()) / 86400000) : 0;

      const stageList = Object.entries(stageLabels).map(([k, v]) => {
        const current = k === stage;
        return `${current ? "▶️" : "◻️"} ${v}${current ? " ← **você está aqui**" : ""}`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💕 Jornada do Relacionamento")
        .setDescription(stageList)
        .addFields(
          { name: "❤️ Etapa Atual", value: stageLabels[stage] || "Solteiro(a)", inline: true },
          { name: "🤝 Parceiro(a)", value: partnerId ? `<@${partnerId}>` : "Nenhum", inline: true },
          { name: "📅 Nesta etapa há", value: `${daysSince} dia(s)`, inline: true },
        )
        .setFooter({ text: "Use !namoro @user para convidar alguém para evoluir a relação" })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione alguém. Ex: `!namoro @user` ou `!namoro ver`");
    if (target.id === message.author.id) return message.reply("❌ Não pode se relacionar consigo mesmo.");
    if (target.bot) return message.reply("❌ Bots não namoram.");

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    const currentStage = senderDb.relationship?.stage || "none";
    const partnerSameStage = targetDb.relationship?.stage || "none";

    // Já casados não podem usar este comando
    if (currentStage === "casado") {
      return message.reply("❌ Você já é casado(a)! Use `!divorcio` se quiser mudar.");
    }

    // Se já tem parceiro diferente
    if (senderDb.relationship?.partnerId && senderDb.relationship.partnerId !== target.id) {
      return message.reply(`❌ Você já está em um relacionamento com <@${senderDb.relationship.partnerId}>.\nUse \`!divorcio\` para terminar primeiro.`);
    }

    const nextStage = stageFlow[currentStage];
    if (!nextStage) {
      return message.reply("❌ Você já está na etapa máxima antes do casamento. Use `!casar @user` (com anel) para casar!");
    }

    // Custo da aliança
    const cost = stageCosts[nextStage] || 0;
    if (cost > 0 && (senderDb.economy?.wallet || 0) < cost) {
      return message.reply(`❌ Você precisa de **${cost.toLocaleString("pt-BR")} 💰** para essa etapa. Saldo atual: **${(senderDb.economy?.wallet || 0).toLocaleString("pt-BR")} 💰**`);
    }

    // Verificar se já têm um pedido pendente
    const pendingKey = `stage_${message.author.id}_${target.id}`;
    if (pendingStage.has(pendingKey)) {
      return message.reply("❌ Você já tem um pedido pendente com essa pessoa!");
    }

    pendingStage.set(pendingKey, {
      proposerId: message.author.id,
      targetId: target.id,
      proposerName: message.author.username,
      nextStage,
      cost,
      timestamp: Date.now(),
    });

    setTimeout(() => pendingStage.delete(pendingKey), 90000);

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle(`💕 Convite de Relacionamento`)
      .setDescription(
        `<@${message.author.id}> quer evoluir a relação com <@${target.id}>!\n\n` +
        `**Próxima etapa:** ${stageLabels[nextStage]}\n` +
        (cost > 0 ? `**Custo:** ${cost.toLocaleString("pt-BR")} 💰\n` : "") +
        `\n<@${target.id}>, você aceita?`
      )
      .setFooter({ text: "Este pedido expira em 90 segundos" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`stage_accept_${message.author.id}_${target.id}`)
        .setLabel("💕 Aceitar")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`stage_reject_${message.author.id}_${target.id}`)
        .setLabel("❌ Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
