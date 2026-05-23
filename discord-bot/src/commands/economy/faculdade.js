const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const COURSES = {
  medicina: { name: "🏥 Medicina", cost: 5000, sessions: 20, unlocks: "Médico 🏥", desc: "Cuide de vidas e tenha um dos melhores salários do jogo." },
  direito: { name: "⚖️ Direito", cost: 4500, sessions: 20, unlocks: "Advogado ⚖️", desc: "Domine a justiça e defenda seus clientes." },
  engenharia: { name: "🔧 Engenharia", cost: 4000, sessions: 18, unlocks: "Engenheiro 🔧", desc: "Construa sistemas e infraestruturas complexas." },
  administracao: { name: "💼 Administração", cost: 4000, sessions: 16, unlocks: "CEO 💼", desc: "Aprenda a liderar empresas e maximizar lucros." },
  tecnologia: { name: "💻 Tecnologia", cost: 3000, sessions: 15, unlocks: "Dev Sênior 💻", desc: "Domine programação e sistemas digitais." },
};

const STUDY_COOLDOWN_MS = 2 * 60 * 60 * 1000;

const studyMessages = [
  "📖 Você revisou os materiais e absorveu o conteúdo!",
  "✏️ Prova prática concluída com êxito!",
  "🔬 Aula de laboratório terminada — experiência adquirida!",
  "📝 Trabalho semestral entregue e aprovado!",
  "🎓 Sessão de estudos intensa — seu conhecimento cresceu!",
  "💡 Tópico complexo dominado depois de horas de estudo!",
];

