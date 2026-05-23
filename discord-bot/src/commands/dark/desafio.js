const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const { addBondXP } = require("../../systems/ObsessionSystem");

module.exports = {
  name: "desafio",
  aliases: ["challenge", "darkdesafio"],
  description: "Desafie alguém com um desafio que você criou. Ex: !desafio @user escreva o desafio aqui",
  cooldown: 30,
  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.accent)
            .setTitle("🎯 Como usar o Desafio")
            .setDescription(
              "**Você** cria o desafio — o bot não gera automaticamente!\n\n" +
              "**Formato:**\n`!desafio @user <o desafio que você inventou>`\n\n" +
              "**Exemplos de desafios:**\n" +
              "`!desafio @Ana Conte um segredo que nunca contou a ninguém`\n" +
              "`!desafio @Carlos Manda uma mensagem de voz confessando algo`\n" +
              "`!desafio @Maria Descreva seu tipo ideal de parceiro(a) com detalhes`\n" +
              "`!desafio @João Qual foi a coisa mais ousada que você já fez?`"
            )
            .setFooter({ text: "Seja criativo — o desafio vem da sua cabeça! 😈" }),
        ],
      });
    }

    if (target.id === message.author.id) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription("❌ Você não pode se desafiar.")],
      });
    }
    if (target.bot) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription("❌ Bots não aceitam desafios.")],
      });
    }

    const challengeText = args.slice(1).join(" ").trim();

    if (!challengeText) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("✍️ Escreva o Desafio!")
            .setDescription(
              `Você mencionou <@${target.id}>, mas não escreveu o desafio!\n\n` +
              `**Exemplo:**\n\`!desafio @${target.username} Conte um segredo que nunca contou a ninguém\`\n\n` +
              `*O desafio deve ser escrito por você — não é automático.*`
            )
            .setFooter({ text: "Use a criatividade! 😈" }),
        ],
      });
    }

    if (challengeText.length > 300) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription("❌ Desafio muito longo! Máximo 300 caracteres.")],
      });
    }

    await addBondXP(message.author.id, message.guild.id, target.id, 3).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🎯 Desafio Lançado!")
      .setDescription(`<@${message.author.id}> desafiou <@${target.id}>!\n\n> **${challengeText}**`)
      .addFields(
        { name: "😈 Desafiante", value: `<@${message.author.id}>`, inline: true },
        { name: "🎯 Desafiado", value: `<@${target.id}>`, inline: true }
      )
      .setFooter({ text: "Aceite o desafio ou seja covarde... 😈" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("darklove_challenge").setLabel("🎲 Sortear Tema de Desafio").setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
  },
};
