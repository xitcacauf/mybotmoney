const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");

const contractTypes = {
  submissao: { label: "Submissão Total", emoji: "⛓️", desc: "O submisso aceita obedecer ao dominante nas interações do servidor." },
  protecao: { label: "Pacto de Proteção", emoji: "🛡️", desc: "O dominante se compromete a proteger e cuidar do submisso." },
  fidelidade: { label: "Pacto de Fidelidade", emoji: "💎", desc: "Ambos se comprometem a não usar comandos românticos com terceiros." },
  treino: { label: "Contrato de Treino", emoji: "📋", desc: "O dominante passa tarefas periódicas ao submisso." },
  adoracao: { label: "Adoração", emoji: "🌹", desc: "O submisso presta tributos diários ao dominante." },
};

if (!global._pendingContracts) global._pendingContracts = new Map();

module.exports = {
  name: "contrato",
  aliases: ["contract", "pacto"],
  description: "Crie um contrato Dark Love com alguém. Ex: !contrato @user submissao",
  cooldown: 30,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem você quer contratar.\nTipos: `submissao`, `protecao`, `fidelidade`, `treino`, `adoracao`");
    if (target.id === message.author.id) return message.reply("❌ Você não pode fazer contrato consigo mesmo.");
    if (target.bot) return message.reply("❌ Bots não assinam contratos.");

    const typeArg = args[1]?.toLowerCase();
    const contract = contractTypes[typeArg];
    if (!contract) {
      const list = Object.entries(contractTypes).map(([k, v]) => `\`${k}\` — ${v.emoji} ${v.label}`).join("\n");
      return message.reply(`❌ Tipo inválido. Tipos disponíveis:\n${list}`);
    }

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if (senderDb.darkLove?.contractWith) {
      return message.reply(`❌ Você já tem um contrato ativo com <@${senderDb.darkLove.contractWith}>.`);
    }
    if (targetDb.darkLove?.contractWith) {
      return message.reply(`❌ <@${target.id}> já tem um contrato ativo com outro usuário.`);
    }

    const pendingKey = `${message.author.id}_${target.id}`;
    global._pendingContracts.set(pendingKey, {
      proposerId: message.author.id,
      targetId: target.id,
      proposerName: message.author.username,
      type: typeArg,
      timestamp: Date.now(),
    });

    setTimeout(() => global._pendingContracts.delete(pendingKey), 120000);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle(`${contract.emoji} Proposta de Contrato Dark`)
      .setDescription(
        `<@${message.author.id}> propõe um **contrato** com <@${target.id}>.\n\n` +
        `**Tipo:** ${contract.emoji} ${contract.label}\n` +
        `**Termos:** ${contract.desc}\n\n` +
        `<@${target.id}>, você aceita assinar este contrato?`
      )
      .setFooter({ text: "Tudo consensual • Este pedido expira em 2 minutos" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`contract_accept_${message.author.id}_${target.id}`).setLabel("✍️ Assinar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`contract_reject_${message.author.id}_${target.id}`).setLabel("❌ Recusar").setStyle(ButtonStyle.Danger)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
