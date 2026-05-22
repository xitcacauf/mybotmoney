const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");

const MS_2DAYS = 2 * 24 * 60 * 60 * 1000;

function buildBar(value) {
  const filled = Math.round(value / 10);
  return "🟩".repeat(filled) + "⬛".repeat(10 - filled) + ` ${value}%`;
}

module.exports = {
  customId: ["pet_care", "pet_info"],
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);

    if (!dbUser.pet?.adopted) {
      return interaction.editReply({ content: "❌ Você não tem um pet!" });
    }

    const pet = dbUser.pet;
    const now = new Date();
    const lastCare = pet.lastCare ? new Date(pet.lastCare) : null;

    if (lastCare && now - lastCare > MS_2DAYS) {
      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        { $set: { "pet.adopted": false, "pet.name": "", "pet.type": "", "pet.emoji": "" } }
      );
      return interaction.editReply({ content: `🚨 O IBAMA levou **${pet.emoji} ${pet.name}**! Adote um novo com \`!loja\`.` });
    }

    let hunger = pet.hunger ?? 100;
    let happiness = pet.happiness ?? 100;
    if (lastCare) {
      const hoursElapsed = Math.floor((now - lastCare) / 3600000);
      hunger = Math.max(0, hunger - hoursElapsed * 5);
      happiness = Math.max(0, happiness - hoursElapsed * 3);
    }

    if (interaction.customId === "pet_care") {
      const canCare = !lastCare || (now - lastCare) >= 4 * 3600000;
      if (!canCare) {
        const remaining = 4 * 3600000 - (now - lastCare);
        const mins = Math.floor(remaining / 60000);
        return interaction.editReply({ content: `⏳ Volte em **${mins} minutos** para cuidar novamente!` });
      }
      hunger = Math.min(100, hunger + 30);
      happiness = Math.min(100, happiness + 20);
      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        { $set: { "pet.hunger": hunger, "pet.happiness": happiness, "pet.lastCare": now.toISOString() } }
      );
      return interaction.editReply({ content: `${pet.emoji} **${pet.name}** foi cuidado! 🎉\n🍖 Fome: ${buildBar(hunger)}\n😊 Felicidade: ${buildBar(happiness)}` });
    }

    if (interaction.customId === "pet_info") {
      const timeSinceCare = lastCare ? `<t:${Math.floor(lastCare.getTime() / 1000)}:R>` : "Nunca";
      const adoptedAt = pet.adoptedAt ? `<t:${Math.floor(new Date(pet.adoptedAt).getTime() / 1000)}:D>` : "?";
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`${pet.emoji} ${pet.name} — Ficha Completa`)
        .addFields(
          { name: "🍖 Fome", value: buildBar(hunger), inline: false },
          { name: "😊 Felicidade", value: buildBar(happiness), inline: false },
          { name: "📅 Adotado em", value: adoptedAt, inline: true },
          { name: "⏰ Última cuidada", value: timeSinceCare, inline: true }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
