const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");
const { pendingContracts } = require("../../utils/pendingState");
const { postNews } = require("../../utils/newsChannel");

const contractTypes = {
  submissao: {
    label: "Submissão Total",
    emoji: "⛓️",
    desc: "A submissa(o) deve cumprir **TODOS** os desafios enviados pelo dono, sem exceção.",
    rules: [
      "✅ Deve cumprir todo `!desafio` recebido",
      "✅ Deve enviar `!prova` no mesmo dia em que receber o desafio",
      "✅ O bot monitora o cumprimento diariamente",
      "❌ **Descumprir = reset completo do personagem (zero)**",
      "ℹ️ Se o dono não enviar desafio, não há penalidade para a submissa",
    ],
  },
  protecao: {
    label: "Pacto de Proteção",
    emoji: "🛡️",
    desc: "O dono se compromete a defender e proteger a pessoa em todas as situações do servidor.",
    rules: [
      "✅ Dono deve defender a pessoa protegida em disputas",
      "✅ Dono não pode ficar inativo por mais de 7 dias sem aviso",
      "✅ A pessoa protegida tem seus direitos garantidos pelo dono",
      "❌ Falhar na proteção repetidamente pode quebrar o contrato",
      "ℹ️ O protegido pode romper o contrato a qualquer momento",
    ],
  },
  fidelidade: {
    label: "Pacto de Fidelidade",
    emoji: "💎",
    desc: "O dono pode ter outros relacionamentos. A pessoa com coleira **só pode** se relacionar com o dono.",
    rules: [
      "✅ O dono pode usar comandos românticos com qualquer pessoa",
      "✅ O dono pode ter outros relacionamentos normalmente",
      "❌ A pessoa com coleira NÃO pode usar `!namoro`, `!casar`, `!gf`, `!web` com outros",
      "❌ Interação romântica com terceiros = **reset completo do personagem**",
      "ℹ️ O monitoramento é baseado em desafios e provas diárias",
    ],
  },
  treino: {
    label: "Contrato de Treino",
    emoji: "📋",
    desc: "Os dois se comprometem em sessões de treino e entrosamento conjunto regulares.",
    rules: [
      "✅ Ambos devem participar de sessões regulares de treino",
      "✅ Use `!faculdade estudar` em conjunto como check-in",
      "✅ O dono passa desafios de crescimento periódicos",
      "✅ Foco no crescimento mútuo como equipe",
      "ℹ️ Inatividade prolongada pode quebrar o contrato",
    ],
  },
  adoracao: {
    label: "Adoração",
    emoji: "🌹",
    desc: "A adoradora deve criar uma fanfic do dono e enviar uma mensagem fofa diariamente.",
    rules: [
      "✅ Deve enviar uma mensagem fofa ao dono todo dia",
      "✅ Deve criar pelo menos uma fanfic/tributo por semana",
      "✅ O cumprimento é verificado via `!prova` diário",
      "❌ Falhar no envio diário = **reset completo do personagem**",
      "ℹ️ O dono define os temas de fanfic via `!desafio`",
    ],
  },
};

const RESET_COMMAND_DESC = "\n\n⚠️ Em todos os contratos, o dono pode aplicar **`!contrato resetar @user`** como punição máxima. O bot calcula cumprimentos via `!desafio` e `!prova` diários.";

