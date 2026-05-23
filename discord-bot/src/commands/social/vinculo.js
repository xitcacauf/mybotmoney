const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { getTopBonds, getObsessionLabel } = require("../../systems/ObsessionSystem");

module.exports = {
  name: "vinculo",
  aliases: ["bond", "obsessao", "conexao", "ligacao"],
  description: "Veja seus vínculos de obsessão com outros usuários. Ex: !vinculo [@user]",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const bonds = dbUser.bonds || {};
    const entries = Object.entries(bonds)
      .map(([uid, data]) => ({ userId: uid, ...data }))
      .sort((a, b) => (b.bondXP || 0) - (a.bondXP || 0))
      .slice(0, 8);

    if (!entries.length) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle("⛓️ Vínculos de Obsessão")
        .setDescription(`${target.id === message.author.id ? "Você não tem" : `**${target.username}** não tem`} vínculos registrados ainda.\nInteraja com pessoas para criar conexões!`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Se mencionou um usuário específico, ver detalhes
    const specificTarget = message.mentions.users.first();
    if (specificTarget && args[1]) {
      const bond = bonds[specificTarget.id];
      if (!bond) {
        return message.reply(`❌ Nenhum vínculo com <@${specificTarget.id}> ainda.`);
      }
      const label = getObsessionLabel(bond.obsessionLevel || 0);
      const embed = new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle(`⛓️ Vínculo com ${specificTarget.username}`)
        .setDescription(`**${message.author.username}** → **${specificTarget.username}**`)
        .addFields(
          { name: "🔥 Nível de Obsessão", value: `${label} (${bond.obsessionLevel || 0}%)`, inline: true },
          { name: "⚡ Bond XP", value: `${bond.bondXP || 0}`, inline: true },
          { name: "💬 Interações", value: `${bond.interactions || 0}`, inline: true },
          { name: "📞 Minutos em Call", value: `${bond.callMinutes || 0}`, inline: true },
          { name: "🎁 Presentes Dados", value: `${bond.gifts || 0}`, inline: true },
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const bondList = entries.map((b, i) => {
      const label = getObsessionLabel(b.obsessionLevel || 0);
      return `**${i + 1}.** <@${b.userId}> — ${label} \`${b.bondXP || 0} XP\``;
    }).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle(`⛓️ Vínculos de Obsessão — ${target.username}`)
      .setDescription(bondList)
      .addFields({ name: "💡 Dica", value: "Interaja mais com alguém para aumentar o vínculo!\nApós certo nível, desbloqueios especiais aparecem.", inline: false })
      .setFooter({ text: "Use !vinculo @user para detalhes de um vínculo específico" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
