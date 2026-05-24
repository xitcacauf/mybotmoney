const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addBondXP } = require("../../systems/ObsessionSystem");
const { addMemory } = require("../../systems/MemorySystem");

const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 horas

const childNames = [
  "Valentina", "Gabriel", "Sophia", "Miguel", "Isabella", "Arthur",
  "Luna", "Heitor", "Alice", "Davi", "Laura", "Bernardo",
  "Manuela", "Pedro", "Giovanna", "Samuel", "Helena", "Matheus",
  "Mariana", "Rafael", "Julia", "Lucas", "Beatriz", "Enzo",
];

const intimacyMessages = [
  "Os dois se encontraram num momento especial e a conexão ficou ainda mais profunda... 💋",
  "A noite foi longa e o vínculo entre vocês cresceu ainda mais. 🌙",
  "Momento de intimidade intensa — dois corpos, uma só sintonia. 🔥",
  "A paixão falou mais alto e os dois se entregaram completamente. 💞",
  "Um encontro carregado de emoção e desejo — é difícil se separar depois. 💫",
  "Os olhos dizem o que as palavras não conseguem — mais um momento que ficará na memória. ✨",
];

module.exports = {
  name: "intimar",
  aliases: ["sexo", "intim", "fazer_amor"],
  description: "Momento de intimidade com seu parceiro(a). Requer casamento ou contrato de intimidade.",
  cooldown: 5,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const now = new Date();

    // Verifica se tem parceiro(a)
    const hasPartner = dbUser.relationship?.partnerId &&
      (dbUser.relationship.status === "married" || dbUser.relationship.status === "dating");
    const hasIntimarContract = dbUser.darkLove?.contractType === "intimar" && dbUser.darkLove?.contractWith;

    if (!hasPartner && !hasIntimarContract) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle("❌ Você precisa de um parceiro(a)")
            .setDescription(
              "Para usar `!intimar` você precisa de:\n" +
              "• 💍 Estar namorando ou casado(a) com alguém\n" +
              "• **ou** ter um `!contrato` do tipo **intimar** ativo\n\n" +
              "*Use `!namoro @user` para começar um relacionamento.*"
            ),
        ],
      });
    }

    // Verifica cooldown
    const lastIntimar = dbUser.darkLove?.lastIntimar ? new Date(dbUser.darkLove.lastIntimar) : null;
    if (lastIntimar && now - lastIntimar < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now - lastIntimar);
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle("⏳ Já se intimaram hoje!")
            .setDescription(`Vocês precisam descansar... Volte em **${hours}h ${mins}m**.`)
            .setFooter({ text: "Qualidade é melhor que quantidade 😉" }),
        ],
      });
    }

    const partnerId = dbUser.relationship?.partnerId || dbUser.darkLove?.contractWith;
    const partnerName = dbUser.relationship?.partnerName || "parceiro(a)";

    // Calcula streak de intimidade
    const lastIntimar2 = dbUser.darkLove?.lastIntimar ? new Date(dbUser.darkLove.lastIntimar) : null;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hadYesterday = lastIntimar2 && lastIntimar2 >= new Date(now.getTime() - 48 * 60 * 60 * 1000) && lastIntimar2 <= yesterday;
    let streak = dbUser.darkLove?.intimarStreak || 0;
    streak = hadYesterday ? Math.min(streak + 1, 30) : 1;

    // Bônus de streak (7 dias = +500 moedas)
    let streakBonus = 0;
    let streakMsg = "";
    if (streak > 0 && streak % 7 === 0) {
      streakBonus = 500;
      streakMsg = `\n\n🔥 **Bônus de streak** (${streak} dias consecutivos): +${streakBonus} 💰!`;
    }

    // Chance de fazer um bebê
    const isCasado = dbUser.relationship?.status === "married";
    const temContrato = hasIntimarContract;
    let babyChance = 0;
    if (isCasado && temContrato) babyChance = 0.20; // 20% se casado com contrato
    else if (isCasado) babyChance = 0.08;           // 8% se só casado
    else if (temContrato) babyChance = 0.05;         // 5% se só contrato

    let babyBorn = null;
    const currentChildren = dbUser.relationship?.children || [];

    if (currentChildren.length < 5 && babyChance > 0 && Math.random() < babyChance) {
      const name = childNames[Math.floor(Math.random() * childNames.length)];
      const babyEmojis = ["👶", "🍼", "🌟", "💫", "✨", "🌸"];
      const emoji = babyEmojis[Math.floor(Math.random() * babyEmojis.length)];

      babyBorn = {
        name,
        emoji,
        phase: "bebê",
        type: "natural",
        happiness: 100,
        health: 100,
        xp: 0,
        hunger: 100,
        bornAt: now.toISOString(),
      };

      // Adiciona filho para os dois
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $push: { "relationship.children": babyBorn } }
      );
      if (partnerId) {
        await User.findOneAndUpdate(
          { userId: partnerId, guildId: message.guild.id },
          { $push: { "relationship.children": babyBorn } }
        );
      }

      await addMemory(message.author.id, message.guild.id, "had_child", `${name} nasceu naturalmente`).catch(() => {});
    }

    // Atualiza estado de intimidade
    const updates = {
      "darkLove.lastIntimar": now.toISOString(),
      "darkLove.intimarStreak": streak,
    };
    if (streakBonus > 0) {
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: updates, $inc: { "economy.wallet": streakBonus } }
      );
    } else {
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: updates }
      );
    }

    // Adiciona XP de vínculo
    if (partnerId) {
      await addBondXP(message.author.id, message.guild.id, partnerId, 5).catch(() => {});
      await addBondXP(partnerId, message.guild.id, message.author.id, 5).catch(() => {});
    }

    // Monta a mensagem
    const intimacyMsg = intimacyMessages[Math.floor(Math.random() * intimacyMessages.length)];

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("🔥 Momento de Intimidade")
      .setDescription(
        `<@${message.author.id}> e <@${partnerId || "parceiro(a)"}>...\n\n` +
        `*${intimacyMsg}*${streakMsg}`
      )
      .addFields(
        { name: "🔥 Streak de Intimidade", value: `${streak} dia(s) seguido(s)`, inline: true },
        { name: "💫 Vínculo", value: `+5 XP de vínculo`, inline: true },
        { name: "🎲 Chance de bebê", value: babyChance > 0 ? `${Math.round(babyChance * 100)}%` : "—", inline: true }
      )
      .setFooter({ text: "Próxima intimidade disponível em 12h" })
      .setTimestamp();

    if (babyBorn) {
      embed.addFields({
        name: "👶 UMA NOVA VIDA!",
        value: `Parabéns! Nasceu **${babyBorn.emoji} ${babyBorn.name}**! Um filho natural de vocês dois!\n*Use \`!filhos\` para ver seu(sua) filho(a).*`,
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });
  },
};