module.exports = {
  name: "contrato",
  aliases: ["contract", "pacto"],
  description: "Contratos Dark Love com regras e consequências. Ex: !contrato @user submissao | !contrato resetar @user | !contrato ver",
  cooldown: 30,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === "ver" || sub === "meu" || sub === "status") {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const contract = dbUser.darkLove?.contractType ? contractTypes[dbUser.darkLove.contractType] : null;

      if (!contract) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.info)
              .setTitle("📜 Seu Contrato")
              .setDescription("Você não tem nenhum contrato ativo no momento.\nUse `!contrato @user <tipo>` para propor um."),
          ],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle(`${contract.emoji} Contrato Ativo — ${contract.label}`)
        .setDescription(contract.desc)
        .addFields(
          { name: "🤝 Com", value: `<@${dbUser.darkLove.contractWith}>`, inline: true },
          { name: "📅 Desde", value: dbUser.darkLove.contractTerms ? `<t:${Math.floor(new Date(dbUser.darkLove.contractTerms).getTime() / 1000)}:R>` : "—", inline: true },
          { name: "📋 Regras do Contrato", value: contract.rules.join("\n"), inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === "resetar" || sub === "reset" || sub === "punir") {
      const target = message.mentions.members.first();
      if (!target) return message.reply("❌ Mencione o usuário. Ex: `!contrato resetar @user`");

      const targetDb = await User.findOrCreate(target.id, message.guild.id, target.user.username);
      const ownerDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

      const isCollarOwner = targetDb.darkLove?.coleira === message.author.id;
      const isContractOwner = targetDb.darkLove?.contractWith === message.author.id || ownerDb.darkLove?.contractWith === target.id;

      if (!isCollarOwner && !isContractOwner) {
        return message.reply("❌ Você não é o dono da coleira ou contrato desta pessoa.");
      }

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("⚠️ Confirmar Reset do Personagem")
        .setDescription(
          `Você está prestes a **resetar completamente** o personagem de <@${target.id}>.\n\n` +
          `**O que será zerado:**\n` +
          `💰 Economia (carteira → 1000, banco → 0)\n` +
          `⭐ Nível e XP (tudo para o início)\n` +
          `❤️ Status de relacionamento\n` +
          `⛓️ Coleira removida\n` +
          `🎓 Progresso de faculdade\n\n` +
          `> *Esta ação é irreversível. Use com responsabilidade.*`
        )
        .setFooter({ text: "Esta ação é logada e visível para os admins" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`contract_do_reset_${target.id}_${message.author.id}`)
          .setLabel("💀 Confirmar Reset")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("contract_cancel_reset")
          .setLabel("❌ Cancelar")
          .setStyle(ButtonStyle.Secondary)
      );

      return message.reply({ content: `<@${message.author.id}>`, embeds: [embed], components: [row] });
    }

    if (sub === "tipos" || sub === "listar" || sub === "lista") {
      const embed = new EmbedBuilder()
        .setColor(0x1a0a2e)
        .setTitle("📜 Tipos de Contrato Dark Love")
        .setDescription(`Use \`!contrato @user <tipo>\` para propor.${RESET_COMMAND_DESC}`)
        .setTimestamp();

      for (const [id, c] of Object.entries(contractTypes)) {
        embed.addFields({
          name: `${c.emoji} ${c.label} — \`${id}\``,
          value: `${c.desc}\n${c.rules.slice(0, 2).join("\n")}`,
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    if (!target) {
      const list = Object.entries(contractTypes).map(([k, v]) => `\`${k}\` — ${v.emoji} **${v.label}**`).join("\n");
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1a0a2e)
            .setTitle("📜 Contratos Dark Love")
            .setDescription(`Mencione alguém e escolha o tipo de contrato.\n\n${list}\n\nUse \`!contrato tipos\` para ver as regras completas.`),
        ],
      });
    }

    if (target.id === message.author.id) return message.reply("❌ Você não pode fazer contrato consigo mesmo.");
    if (target.bot) return message.reply("❌ Bots não assinam contratos.");

    const typeArg = args[1]?.toLowerCase();
    const contract = contractTypes[typeArg];
    if (!contract) {
      const list = Object.entries(contractTypes).map(([k, v]) => `\`${k}\` — ${v.emoji} ${v.label}`).join("\n");
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("❌ Tipo de contrato inválido")
            .setDescription(`Tipos disponíveis:\n${list}\n\nUse \`!contrato tipos\` para ver as regras completas.`),
        ],
      });
    }

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if (senderDb.darkLove?.contractWith) {
      return message.reply(`❌ Você já tem um contrato ativo com <@${senderDb.darkLove.contractWith}>.\nUse \`!contrato ver\` para ver os detalhes.`);
    }
    if (targetDb.darkLove?.contractWith) {
      return message.reply(`❌ <@${target.id}> já tem um contrato ativo com outro usuário.`);
    }

    const pendingKey = `${message.author.id}_${target.id}`;
    pendingContracts.set(pendingKey, {
      proposerId: message.author.id,
      targetId: target.id,
      proposerName: message.author.username,
      type: typeArg,
      timestamp: Date.now(),
    });
    setTimeout(() => pendingContracts.delete(pendingKey), 120000);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle(`${contract.emoji} Proposta de Contrato — ${contract.label}`)
      .setDescription(
        `<@${message.author.id}> propõe um **contrato Dark Love** com <@${target.id}>.\n\n` +
        `**📋 Tipo:** ${contract.emoji} ${contract.label}\n` +
        `**📝 Descrição:** ${contract.desc}\n\n` +
        `**⚖️ Regras:**\n${contract.rules.join("\n")}\n\n` +
        `<@${target.id}>, você aceita assinar este contrato com todas as suas consequências?`
      )
      .setFooter({ text: "Tudo consensual • Leia as regras com atenção • Expira em 2 minutos" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`contract_accept_${message.author.id}_${target.id}`).setLabel("✍️ Assinar Contrato").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`contract_reject_${message.author.id}_${target.id}`).setLabel("❌ Recusar").setStyle(ButtonStyle.Danger)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
