const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const PET_EMOJIS = { pet_cat: "🐱", pet_dog: "🐶", pet_rabbit: "🐰" };
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_2DAYS = 2 * MS_DAY;

function getStatus(hunger, happiness) {
  const avg = (hunger + happiness) / 2;
  if (avg >= 80) return { text: "Feliz e saudável! 😊", color: 0x00ff88 };
  if (avg >= 60) return { text: "Bem, mas poderia ser melhor 🙂", color: 0x88ff00 };
  if (avg >= 40) return { text: "Triste e com fome... 😢", color: 0xffaa00 };
  return { text: "Em perigo! Cuide logo! 🚨", color: 0xff0000 };
}

function buildBar(value) {
  const filled = Math.round(value / 10);
  return "🟩".repeat(filled) + "⬛".repeat(10 - filled) + ` ${value}%`;
}

module.exports = {
  name: "pet",
  aliases: ["bichinho", "animal"],
  description: "Veja e cuide do seu pet. Use: !pet | !pet cuidar | !pet info | !pet largar",
  cooldown: 5,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const sub = (args[0] || "").toLowerCase();

    if (sub === "largar") {
      if (!dbUser.pet?.adopted) return message.reply("❌ Você não tem um pet para largar.");
      const petName = dbUser.pet.name;
      const petEmoji = dbUser.pet.emoji;
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "pet.adopted": false, "pet.name": "", "pet.type": "", "pet.emoji": "", "pet.hunger": 100, "pet.happiness": 100, "pet.lastCare": null, "pet.adoptedAt": null } }
      );
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`${petEmoji} Pet Solto`)
        .setDescription(`Você soltou **${petName}** de volta à natureza. Que ele seja feliz! 🌿`)
        .setTimestamp()] });
    }

    if (!dbUser.pet?.adopted) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle("🐾 Você não tem um pet!")
        .setDescription("Adote um pet na loja!\n\n**Pets disponíveis:**\n🐱 `!comprar pet_cat` — Gatinho (2.000 💰)\n🐶 `!comprar pet_dog` — Cachorro (2.500 💰)\n🐰 `!comprar pet_rabbit` — Coelhinho (1.800 💰)")
        .setTimestamp()] });
    }

    const pet = dbUser.pet;
    const now = new Date();
    const lastCare = pet.lastCare ? new Date(pet.lastCare) : null;

    if (lastCare && now - lastCare > MS_2DAYS) {
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "pet.adopted": false, "pet.name": "", "pet.type": "", "pet.emoji": "", "pet.hunger": 100, "pet.happiness": 100, "pet.lastCare": null, "pet.adoptedAt": null } }
      );
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("🚨 O IBAMA LEVOU SEU PET!")
        .setDescription(`**${pet.emoji} ${pet.name}** ficou **${Math.floor((now - lastCare) / MS_DAY)} dias** sem cuidados e o IBAMA resgatou ele!\n\nAdote um novo pet com \`!loja\`.`)
        .setImage("https://media.giphy.com/media/3o7TKxZzyNgMA4DDNS/giphy.gif")
        .setTimestamp()] });
    }

    let hunger = pet.hunger ?? 100;
    let happiness = pet.happiness ?? 100;

    if (lastCare) {
      const hoursElapsed = Math.floor((now - lastCare) / 3600000);
      hunger = Math.max(0, hunger - hoursElapsed * 5);
      happiness = Math.max(0, happiness - hoursElapsed * 3);
    }

    if (sub === "cuidar") {
      const canCare = !lastCare || (now - lastCare) >= 4 * 3600000;
      if (!canCare) {
        const remaining = 4 * 3600000 - (now - lastCare);
        const mins = Math.floor(remaining / 60000);
        return message.reply({ embeds: [new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle("⏳ Muita atenção!")
          .setDescription(`${pet.emoji} **${pet.name}** está bem por enquanto! Volte em **${mins} minutos** para cuidar novamente.`)
          .setTimestamp()] });
      }

      hunger = Math.min(100, hunger + 30);
      happiness = Math.min(100, happiness + 20);

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "pet.hunger": hunger, "pet.happiness": happiness, "pet.lastCare": now.toISOString() } }
      );

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${pet.emoji} ${pet.name} foi alimentado!`)
        .setDescription(`Você cuidou de **${pet.name}**! Ele está muito feliz! 🎉`)
        .addFields(
          { name: "🍖 Fome", value: buildBar(hunger), inline: false },
          { name: "😊 Felicidade", value: buildBar(happiness), inline: false }
        )
        .setFooter({ text: "Cuide dele a cada 4 horas para mantê-lo feliz!" })
        .setTimestamp()] });
    }

    const status = getStatus(hunger, happiness);
    const timeSinceCare = lastCare ? `<t:${Math.floor(lastCare.getTime() / 1000)}:R>` : "Nunca";
    const nextIbama = lastCare ? `<t:${Math.floor((lastCare.getTime() + MS_2DAYS) / 1000)}:R>` : "Em breve!";

    const embed = new EmbedBuilder()
      .setColor(status.color)
      .setTitle(`${pet.emoji} ${pet.name}`)
      .setDescription(`**Status:** ${status.text}`)
      .addFields(
        { name: "🍖 Fome", value: buildBar(hunger), inline: false },
        { name: "😊 Felicidade", value: buildBar(happiness), inline: false },
        { name: "⏰ Última Cuidada", value: timeSinceCare, inline: true },
        { name: "🚨 IBAMA chega", value: nextIbama, inline: true }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Use !pet cuidar para alimentar | !pet largar para soltar" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("pet_care").setLabel("🍖 Cuidar Agora").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("pet_info").setLabel("📋 Info Detalhado").setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
