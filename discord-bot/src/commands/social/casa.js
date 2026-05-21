const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const houseLevels = [
  { level: 0, name: "Sem Casa", emoji: "🏚️", description: "Você não tem casa ainda.", cost: 0 },
  { level: 1, name: "Barraco", emoji: "🏠", description: "Uma casinha simples.", cost: 5000 },
  { level: 2, name: "Apartamento", emoji: "🏢", description: "Confortável e moderno.", cost: 15000 },
  { level: 3, name: "Casa Gourmet", emoji: "🏡", description: "Uma bela casa com jardim.", cost: 35000 },
  { level: 4, name: "Chalé", emoji: "🏘️", description: "Um chalé charmoso.", cost: 60000 },
  { level: 5, name: "Mansão", emoji: "🏰", description: "Luxo e ostentação!", cost: 100000 },
];

module.exports = {
  name: "casa",
  aliases: ["house", "lar", "moradia"],
  description: "Gerencie sua casa virtual",
  cooldown: 10,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const currentLevel = dbUser.house.level;
    const current = houseLevels[currentLevel];
    const next = houseLevels[currentLevel + 1];

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${current.emoji} ${current.name}`)
      .setDescription(`**${current.description}**`)
      .addFields(
        { name: "🏠 Nível", value: `${currentLevel}`, inline: true },
        { name: "💰 Valor", value: `${current.cost.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🛋️ Móveis", value: `${dbUser.house.furniture.length} itens`, inline: true }
      );

    const buttons = [];
    if (next) {
      embed.addFields({ name: "⬆️ Próximo nível", value: `${next.emoji} **${next.name}** — ${next.cost.toLocaleString("pt-BR")} 💰` });
      buttons.push(new ButtonBuilder().setCustomId(`house_upgrade_${message.author.id}`).setLabel(`⬆️ Melhorar Casa (${next.cost.toLocaleString("pt-BR")} 💰)`).setStyle(ButtonStyle.Primary));
    }
    buttons.push(new ButtonBuilder().setCustomId("house_decorate").setLabel("🛋️ Decorar").setStyle(ButtonStyle.Secondary));

    const row = new ActionRowBuilder().addComponents(...buttons);
    await message.reply({ embeds: [embed], components: [row] });
  },
};
