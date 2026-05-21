const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const roles = [
  { label: "😈 Dominante", value: "Dominante", description: "Toma o controle" },
  { label: "🙇 Submisso", value: "Submisso", description: "Segue ordens" },
  { label: "👑 Dono", value: "Dono", description: "Possui um submisso" },
  { label: "👸 Dona", value: "Dona", description: "Possui um submisso" },
  { label: "🔀 Switch", value: "Switch", description: "Ambos os lados" },
  { label: "👀 Observador", value: "Observador", description: "Apenas assiste" },
  { label: "😤 Brat", value: "Brat", description: "Rebelde" },
  { label: "🐾 Pet", value: "Pet", description: "Pet humano" },
  { label: "😈 Sadista", value: "Sadista", description: "Aprecia dor do outro" },
  { label: "😣 Masoquista", value: "Masoquista", description: "Aprecia a própria dor" },
];

module.exports = {
  name: "darklove",
  aliases: ["dl", "dark", "bdsm"],
  description: "Sistema Dark Love — perfil, coleira, provações",
  cooldown: 10,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🖤 Dark Love System")
      .setDescription(
        `> Bem-vindo ao mundo sombrio.\n> **Seu role atual:** ${dbUser.darkLove.role !== "none" ? `\`${dbUser.darkLove.role}\`` : "Não definido"}\n> **Coleira:** ${dbUser.darkLove.coleira ? `⛓️ De <@${dbUser.darkLove.coleira}>` : "Livre"}`
      )
      .addFields(
        { name: "🔧 Comandos Disponíveis", value: "`!darklove` — Este painel\n`!coleira @user` — Colocar coleira em alguém\n`!confissao` — Confissão anônima\n`!desafio` — Desafio dark", inline: false }
      )
      .setFooter({ text: "🔞 +18 only • Conteúdo adulto • Responsabilidade do usuário" });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("darklove_role")
        .setPlaceholder("🖤 Escolha seu role...")
        .addOptions(roles)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("darklove_profile").setLabel("👤 Meu Perfil").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("darklove_confession").setLabel("🕵️ Confissão Anônima").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("darklove_challenge").setLabel("🎯 Desafio Dark").setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [row, row2] });
  },
};
