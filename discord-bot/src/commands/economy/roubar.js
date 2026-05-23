const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");
const { addHeat } = require("../../systems/SocialHeat");
const { addLedgerEntry } = require("./extrato");

const COOLDOWN_MS = 30 * 60 * 1000; // 30 min
const robberies = new Map();

module.exports = {
  name: "roubar",
  aliases: ["rob", "assaltar", "furtar"],
  description: "Tente roubar moedas da carteira de alguém. Ex: !roubar @user",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem você quer roubar. Ex: `!roubar @user`");
    if (target.id === message.author.id) return message.reply("❌ Não pode se roubar.");
    if (target.bot) return message.reply("❌ Bots não têm dinheiro para roubar.");

    const cooldownKey = `${message.author.id}_${message.guild.id}`;
    const lastRob = robberies.get(cooldownKey);
    if (lastRob && Date.now() - lastRob < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRob)) / 60000);
      return message.reply(`⏳ Você precisa esperar **${remaining} minuto(s)** antes de roubar novamente.`);
    }

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const targetDb = await User.findOrCreate(target.id, message.guild.id, target.username);

    if ((targetDb.economy?.wallet || 0) < 100) {
      return message.reply(`❌ <@${target.id}> está quebrado(a)! Não tem nem 100 💰 na carteira.`);
    }

    robberies.set(cooldownKey, Date.now());

    const successChance = 0.40;
    const success = Math.random() < successChance;

    if (success) {
      const maxSteal = Math.min(Math.floor(targetDb.economy.wallet * 0.25), 3000);
      const stolen = Math.floor(Math.random() * maxSteal) + 50;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": stolen, "economy.totalEarned": stolen } }
      );
      await User.findOneAndUpdate(
        { userId: target.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": -stolen } }
      );

      await addBondXP(message.author.id, message.guild.id, target.id, 2);
      await addHeat(message.guild.id, 3);
      await addLedgerEntry(message.author.id, message.guild.id, "steal", stolen, `Roubou de ${target.username}`).catch(() => {});
      await addLedgerEntry(target.id, message.guild.id, "spend", -stolen, `Roubado por ${message.author.username}`).catch(() => {});

      const scenarios = [
        `entrou pela janela de <@${target.id}> enquanto dormia e pegou a carteira`,
        `distraiu <@${target.id}> com um "olha um pombo!" e roubou tudo`,
        `fez um 171 clássico em <@${target.id}> e saiu correndo`,
        `invadiu o cofre de <@${target.id}> às 3 da manhã`,
        `usou charme e sedução para roubar <@${target.id}> sem que percebesse`,
      ];

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🦹 Roubo Bem-sucedido!")
        .setDescription(`<@${message.author.id}> ${scenarios[Math.floor(Math.random() * scenarios.length)]}!\n\n💰 **+${stolen.toLocaleString("pt-BR")} 💰** roubados!`)
        .addFields(
          { name: "🎯 Vítima", value: `<@${target.id}>`, inline: true },
          { name: "💸 Roubado", value: `${stolen.toLocaleString("pt-BR")} 💰`, inline: true },
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    } else {
      const fine = Math.floor(Math.random() * 500) + 100;
      const actualFine = Math.min(fine, senderDb.economy.wallet || 0);

      if (actualFine > 0) {
        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          { $inc: { "economy.wallet": -actualFine } }
        );
        await addLedgerEntry(message.author.id, message.guild.id, "spend", -actualFine, `Multa: tentativa de roubo`).catch(() => {});
      }

      const failScenarios = [
        `foi flagrado(a) pelas câmeras de segurança de <@${target.id}>`,
        `tropeçou na fuga e foi pego(a) pela polícia`,
        `<@${target.id}> estava acordado(a) e deu um soco em você`,
        `o alarm disparou e todo mundo viu você fugir`,
      ];

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("🚔 Tentativa Fracassada!")
        .setDescription(`<@${message.author.id}> ${failScenarios[Math.floor(Math.random() * failScenarios.length)]}!\n\n💸 Pagou **${actualFine.toLocaleString("pt-BR")} 💰** de multa.`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
  },
};
