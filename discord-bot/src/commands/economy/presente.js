const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");
const { addHeat } = require("../../systems/SocialHeat");
const { addMemory } = require("../../systems/MemorySystem");

const gifts = [
  { id: "flower", name: "Buquê de Flores", emoji: "💐", price: 500, bondBonus: 5 },
  { id: "chocolate", name: "Caixa de Chocolates", emoji: "🍫", price: 800, bondBonus: 7 },
  { id: "ring_gift", name: "Anel de Prata", emoji: "💍", price: 2000, bondBonus: 15 },
  { id: "heart", name: "Coração de Cristal", emoji: "💎", price: 3000, bondBonus: 20 },
  { id: "crown_gift", name: "Coroa de Ouro", emoji: "👑", price: 5000, bondBonus: 30 },
  { id: "mansion", name: "Miniatura de Mansão", emoji: "🏰", price: 8000, bondBonus: 40 },
  { id: "star", name: "Estrela Dedicada", emoji: "⭐", price: 10000, bondBonus: 50 },
];

module.exports = {
  name: "presente",
  aliases: ["gift", "dar", "oferecer"],
  description: "Dê um presente para alguém. Ex: !presente @user flower | !presente lista",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === "lista" || sub === "ver") {
      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("🎁 Lista de Presentes")
        .setDescription("Use `!presente @user <id>` para dar um presente.\n")
        .addFields(
          gifts.map((g) => ({
            name: `${g.emoji} ${g.name}`,
            value: `ID: \`${g.id}\` | Preço: **${g.price.toLocaleString("pt-BR")} 💰** | Vínculo: **+${g.bondBonus}**`,
            inline: false,
          }))
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mencione quem vai receber. Ex: `!presente @user flower` | `!presente lista`");
    if (target.id === message.author.id) return message.reply("❌ Não pode se presentear.");
    if (target.bot) return message.reply("❌ Bots não recebem presentes.");

    const giftId = args[1]?.toLowerCase();
    if (!giftId) {
      const giftList = gifts.map((g) => `${g.emoji} \`${g.id}\` — ${g.price.toLocaleString("pt-BR")} 💰`).join("\n");
      return message.reply(`❌ Especifique um presente. Disponíveis:\n${giftList}`);
    }

    const gift = gifts.find((g) => g.id === giftId);
    if (!gift) {
      return message.reply(`❌ Presente inválido. Use \`!presente lista\` para ver os disponíveis.`);
    }

    const senderDb = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    if ((senderDb.economy?.wallet || 0) < gift.price) {
      return message.reply(`❌ Você não tem ${gift.price.toLocaleString("pt-BR")} 💰. Saldo atual: ${(senderDb.economy?.wallet || 0).toLocaleString("pt-BR")} 💰`);
    }

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { "economy.wallet": -gift.price } }
    );

    await addBondXP(message.author.id, message.guild.id, target.id, gift.bondBonus);
    await addHeat(message.guild.id, 2);

    const bonds = senderDb.bonds || {};
    if (!bonds[target.id]) bonds[target.id] = { gifts: 0 };
    bonds[target.id].gifts = (bonds[target.id].gifts || 0) + 1;
    await User.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $set: { bonds } });

    const isFirst = (bonds[target.id].gifts || 0) === 1;
    if (isFirst) {
      await addMemory(message.author.id, message.guild.id, "first_gift", `Deu ${gift.emoji} ${gift.name} para ${target.username}`);
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle(`${gift.emoji} Presente Enviado!`)
      .setDescription(
        `<@${message.author.id}> presenteou <@${target.id}> com **${gift.emoji} ${gift.name}**! 🥹\n\n` +
        `💰 **-${gift.price.toLocaleString("pt-BR")} 💰** | ⛓️ Vínculo **+${gift.bondBonus}**`
      )
      .setTimestamp();

    // DM para o presenteado
    try {
      const dm = await target.createDM();
      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.secondary)
            .setTitle(`${gift.emoji} Você recebeu um presente!`)
            .setDescription(`<@${message.author.id}> te enviou **${gift.emoji} ${gift.name}** no servidor **${message.guild.name}**! 🥹`)
            .setTimestamp(),
        ],
      });
    } catch {}

    return message.reply({ embeds: [embed] });
  },
};
