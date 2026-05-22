require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const logger = require("./utils/logger");
const config = require("./config/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.antiSpam = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selectMenus = new Collection();
client.privateCallTimers = new Collection();

const commandHandler = require("./handlers/commandHandler");
const eventHandler = require("./handlers/eventHandler");
const buttonHandler = require("./handlers/buttonHandler");
const modalHandler = require("./handlers/modalHandler");
const selectHandler = require("./handlers/selectHandler");

commandHandler(client);
eventHandler(client);
buttonHandler(client);
modalHandler(client);
selectHandler(client);

process.on("uncaughtException", (err) => {
  logger.error("UncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  logger.error("UnhandledRejection:", reason);
});

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
