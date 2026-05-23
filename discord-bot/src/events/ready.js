const logger = require("../utils/logger");
const { ActivityType } = require("discord.js");
const cron = require("node-cron");
const { triggerRandomEvent } = require("../systems/EventSystem");
const { decayHeat } = require("../systems/SocialHeat");
const User = require("../models/User");

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
      client.user.setActivity(activities[i % activities.length]);
      i++;
    };
    rotate();
    setInterval(rotate, 15000);

    // Evento aleatório a cada 2-4 horas
    const scheduleNextEvent = () => {
      const delayHours = 2 + Math.random() * 2;
      const delayMs = delayHours * 60 * 60 * 1000;
      setTimeout(async () => {
        await triggerRandomEvent(client);
        scheduleNextEvent();
      }, delayMs);
    };
    scheduleNextEvent();

    // Decaimento do calor social a cada hora
    cron.schedule("0 * * * *", async () => {
      for (const guild of client.guilds.cache.values()) {
        await decayHeat(guild.id).catch(() => {});
      }
    });

    // Juros bancários diários (processados no comando !banco, mas log aqui)
    cron.schedule("0 0 * * *", async () => {
      logger.info("🏦 Ciclo de juros bancários — usuários receberão ao usar !banco");
    });

    // Atualização diária de títulos de elite
    cron.schedule("0 1 * * *", async () => {
      logger.info("👑 Atualizando títulos de elite...");
      try {
        await updateEliteTitles(client);
      } catch (err) {
        logger.error(`Erro ao atualizar títulos: ${err.message}`);
      }
    });

    // Aniversários de casamento (verificar diariamente)
    cron.schedule("0 8 * * *", async () => {
      await checkAnniversaries(client);
    });

    logger.info("⚙️ Sistemas automáticos ativados: eventos, calor, elite, aniversários");
  },
};

async function updateEliteTitles(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const users = await User.find({ guildId: guild.id });
      if (!users._results || !users._results.length) continue;

      const sorted = [...users._results].sort(
        (a, b) => ((b.economy?.wallet || 0) + (b.economy?.bank || 0)) - ((a.economy?.wallet || 0) + (a.economy?.bank || 0))
      );

      if (sorted[0]) {
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await User.findOneAndUpdate(
          { userId: sorted[0].userId, guildId: guild.id },
          { $set: { "profile.eliteTitle": "magnata", "profile.eliteTitleExpiry": expiry } }
        );
      }

      const mostActive = [...users._results].sort(
        (a, b) => (b.social?.messages || 0) - (a.social?.messages || 0)
      );
      if (mostActive[0]) {
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await User.findOneAndUpdate(
          { userId: mostActive[0].userId, guildId: guild.id },
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
      if (!users._results) continue;

      const today = new Date();
      for (const user of users._results) {
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
