const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const consumableEffects = {
  potion_xp: { name: "Poção de XP ⚗️", duration: 60, effect: "xpDouble", desc: "Dobra XP ganho por 60 minutos!" },
  potion_luck: { name: "Poção da Sorte 🍀", duration: 30, effect: "luckyBoost", desc: "+50% chance em crimes por 30 minutos!" },
  charm_boost: { name: "Poção de Charme 💋", duration: 0, effect: "charmPerm", desc: "+5 charme permanente!" },
};

const activeEffects = new Map();

function hasEffect(userId, effect) {
  const effects = activeEffects.get(userId) || [];
  return effects.some((e) => e.effect === effect && e.expiresAt > Date.now());
}

function addEffect(userId, effect, durationMin) {
  const effects = activeEffects.get(userId) || [];
  effects.push({ effect, expiresAt: Date.now() + durationMin * 60 * 1000 });
  activeEffects.set(userId, effects);
}

module.exports = {
  name: "usar",
  aliases: ["use", "consumir"],
  description: "Use um item consumível do inventário. Ex: !usar potion_xp",
  cooldown: 5,
  async execute(message, args, client) {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) {
      const list = Object.entries(consumableEffects)
        .map(([id, e]) => `\`${id}\` — ${e.name}: ${e.desc}`)
        .join("\n");
      return message.reply(`❌ Especifique o item. Consumíveis disponíveis:\n${list}`);
    }

    const effect = consumableEffects[itemId];
    if (!effect) return message.reply(`❌ Item \`${itemId}\` não é consumível ou não existe.`);

    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const invIdx = (dbUser.inventory || []).findIndex((i) => i.itemId === itemId);
    if (invIdx === -1) return message.reply(`❌ Você não tem **${effect.name}** no inventário.\nCompre na \`!loja\`.`);

    // Remove o item do inventário
    const newInv = [...(dbUser.inventory || [])];
    newInv.splice(invIdx, 1);

    if (effect.effect === "charmPerm") {
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { inventory: newInv }, $inc: { "rpg.charm": 5 } }
      );
    } else {
      addEffect(message.author.id, effect.effect, effect.duration);
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { inventory: newInv } }
      );
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`✅ Item Usado: ${effect.name}`)
      .setDescription(effect.desc + (effect.duration > 0 ? `\n⏱️ Duração: **${effect.duration} minutos**` : "\n♾️ Efeito permanente!"))
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
  hasEffect,
  addEffect,
};
