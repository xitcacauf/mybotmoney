const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addMemory } = require("../../systems/MemorySystem");

const childNames = [
  "Valentina", "Gabriel", "Sophia", "Miguel", "Isabella", "Arthur", "Luna", "Heitor",
  "Alice", "Davi", "Laura", "Bernardo", "Manuela", "Pedro", "Giovanna", "Samuel",
];

module.exports = {
  name: "filhos",
  aliases: ["filho", "adotar", "bebe", "crianca"],
  description: "Gerencie seus filhos. Ex: !filhos [adotar|ver|cuidar|ensinar]",
  cooldown: 10,
  async execute(message, args, client) {
    const subCmd = args[0]?.toLowerCase() || "ver";
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (subCmd === "ver" || subCmd === "lista") {
      const children = dbUser.relationship.children || [];
      if (!children.length) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle("👶 Seus Filhos")
          .setDescription("Você ainda não tem filhos!\nUse `!filhos adotar` se estiver casado(a).")
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const childList = children.map((c, i) => {
        const origin = c.type === "natural" ? "🧬 Natural" : "💕 Adotado";
        return `**${i + 1}.** ${c.emoji || "👶"} **${c.name}** | ${origin} | Fase: ${c.phase || "bebê"} | Felicidade: ${c.happiness || 100}% | XP: ${c.xp || 0}`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle(`👶 Seus Filhos (${children.length})`)
        .setDescription(childList)
        .addFields({ name: "💡 Comandos", value: "`!filhos cuidar` `!filhos ensinar` `!filhos brincar`", inline: false })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (subCmd === "adotar") {
      if (dbUser.relationship.status !== "married") {
        return message.reply("❌ Você precisa ser casado(a) para adotar um filho!");
      }
      const children = dbUser.relationship.children || [];
      if (children.length >= 5) {
        return message.reply("❌ Você já tem 5 filhos! Não dá para adotar mais.");
      }

      const partnerDb = await User.findOrCreate(dbUser.relationship.partnerId, message.guild.id, dbUser.relationship.partnerName);
      const partnerChildren = partnerDb.relationship.children || [];

      const name = childNames[Math.floor(Math.random() * childNames.length)];
      const emojis = ["👶", "🍼", "🌟", "💫", "✨"];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];

      const child = {
        name,
        emoji,
        phase: "bebê",
        happiness: 100,
        health: 100,
        xp: 0,
        hunger: 100,
        adoptedAt: new Date().toISOString(),
      };

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $push: { "relationship.children": child }, $inc: { "economy.wallet": -2000 } }
      );
      await User.findOneAndUpdate(
        { userId: dbUser.relationship.partnerId, guildId: message.guild.id },
        { $push: { "relationship.children": child } }
      );

      await addMemory(message.author.id, message.guild.id, "had_child", `Adotou ${name}`);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("👶 Adoção Realizada!")
        .setDescription(
          `Parabéns! Você e <@${dbUser.relationship.partnerId}> adotaram **${emoji} ${name}**!\n\n` +
          `*Cuide bem do seu filho usando \`!filhos cuidar\`, \`!filhos ensinar\` e \`!filhos brincar\`.*\n` +
          `**Custo:** 2.000 💰`
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (subCmd === "cuidar") {
      const children = dbUser.relationship.children || [];
      if (!children.length) return message.reply("❌ Você não tem filhos para cuidar.");

      const updated = children.map((c) => ({
        ...c,
        hunger: Math.min(100, (c.hunger || 100) + 20),
        happiness: Math.min(100, (c.happiness || 100) + 10),
        health: Math.min(100, (c.health || 100) + 5),
        xp: (c.xp || 0) + 5,
      }));

      updated.forEach((c, i) => {
        if (!c.phase || c.phase === "bebê") { if (c.xp >= 50) updated[i].phase = "criança"; }
        else if (c.phase === "criança") { if (c.xp >= 150) updated[i].phase = "adolescente"; }
        else if (c.phase === "adolescente") { if (c.xp >= 350) updated[i].phase = "adulto"; }
      });

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "relationship.children": updated } }
      );

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "social.xp": 10 } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("💕 Cuidando dos Filhos")
        .setDescription(`Você cuidou dos seus filhos! +20 fome, +10 felicidade, +5 saúde.\n+10 XP para você!`)
        .addFields({ name: "👶 Filhos", value: updated.map((c) => `${c.emoji} **${c.name}** — ${c.phase} (XP: ${c.xp})`).join("\n") })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (subCmd === "ensinar") {
      const children = dbUser.relationship.children || [];
      if (!children.length) return message.reply("❌ Você não tem filhos.");

      const lessons = ["matemática", "culinária", "música", "arte", "leitura", "esportes", "idiomas", "tecnologia"];
      const lesson = lessons[Math.floor(Math.random() * lessons.length)];
      const xpGain = Math.floor(Math.random() * 15) + 5;
      const econ = Math.floor(Math.random() * 200) + 50;

      const updated = children.map((c) => ({ ...c, xp: (c.xp || 0) + xpGain }));
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "relationship.children": updated }, $inc: { "economy.wallet": econ, "social.xp": 15 } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle("📚 Aula Dada!")
        .setDescription(`Você ensinou **${lesson}** para seus filhos!\n+${xpGain} XP para cada filho, +${econ} 💰 e +15 XP para você!`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (subCmd === "brincar") {
      const children = dbUser.relationship.children || [];
      if (!children.length) return message.reply("❌ Você não tem filhos.");

      const games = ["videogame", "bola", "caça ao tesouro", "piscina", "pintura", "corrida"];
      const game = games[Math.floor(Math.random() * games.length)];
      const updated = children.map((c) => ({ ...c, happiness: Math.min(100, (c.happiness || 100) + 25) }));

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "relationship.children": updated }, $inc: { "social.xp": 8 } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("🎮 Brincando com os Filhos!")
        .setDescription(`Você jogou **${game}** com seus filhos! Felicidade +25. 💕`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    return message.reply("❌ Sub-comando inválido. Use: `ver`, `adotar`, `cuidar`, `ensinar`, `brincar`");
  },
};
