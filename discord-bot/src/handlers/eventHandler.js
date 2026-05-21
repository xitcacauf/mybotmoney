const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = (client) => {
  const eventsPath = path.join(__dirname, "../events");
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

  let loaded = 0;
  for (const file of eventFiles) {
    try {
      const event = require(path.join(eventsPath, file));
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      loaded++;
    } catch (err) {
      logger.error(`Erro ao carregar evento ${file}: ${err.message}`);
    }
  }
  logger.info(`✅ ${loaded} eventos carregados!`);
};
