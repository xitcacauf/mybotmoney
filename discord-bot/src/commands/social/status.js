const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const eliteTitles = [
  { id: "casal_mes", label: "💑 Casal do Mês", desc: "O casal mais ativo do mês", color: 0xff69b4, duration: 30 },
  { id: "dominante_supremo", label: "👑 Dominante Supremo", desc: "O mais dominante do servidor", color: 0x4b0082, duration: 7 },
  { id: "rainha_luxuria", label: "🌹 Rainha da Luxúria", desc: "A mais desejada do servidor", color: 0x8b0000, duration: 7 },
  { id: "magnata", label: "💎 Magnata", desc: "O mais rico do servidor", color: 0xffd700, duration: 7 },
  { id: "manipulador_social", label: "🕸️ Manipulador Social", desc: "O mais influente das relações", color: 0x2f4f4f, duration: 7 },
  { id: "mais_desejado", label: "🔥 Mais Desejado(a)", desc: "Quem todos querem conquistar", color: 0xff4500, duration: 7 },
  { id: "coracao_partido", label: "💔 Coração Partido", desc: "O drama das relações", color: 0x555555, duration: 3 },
  { id: "solitario", label: "🌑 Alma Solitária", desc: "O mais misterioso e reservado", color: 0x1a1a2e, duration: 3 },
];

module.exports = {
  name: "status",
  aliases: ["titulo", "elite", "estatuto"],
  description: "Veja títulos de elite do servidor. Ex: !status | !status @user",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (target) {
      const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);
      const title = dbUser.profile?.eliteTitle;
      const expiry = dbUser.profile?.eliteTitleExpiry;
      const isActive = title && expiry && new Date(expiry) > new Date();

      const embed = new EmbedBuilder()
        .setColor(isActive ? (eliteTitles.find((t) => t.id === title)?.color || config.colors.primary) : 0x555555)
        .setTitle(`👑 Status Elite — ${target.username}`)
        .setDescription(
          isActive
            ? `**Título:** ${eliteTitles.find((t) => t.id === title)?.label || title}\n**Expira:** <t:${Math.floor(new Date(expiry).getTime() / 1000)}:R>`
            : "Sem título de elite ativo no momento."
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Listar todos os títulos e atuais detentores
    const allUsers = await User.find({ guildId: message.guild.id });
    const now = new Date();

    const activeHolders = eliteTitles.map((t) => {
      const holder = allUsers._results
        ? allUsers._results.find((u) => u.profile?.eliteTitle === t.id && u.profile?.eliteTitleExpiry && new Date(u.profile.eliteTitleExpiry) > now)
        : null;
      return { ...t, holder: holder ? `<@${holder.userId}>` : "*Vago*" };
    });

    const titleList = activeHolders.map((t) => `${t.label}\n└ ${t.holder} — *${t.desc}*`).join("\n\n");

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("👑 Títulos de Elite do Servidor")
      .setDescription(titleList || "Nenhum título ativo.")
      .setFooter({ text: "Títulos são atribuídos automaticamente por atividade e rankings" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
