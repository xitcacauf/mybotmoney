require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const config = require("./config/config");
const logger = require("./utils/logger");

const loadCommands = require("./handlers/commandHandler");
const loadEvents = require("./handlers/eventHandler");
const loadButtons = require("./handlers/buttonHandler");
const loadModals = require("./handlers/modalHandler");
const loadSelectMenus = require("./handlers/selectHandler");
const { startWebServer } = require("./web/server");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selectMenus = new Collection();
client.cooldowns = new Collection();
client.pendingMarriages = new Map();
client.pendingCollars = new Map();
client.privateCallTimers = new Map();

loadCommands(client);
loadEvents(client);
loadButtons(client);
loadModals(client);
loadSelectMenus(client);

startWebServer(client);
logger.info("🗄️  Usando banco de dados local (JSON files)");

const token = (config.token || "").trim();
if (!token) {
  logger.error("❌ DISCORD_TOKEN não definido! Configure a variável de ambiente.");
  process.exit(1);
}

client.login(token)
  .then(() => logger.info("✅ Bot iniciado com sucesso!"))
  .catch((err) => {
    logger.error(`❌ Erro ao iniciar o bot: ${err.message || String(err)}`);
    process.exit(1);
  });

module.exports = client;
