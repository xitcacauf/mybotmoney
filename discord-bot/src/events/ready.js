const logger = require("../utils/logger");
const { ActivityType } = require("discord.js");
const cron = require("node-cron");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    logger.info(`✅ Bot online como ${client.user.tag}`);
    logger.info(`📊 Servidores: ${client.guilds.cache.size}`);
    logger.info(`👥 Usuários: ${client.users.cache.size}`);

    const activities = [
      { name: "❤️ Web Namoro | !ajuda", type: ActivityType.Playing },
      { name: "🎮 Procurando Duo | !duo", type: ActivityType.Watching },
      { name: "🖤 Dark Love | !darklove", type: ActivityType.Listening },
      { name: "💰 Economia Sims | !saldo", type: ActivityType.Playing },
      { name: "🎫 Suporte | !ticket", type: ActivityType.Watching },
    ];

    let i = 0;
    const rotate = () => {
      client.user.setActivity(activities[i % activities.length]);
      i++;
    };
    rotate();
    setInterval(rotate, 15000);

    cron.schedule("0 0 * * *", async () => {
      logger.info("🔄 Executando tarefas diárias...");
    });
  },
};
