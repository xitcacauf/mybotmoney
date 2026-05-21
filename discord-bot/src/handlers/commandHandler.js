const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = (client) => {
  const commandsPath = path.join(__dirname, "../commands");
  const categories = fs.readdirSync(commandsPath);

  let loaded = 0;
  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(categoryPath)
      .filter((f) => f.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        const command = require(path.join(categoryPath, file));
        if (!command.name) continue;
        client.commands.set(command.name, command);
        if (command.aliases) {
          command.aliases.forEach((alias) => client.commands.set(alias, command));
        }
        loaded++;
      } catch (err) {
        logger.error(`Erro ao carregar comando ${file}: ${err.message}`);
      }
    }
  }
  logger.info(`✅ ${loaded} comandos carregados!`);
};
