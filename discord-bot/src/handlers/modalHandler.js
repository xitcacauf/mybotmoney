const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = (client) => {
  const modalsPath = path.join(__dirname, "../modals");
  if (!fs.existsSync(modalsPath)) return;

  const modalFiles = fs.readdirSync(modalsPath).filter((f) => f.endsWith(".js"));
  client._modalPatterns = [];

  let loaded = 0;
  for (const file of modalFiles) {
    try {
      const modal = require(path.join(modalsPath, file));
      if (!modal.customId) continue;

      if (modal.customId instanceof RegExp) {
        client._modalPatterns.push({ pattern: modal.customId, handler: modal });
      } else {
        client.modals.set(modal.customId, modal);
      }
      loaded++;
    } catch (err) {
      logger.error(`Erro ao carregar modal ${file}: ${err.message}`);
    }
  }
  logger.info(`✅ ${loaded} modais carregados!`);
};
