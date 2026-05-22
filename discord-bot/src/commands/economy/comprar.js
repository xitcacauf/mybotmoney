const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const Shop = require("../../models/Shop");

module.exports = {
  name: "comprar",
  aliases: ["buy", "adquirir"],
  description: "Compre um item da loja. Ex: !comprar ring",
  cooldown: 5,
  async execute(message, args, client) {
    if (!args[0]) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle("🛒 Como Comprar")
        .setDescription("Use `!comprar <id_item>` para comprar.\nVeja os itens com `!loja`.\n\nExemplos:\n`!comprar ring` — Anel de Noivado\n`!comprar pet_cat` — Gatinho\n`!comprar flower` — Flores")
        .setTimestamp()] });
    }

    const itemId = args[0].toLowerCase();
    let item = await Shop.findOne({ guildId: message.guild.id, itemId, available: true });

    if (!item) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("❌ Item não encontrado")
        .setDescription(`O item \`${itemId}\` não existe na loja.\nUse **\`!loja\`** para ver os itens disponíveis.`)
        .setTimestamp()] });
    }

    const qty = Math.max(1, parseInt(args[1]) || 1);
    const total = item.price * qty;

    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    if (dbUser.economy.wallet < total) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("❌ Saldo Insuficiente")
        .setDescription(`Você tem **${dbUser.economy.wallet.toLocaleString("pt-BR")} 💰** mas precisa de **${total.toLocaleString("pt-BR")} 💰**.`)
        .addFields({ name: "💡 Dica", value: "Use `!trabalhar`, `!diario` ou `!crime` para ganhar moedas!", inline: false })
        .setTimestamp()] });
    }

    const inventoryItem = { itemId: item.itemId, name: item.name, emoji: item.emoji, type: item.type, quantity: qty, purchasedAt: new Date().toISOString() };

    if (item.type === "pet") {
      const petEmojis = { pet_cat: "🐱", pet_dog: "🐶", pet_rabbit: "🐰" };
      const hasPet = dbUser.pet?.adopted;
      if (hasPet) {
        return message.reply({ embeds: [new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle("🐾 Você já tem um pet!")
          .setDescription(`Você já tem **${dbUser.pet.emoji} ${dbUser.pet.name}**!\nUse \`!pet largar\` para soltar seu pet atual antes de adotar um novo.`)
          .setTimestamp()] });
      }

      const petName = item.name;
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": -total },
          $set: {
            "pet.adopted": true,
            "pet.name": petName,
            "pet.type": item.itemId,
            "pet.emoji": petEmojis[item.itemId] || "🐾",
            "pet.hunger": 100,
            "pet.happiness": 100,
            "pet.lastCare": new Date().toISOString(),
            "pet.adoptedAt": new Date().toISOString(),
          },
          $push: { inventory: inventoryItem },
        }
      );

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${petEmojis[item.itemId] || "🐾"} Pet Adotado!`)
        .setDescription(`Você adotou **${petName}**! Cuide bem dele.\nUse \`!pet\` para ver seu pet e \`!pet cuidar\` para alimentá-lo.`)
        .addFields(
          { name: "💰 Pago", value: `${total.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💰 Saldo restante", value: `${(dbUser.economy.wallet - total).toLocaleString("pt-BR")} 💰`, inline: true }
        )
        .setFooter({ text: "Cuide do seu pet todos os dias ou o IBAMA vai buscar ele!" })
        .setTimestamp()] });
    }

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
        { name: "💰 Saldo restante", value: `${(dbUser.economy.wallet - total).toLocaleString("pt-BR")} 💰`, inline: true }
      )
      .setFooter({ text: "Use !inventario para ver seus itens" })
      .setTimestamp();

    if (item.itemId === "ring") {
      embed.addFields({ name: "💍 Dica", value: "Use `!casar @user` para pedir alguém em casamento!", inline: false });
    }

    await message.reply({ embeds: [embed] });
  },
};
