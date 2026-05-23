const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const JOBS = {
  tier1: [
    { id: "entregador", name: "Entregador 📦", emoji: "📦", min: 80, max: 200, desc: "Entrega pedidos na cidade" },
    { id: "vendedor", name: "Vendedor 🛍️", emoji: "🛍️", min: 90, max: 220, desc: "Vende produtos na rua" },
    { id: "garcom", name: "Garçom 🍽️", emoji: "🍽️", min: 100, max: 240, desc: "Atende mesas em restaurante" },
    { id: "caixa", name: "Caixa 🏪", emoji: "🏪", min: 85, max: 210, desc: "Opera o caixa de loja" },
  ],
  tier2: [
    { id: "dev_junior", name: "Dev Junior 💻", emoji: "💻", min: 200, max: 450, desc: "Programa sistemas e apps", req: { level: 10 } },
    { id: "designer", name: "Designer 🎨", emoji: "🎨", min: 180, max: 400, desc: "Cria artes e identidade visual", req: { level: 10 } },
    { id: "social_media", name: "Social Media 📱", emoji: "📱", min: 150, max: 380, desc: "Gerencia redes sociais", req: { level: 8 } },
    { id: "chef", name: "Chef de Cozinha 👨‍🍳", emoji: "👨‍🍳", min: 200, max: 420, desc: "Cria pratos exclusivos", req: { level: 10 } },
  ],
  tier3: [
    { id: "medico", name: "Médico 🏥", emoji: "🏥", min: 500, max: 900, desc: "Salva vidas no hospital", req: { faculty: "medicina" } },
    { id: "advogado", name: "Advogado ⚖️", emoji: "⚖️", min: 450, max: 850, desc: "Defende causas na justiça", req: { faculty: "direito" } },
    { id: "engenheiro", name: "Engenheiro 🔧", emoji: "🔧", min: 400, max: 780, desc: "Projeta sistemas e construções", req: { faculty: "engenharia" } },
    { id: "ceo", name: "CEO 💼", emoji: "💼", min: 600, max: 1200, desc: "Comanda uma empresa", req: { faculty: "administracao" } },
  ],
};

const ALL_JOBS = [...JOBS.tier1, ...JOBS.tier2, ...JOBS.tier3];

function getJobById(id) {
  return ALL_JOBS.find((j) => j.id === id) || null;
}

function canTakeJob(job, dbUser) {
  if (!job.req) return { ok: true };
  if (job.req.level && (dbUser.social?.level || 1) < job.req.level) {
    return { ok: false, reason: `Você precisa ser nível **${job.req.level}** para este emprego.` };
  }
  if (job.req.faculty) {
    const completed = dbUser.career?.facultyCompleted && dbUser.career?.faculty === job.req.faculty;
    if (!completed) {
      const names = { medicina: "Medicina", direito: "Direito", engenharia: "Engenharia", administracao: "Administração" };
      return { ok: false, reason: `Você precisa se formar em **${names[job.req.faculty] || job.req.faculty}** na faculdade (`+"`!faculdade`" + `)` };
    }
  }
  return { ok: true };
}

