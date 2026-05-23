const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const Shop = require("../../models/Shop");

const petEmojis = { pet_cat: "🐱", pet_dog: "🐶", pet_rabbit: "🐰", pet_dragon: "🐉" };

const auraItems = { aura_magnetico: "magnetico", aura_venenoso: "venenoso", aura_divino: "divino" };

module.exports = {
  name: "comprar",
  aliases: ["buy", "adquirir"],
  description: "Compre um item da loja. Ex: !comprar ring",
  cooldown: 5,
  async execute(message, args, client) {
    if (!args[0]) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("🛒 Como Comprar")
            .setDescription(
              "Use `!comprar <id_item>` para comprar.\nVeja os itens com `!loja`.\n\nExemplos:\n" +
              "`!comprar ring` — Anel de Noivado\n`!comprar pet_cat` — Gatinho\n`!comprar aura_magnetico` — Aura Magnética"
            )
            .setTimestamp(),
        ],
      });
    }

    const itemId = args[0].toLowerCase();
    let item = await Shop.findOne({ guildId: message.guild.id, itemId, available: true });

    if (!item) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle("❌ Item não encontrado")
            .setDescription(`O item \`${itemId}\` não existe na loja.\nUse **\`!loja\`** para ver os itens disponíveis.`)
            .setTimestamp(),
        ],
      });
    }

    const qty = Math.max(1, parseInt(args[1]) || 1);
    const total = item.price * qty;

    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    if ((dbUser.economy?.wallet || 0) < total) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle("❌ Saldo Insuficiente")
            .setDescription(
              `Você tem **${(dbUser.economy?.wallet || 0).toLocaleString("pt-BR")} 💰** mas precisa de **${total.toLocaleString("pt-BR")} 💰**.`
            )
            .addFields({ name: "💡 Dica", value: "Use `!trabalhar`, `!diario`, `!banco depositar` para ganhar mais!", inline: false })
            .setTimestamp(),
        ],
      });
    }

    const inventoryItem = {
      itemId: item.itemId,
      name: item.name,
      emoji: item.emoji,
      type: item.type,
      quantity: qty,
      purchasedAt: new Date().toISOString(),
    };

    // === PET ===
    if (item.type === "pet") {
      if (dbUser.pet?.adopted) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle("🐾 Você já tem um pet!")
              .setDescription(`Você já tem **${dbUser.pet.emoji} ${dbUser.pet.name}**!\nUse \`!pet largar\` antes de adotar um novo.`)
              .setTimestamp(),
          ],
        });
      }

      const emoji = petEmojis[item.itemId] || "🐾";
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": -total },
          $set: {
            "pet.adopted": true,
            "pet.name": item.name,
            "pet.type": item.itemId,
            "pet.emoji": emoji,
            "pet.hunger": 100,
            "pet.happiness": 100,
            "pet.lastCare": new Date().toISOString(),
            "pet.adoptedAt": new Date().toISOString(),
          },
          $push: { inventory: inventoryItem },
        }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`${emoji} Pet Adotado!`)
            .setDescription(`Você adotou **${item.name}**! Cuide bem dele.\nUse \`!pet\` para ver seu pet.`)
            .addFields({ name: "💰 Pago", value: `${total.toLocaleString("pt-BR")} 💰`, inline: true })
            .setTimestamp(),
        ],
      });
    }

    // === AURA ===
    if (auraItems[item.itemId]) {
      const auraName = auraItems[item.itemId];
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": -total },
          $set: { "profile.aura": auraName, "profile.auraExpiry": expiryDate },
          $push: { inventory: inventoryItem },
        }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`${item.emoji} Aura Ativada!`)
            .setDescription(`Sua aura agora é **${item.emoji} ${auraName}** por 7 dias!\nIsto aparece no seu \`!perfil\`.`)
            .addFields({ name: "💰 Pago", value: `${total.toLocaleString("pt-BR")} 💰`, inline: true })
            .setTimestamp(),
        ],
      });
    }

    // === BADGE VIP ===
    if (item.itemId === "badge_vip") {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": -total },
          $set: { "profile.eliteTitle": "vip", "profile.eliteTitleExpiry": expiryDate },
          $push: { inventory: inventoryItem },
        }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle("👑 Status VIP Ativo!")
            .setDescription("Você agora tem **Badge VIP** por 30 dias! Aparece no seu `!perfil`.")
            .setTimestamp(),
        ],
      });
    }

    // === ITENS GENÉRICOS (ring, flower, etc.) ===
    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      {
        $inc: { "economy.wallet": -total },
        $push: { inventory: inventoryItem },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle("✅ Compra Realizada!")
      .setDescription(`Você comprou **${qty}x ${item.emoji} ${item.name}**!`)
      .addFields(
        { name: "💰 Pago", value: `${total.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "💰 Saldo restante", value: `${((dbUser.economy?.wallet || 0) - total).toLocaleString("pt-BR")} 💰`, inline: true }
      )
      .setFooter({ text: "Use !inventario para ver seus itens • !usar <id> para consumíveis" })
      .setTimestamp();

    if (item.itemId === "ring") {
      embed.addFields({ name: "💍 Dica", value: "Use `!casar @user` para pedir alguém em casamento!", inline: false });
    }

    await message.reply({ embeds: [embed] });
  },
};
