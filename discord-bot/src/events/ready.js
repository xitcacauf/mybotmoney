const logger = require("../utils/logger");
const { ActivityType } = require("discord.js");
const cron = require("node-cron");
const { triggerRandomEvent } = require("../systems/EventSystem");
const { decayHeat } = require("../systems/SocialHeat");
const User = require("../models/User");

// Armazena IDs para evitar timers zumbis em restarts parciais
let _presenceInterval = null;
let _nextEventTimeout = null;

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    logger.info(`✅ Bot online como ${client.user.tag}`);
    logger.info(`📊 Servidores: ${client.guilds.cache.size}`);
    logger.info(`👥 Usuários: ${client.users.cache.size}`);

    const activities = [
      { name: "❤️ Love Link | !ajuda", type: ActivityType.Playing },
      { name: "🎮 Procurando Duo | !duo", type: ActivityType.Watching },
      { name: "🖤 Dark Love | !darklove", type: ActivityType.Listening },
      { name: "💰 Economia Social | !saldo", type: ActivityType.Playing },
      { name: "🎫 Suporte | !ticket", type: ActivityType.Watching },
      { name: "⛓️ Vínculos | !vinculo", type: ActivityType.Playing },
      { name: "🌡️ Calor Social | !calor", type: ActivityType.Watching },
      { name: "🧠 Arquétipos | !personalidade", type: ActivityType.Listening },
    ];

    let i = 0;
    const rotate = () => {
      try {
        client.user.setActivity(activities[i % activities.length]);
        i++;
      } catch (_) {}
    };
    rotate();

    // Limpa interval anterior antes de criar novo (evita zumbis em restarts parciais)
    if (_presenceInterval) clearInterval(_presenceInterval);
    // 60 s — mínimo seguro para evitar rate-limit do Discord
    _presenceInterval = setInterval(rotate, 60_000);

    // ── Evento aleatório a cada 2-4 horas ────────────────────────────────────
    const scheduleNextEvent = () => {
      const delayMs = (2 + Math.random() * 2) * 60 * 60 * 1000;
      if (_nextEventTimeout) clearTimeout(_nextEventTimeout);
      _nextEventTimeout = setTimeout(async () => {
        await triggerRandomEvent(client).catch(() => {});
        scheduleNextEvent();
      }, delayMs);
    };
    scheduleNextEvent();

    // ── Decaimento do calor social (a cada hora) ──────────────────────────────
    cron.schedule("0 * * * *", async () => {
      for (const guild of client.guilds.cache.values()) {
        await decayHeat(guild.id).catch(() => {});
      }
    });

    // ── Juros bancários (log apenas — processado no !banco) ───────────────────
    cron.schedule("0 0 * * *", () => {
      logger.info("🏦 Ciclo de juros bancários — usuários receberão ao usar !banco");
    });

    // ── Atualização diária de títulos de elite ────────────────────────────────
    cron.schedule("0 1 * * *", async () => {
      logger.info("👑 Atualizando títulos de elite...");
      await updateEliteTitles(client).catch((err) =>
        logger.error(`Erro ao atualizar títulos: ${err.message}`)
      );
    });

    // ── Aniversários de casamento ─────────────────────────────────────────────
    cron.schedule("0 8 * * *", async () => {
      await checkAnniversaries(client).catch(() => {});
    });

    logger.info("⚙️ Sistemas automáticos ativados: eventos, calor, elite, aniversários");
  },
};

async function updateEliteTitles(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      // User.find() retorna QueryBuilder; await resolve para o array via .then()
      const users = await User.find({ guildId: guild.id });
      if (!Array.isArray(users) || !users.length) continue;

      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Mais rico → magnata
      const [richest] = [...users].sort(
        (a, b) => ((b.economy?.wallet || 0) + (b.economy?.bank || 0))
               - ((a.economy?.wallet || 0) + (a.economy?.bank || 0))
      );
      if (richest) {
        await User.findOneAndUpdate(
          { userId: richest.userId, guildId: guild.id },
          { $set: { "profile.eliteTitle": "magnata", "profile.eliteTitleExpiry": expiry } }
        );
      }

      // Mais ativo → mais_desejado
      const [mostActive] = [...users].sort(
        (a, b) => (b.social?.messages || 0) - (a.social?.messages || 0)
      );
      if (mostActive) {
        await User.findOneAndUpdate(
          { userId: mostActive.userId, guildId: guild.id },
          { $set: { "profile.eliteTitle": "mais_desejado", "profile.eliteTitleExpiry": expiry } }
        );
      }
    } catch {}
  }
}

async function checkAnniversaries(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const users = await User.find({ guildId: guild.id });
      if (!Array.isArray(users)) continue;

      const today = new Date();
      for (const user of users) {
        if (!user.relationship?.anniversary || user.relationship.status !== "married") continue;
        const ann = new Date(user.relationship.anniversary);
        if (ann.getMonth() === today.getMonth() && ann.getDate() === today.getDate()) {
          const years = today.getFullYear() - ann.getFullYear();
          if (years > 0) {
            const member = guild.members.cache.get(user.userId);
            if (member) {
              try {
                const dm = await member.createDM();
                await dm.send({
                  content: `💍 Feliz aniversário de casamento! Hoje completam **${years} ano(s)** juntos! 🎂\n*Use \`!memorias\` para relembrar os momentos especiais.*`,
                });
              } catch {}
            }
          }
        }
      }
    } catch {}
  }
}