module.exports = {
  name: "faculdade",
  aliases: ["college", "universidade", "curso", "estudar"],
  description: "Estude na faculdade para desbloquear empregos de elite. Ex: !faculdade | !faculdade listar | !faculdade entrar <curso> | !faculdade estudar",
  cooldown: 5,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const career = dbUser.career || {};

    if (sub === "listar" || sub === "lista" || sub === "cursos") {
      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle("🎓 Faculdade — Cursos Disponíveis")
        .setDescription("Graduando-se, você desbloqueia empregos de elite com altíssimos salários.\n\nUse `!faculdade entrar <curso>` para se matricular.")
        .setTimestamp();

      for (const [id, course] of Object.entries(COURSES)) {
        embed.addFields({
          name: `${course.name}`,
          value: `> ${course.desc}\n💰 Matrícula: **${course.cost.toLocaleString("pt-BR")} 💰** | 📖 Sessões: **${course.sessions}** | 🏆 Desbloqueia: **${course.unlocks}**\nID: \`${id}\``,
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    if (sub === "entrar" || sub === "matricular" || sub === "inscrever") {
      const courseId = args[1]?.toLowerCase();

      if (!courseId || !COURSES[courseId]) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setDescription(`❌ Curso inválido. IDs disponíveis: ${Object.keys(COURSES).map((k) => `\`${k}\``).join(", ")}`),
          ],
        });
      }

      if (career.facultyCompleted) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription(`✅ Você já se formou em **${career.faculty}**! Use \`!emprego lista\` para ver os empregos desbloqueados.`)],
        });
      }

      if (career.faculty === courseId) {
        const progress = career.facultyProgress || 0;
        const total = COURSES[courseId].sessions;
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.info)
              .setDescription(`📚 Você já está matriculado em **${COURSES[courseId].name}**!\nProgresso: **${progress}/${total}** sessões\nUse \`!faculdade estudar\` para continuar.`),
          ],
        });
      }

      if (career.faculty && career.faculty !== courseId) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setDescription(`⚠️ Você já está matriculado em **${COURSES[career.faculty]?.name || career.faculty}**. Troque de curso com \`!faculdade trocar ${courseId}\`.`),
          ],
        });
      }

      const course = COURSES[courseId];
      const minLevel = 5;
      if ((dbUser.social?.level || 1) < minLevel) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`🔒 Você precisa ser nível **${minLevel}** para entrar na faculdade. (Seu nível: ${dbUser.social?.level || 1})`)],
        });
      }

      if ((dbUser.economy?.wallet || 0) < course.cost) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.error)
              .setDescription(`❌ Saldo insuficiente! A matrícula de **${course.name}** custa **${course.cost.toLocaleString("pt-BR")} 💰**. Você tem **${(dbUser.economy?.wallet || 0).toLocaleString("pt-BR")} 💰**.`),
          ],
        });
      }

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": -course.cost },
          $set: { "career.faculty": courseId, "career.facultyProgress": 0, "career.facultyCompleted": false },
        }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`🎓 Matriculado em ${course.name}!`)
        .setDescription(`Bem-vindo à faculdade! Sua jornada começa agora.\n\n*${course.desc}*`)
        .addFields(
          { name: "💰 Matrícula paga", value: `${course.cost.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "📖 Sessões necessárias", value: `${course.sessions} sessões de estudo`, inline: true },
          { name: "🏆 Ao se formar", value: `Desbloqueará: **${course.unlocks}**`, inline: false },
          { name: "📋 Próximo passo", value: "Use `!faculdade estudar` a cada 2 horas para progredir!", inline: false }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === "trocar") {
      const courseId = args[1]?.toLowerCase();
      if (!courseId || !COURSES[courseId]) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription("❌ Curso inválido.")] });
      }

      const course = COURSES[courseId];
      const halfCost = Math.floor(course.cost / 2);

      if ((dbUser.economy?.wallet || 0) < halfCost) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`❌ Trocar de curso custa **${halfCost.toLocaleString("pt-BR")} 💰** (50% da matrícula). Saldo insuficiente.`)],
        });
      }

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": -halfCost },
          $set: { "career.faculty": courseId, "career.facultyProgress": 0, "career.facultyCompleted": false },
        }
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`✅ Você transferiu para **${COURSES[courseId].name}**! Pagou **${halfCost.toLocaleString("pt-BR")} 💰**. Progresso zerado.`),
        ],
      });
    }

    if (sub === "estudar" || sub === "study" || sub === "aula") {
      if (!career.faculty) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setDescription("❌ Você não está matriculado em nenhum curso. Use `!faculdade listar` e depois `!faculdade entrar <curso>`."),
          ],
        });
      }

      if (career.facultyCompleted) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.success).setDescription(`🎓 Você já se formou em **${career.faculty}**! Use \`!emprego lista\` para ver os empregos desbloqueados.`)],
        });
      }

      const lastStudy = career.lastStudy ? new Date(career.lastStudy) : null;
      if (lastStudy && Date.now() - lastStudy.getTime() < STUDY_COOLDOWN_MS) {
        const nextStudy = new Date(lastStudy.getTime() + STUDY_COOLDOWN_MS);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle("📚 Descansando...")
              .setDescription(`Você precisa descansar antes de estudar de novo!\nPróxima sessão disponível: <t:${Math.floor(nextStudy.getTime() / 1000)}:R>`)
              .setFooter({ text: "Cadê aquele cafezinho? ☕" }),
          ],
        });
      }

      const course = COURSES[career.faculty];
      const progressGain = 1;
      const newProgress = (career.facultyProgress || 0) + progressGain;
      const completed = newProgress >= course.sessions;

      const studyMsg = studyMessages[Math.floor(Math.random() * studyMessages.length)];
      const xpGain = 30;

      const updates = {
        $set: { "career.lastStudy": new Date().toISOString(), "career.facultyProgress": newProgress },
        $inc: { "social.xp": xpGain },
      };

      if (completed) {
        updates.$set["career.facultyCompleted"] = true;
      }

      await User.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, updates);

      if (completed) {
        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle(`🎓 FORMATURA — ${course.name}!`)
          .setDescription(
            `**PARABÉNS!** Você se formou em **${course.name}**!\n\n` +
            `Agora você pode trabalhar como **${course.unlocks}**!\n` +
            `Use \`!emprego escolher\` para assumir seu novo cargo.`
          )
          .addFields(
            { name: "🏆 Diploma conquistado!", value: course.name, inline: true },
            { name: "🔓 Emprego desbloqueado", value: course.unlocks, inline: true },
            { name: "⭐ XP ganho", value: `+${xpGain}`, inline: true }
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      const progressBar = (() => {
        const filled = Math.floor((newProgress / course.sessions) * 10);
        return "█".repeat(filled) + "░".repeat(10 - filled);
      })();

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle(`📚 Sessão de Estudos — ${course.name}`)
        .setDescription(`${studyMsg}`)
        .addFields(
          { name: "📊 Progresso", value: `\`[${progressBar}]\` ${newProgress}/${course.sessions} sessões`, inline: false },
          { name: "⭐ XP ganho", value: `+${xpGain}`, inline: true },
          { name: "⏰ Próxima sessão", value: `<t:${Math.floor((Date.now() + STUDY_COOLDOWN_MS) / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: completed ? "Formatura concluída!" : `Faltam ${course.sessions - newProgress} sessão(ões) para se formar!` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const course = career.faculty ? COURSES[career.faculty] : null;
    const progress = career.facultyProgress || 0;

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle("🎓 Faculdade")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    if (career.facultyCompleted) {
      embed.setDescription(`✅ **Formado(a) em ${course?.name || career.faculty}!**\n\nVocê pode usar empregos de elite. Use \`!emprego escolher\`.`);
    } else if (career.faculty && course) {
      const progressBar = (() => {
        const filled = Math.floor((progress / course.sessions) * 10);
        return "█".repeat(filled) + "░".repeat(10 - filled);
      })();
      embed.setDescription(
        `📚 **Matriculado em ${course.name}**\n\n` +
        `\`[${progressBar}]\` **${progress}/${course.sessions}** sessões\n\n` +
        `Use \`!faculdade estudar\` a cada 2h para progredir!`
      );
    } else {
      embed.setDescription("Você não está matriculado em nenhum curso.\n\nUse `!faculdade listar` para ver os cursos disponíveis.");
    }

    embed.addFields({
      name: "📋 Comandos",
      value: "`!faculdade listar` — Ver cursos\n`!faculdade entrar <id>` — Matricular\n`!faculdade estudar` — Estudar (2h cooldown)\n`!faculdade trocar <id>` — Mudar de curso",
      inline: false,
    });

    return message.reply({ embeds: [embed] });
  },
};