module.exports = {
  name: "emprego",
  aliases: ["job", "carreira", "cargo", "trabalho"],
  description: "Gerencie sua carreira profissional. Ex: !emprego | !emprego lista | !emprego escolher <id>",
  cooldown: 5,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const career = dbUser.career || {};

    if (sub === "lista" || sub === "listar" || sub === "empregos") {
      const userLevel = dbUser.social?.level || 1;
      const hasDiploma = career.facultyCompleted;
      const diplomaCourse = career.faculty;

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle("💼 Empregos Disponíveis")
        .setDescription(`Seu nível: **${userLevel}** | Diploma: **${hasDiploma ? diplomaCourse : "Nenhum"}**\n\nUse \`!emprego escolher <id>\` para mudar de emprego.`)
        .setTimestamp();

      const tier1List = JOBS.tier1.map((j) => `\`${j.id}\` ${j.name} — 💰 ${j.min}-${j.max}/h`).join("\n");
      const tier2List = JOBS.tier2.map((j) => {
        const ok = canTakeJob(j, dbUser).ok;
        return `\`${j.id}\` ${j.name} — 💰 ${j.min}-${j.max}/h ${ok ? "" : "🔒"}`;
      }).join("\n");
      const tier3List = JOBS.tier3.map((j) => {
        const ok = canTakeJob(j, dbUser).ok;
        return `\`${j.id}\` ${j.name} — 💰 ${j.min}-${j.max}/h ${ok ? "" : "🎓"}`;
      }).join("\n");

      embed.addFields(
        { name: "🟢 Nível 1 — Starter (sem requisito)", value: tier1List, inline: false },
        { name: "🟡 Nível 2 — Profissional (req. nível)", value: tier2List, inline: false },
        { name: "🔴 Nível 3 — Elite (req. diploma 🎓)", value: tier3List, inline: false }
      );

      return message.reply({ embeds: [embed] });
    }

    if (sub === "escolher" || sub === "mudar" || sub === "trocar") {
      const jobId = args[1]?.toLowerCase();

      if (!jobId) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription("❌ Informe o ID do emprego. Use `!emprego lista` para ver os IDs.")],
        });
      }

      const job = getJobById(jobId);
      if (!job) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`❌ Emprego \`${jobId}\` não encontrado. Use \`!emprego lista\`.`)],
        });
      }

      const check = canTakeJob(job, dbUser);
      if (!check.ok) {
        return message.reply({
          embeds: [new EmbedBuilder().setColor(config.colors.warning).setTitle("🔒 Emprego Bloqueado").setDescription(check.reason)],
        });
      }

      const changedAt = career.jobChangedAt ? new Date(career.jobChangedAt) : null;
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      if (changedAt && Date.now() - changedAt.getTime() < weekMs && career.job) {
        const nextChange = new Date(changedAt.getTime() + weekMs);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle("⏳ Troca de Emprego")
              .setDescription(`Você só pode trocar de emprego 1x por semana.\nPróxima troca disponível: <t:${Math.floor(nextChange.getTime() / 1000)}:R>`)
          ],
        });
      }

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "career.job": job.id, "career.jobTier": JOBS.tier1.some((j) => j.id === job.id) ? 1 : JOBS.tier2.some((j) => j.id === job.id) ? 2 : 3, "career.jobChangedAt": new Date().toISOString() } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${job.emoji} Emprego Aceito!`)
        .setDescription(`Você agora trabalha como **${job.name}**!\n\n*${job.desc}*`)
        .addFields(
          { name: "💰 Salário", value: `${job.min}–${job.max} por hora`, inline: true },
          { name: "💡 Como ganhar", value: "Use `!trabalhar` para trabalhar", inline: true }
        )
        .setFooter({ text: "Você pode trocar de emprego 1x por semana" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === "largar" || sub === "demitir" || sub === "sair") {
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $set: { "career.job": null, "career.jobChangedAt": new Date().toISOString() } }
      );
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.info).setDescription("✅ Você pediu demissão. Use `!emprego lista` para encontrar outro emprego.")],
      });
    }

    const currentJob = career.job ? getJobById(career.job) : null;
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("💼 Sua Carreira")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "🏢 Emprego Atual", value: currentJob ? `${currentJob.name}` : "Desempregado", inline: true },
        { name: "💰 Salário", value: currentJob ? `${currentJob.min}–${currentJob.max}/h` : "—", inline: true },
        { name: "📊 Nível", value: `${dbUser.social?.level || 1}`, inline: true },
        { name: "🎓 Diploma", value: career.facultyCompleted ? `${career.faculty}` : "Nenhum — use \`!faculdade\`", inline: true },
        { name: "📋 Comandos", value: "`!emprego lista` — Ver empregos\n`!emprego escolher <id>` — Mudar de emprego\n`!emprego largar` — Pedir demissão\n`!trabalhar` — Trabalhar e ganhar dinheiro", inline: false }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
