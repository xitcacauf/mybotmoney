const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = (client) => {
  const buttonsPath = path.join(__dirname, "../buttons");
  if (!fs.existsSync(buttonsPath)) return;

  const buttonFiles = fs.readdirSync(buttonsPath).filter((f) => f.endsWith(".js"));
  client._buttonPatterns = [];

  let loaded = 0;
  for (const file of buttonFiles) {
    try {
      const button = require(path.join(buttonsPath, file));
      if (!button.customId) continue;

      if (button.customId instanceof RegExp) {
        client._buttonPatterns.push({ pattern: button.customId, handler: button });
      } else if (Array.isArray(button.customId)) {
        button.customId.forEach((id) => client.buttons.set(id, button));
      } else {
        client.buttons.set(button.customId, button);
      }
      loaded++;
    } catch (err) {
      logger.error(`Erro ao carregar botão ${file}: ${err.message}`);
    }
  }
  logger.info(`✅ ${loaded} botões carregados!`);
};
