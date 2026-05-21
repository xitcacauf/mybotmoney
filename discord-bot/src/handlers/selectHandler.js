const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = (client) => {
  const selectPath = path.join(__dirname, "../selectmenus");
  if (!fs.existsSync(selectPath)) return;

  const selectFiles = fs.readdirSync(selectPath).filter((f) => f.endsWith(".js"));
  let loaded = 0;
  for (const file of selectFiles) {
    try {
      const menu = require(path.join(selectPath, file));
      if (!menu.customId) continue;
      client.selectMenus.set(menu.customId, menu);
      loaded++;
    } catch (err) {
      logger.error(`Erro ao carregar select menu ${file}: ${err.message}`);
    }
  }
  logger.info(`✅ ${loaded} select menus carregados!`);
};
