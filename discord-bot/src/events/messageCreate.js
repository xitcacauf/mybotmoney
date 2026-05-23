const fs     = require("fs");
const path   = require("path");
const config = require("../config/config");
const logger = require("../utils/logger");
const { checkCooldown } = require("../utils/cooldown");
const { checkPermission } = require("../utils/permissions");
const { errorEmbed, warningEmbed } = require("../utils/embed");
const AntiSpamSystem = require("../systems/AntiSpam");
const User = require("../models/User");
const { checkLevelUp } = require("../systems/LevelSystem");
const { addBondXP } = require("../systems/ObsessionSystem");
const { addHeat } = require("../systems/SocialHeat");
const { isEventActive } = require("../systems/EventSystem");

// ─────────────────────────────────────────────────────────────────────────────
// DEDUP — três camadas independentes:
//   1. Set em memória        → bloqueia dentro do mesmo processo
//   2. Arquivo atômico /tmp  → bloqueia cross-processo/instância (flag:'wx')
//   3. activeCommands Set    → bloqueia execução concorrente do mesmo cmd/user
// ─────────────────────────────────────────────────────────────────────────────
const processedMessages = new Set();
const activeCommands    = new Set();
const recentChannelUsers = new Map();

const LOCK_DIR = "/tmp/ll_locks";
try { fs.mkdirSync(LOCK_DIR, { recursive: true }); } catch {}

function claimMessage(msgId) {
  // Camada atômica: writeFileSync com flag 'wx' falha se o arquivo já existe.
  // É a única operação verdadeiramente atômica no sistema de arquivos Unix.
  const lockPath = path.join(LOCK_DIR, `${msgId}.lock`);
  try {
    fs.writeFileSync(lockPath, String(Date.now()), { flag: "wx" });
    // Remove o lock após 20 segundos para não acumular arquivos
    setTimeout(() => { try { fs.unlinkSync(lockPath); } catch {} }, 20_000);
    return true;  // conseguimos o lock = podemos processar
  } catch {
    return false; // arquivo já existe = outra instância já processou
  }
}

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // ── Ignorar replays do gateway (mensagens enviadas antes do bot iniciar) ──
    if (Date.now() - message.createdTimestamp > 5000) return;

    // ── Camada 1: Set em memória ──────────────────────────────────────────────
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 20_000);

    // ── Camada 2: lock atômico em arquivo ────────────────────────────────────
    if (!claimMessage(message.id)) return;

    const prefix    = config.prefix;
    const isCommand = message.content.startsWith(prefix);

    // ── Sistemas passivos (XP, calor, vínculos) ───────────────────────────────
    try {
      await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

      const spamResult = await AntiSpamSystem.check(message, client);
      if (spamResult) return;

      if (!isCommand) {
        let xpGain = 2;
        if (isEventActive("bonus_xp")) xpGain = 6;

        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          {
            $inc: { "social.messages": 1, "social.xp": xpGain },
            $set: { "social.lastSeen": new Date().toISOString() },
          }
        );

        await checkLevelUp(message.author.id, message.guild.id, message.channel).catch(() => {});
        await addHeat(message.guild.id, 1).catch(() => {});

        const chId = message.channel.id;
        if (!recentChannelUsers.has(chId)) recentChannelUsers.set(chId, new Map());
        const chUsers = recentChannelUsers.get(chId);

        for (const [uid, ts] of chUsers.entries()) {
          if (uid !== message.author.id && Date.now() - ts < 300000) {
            await addBondXP(message.author.id, message.guild.id, uid, 0.5).catch(() => {});
          }
        }
        chUsers.set(message.author.id, Date.now());
        if (chUsers.size > 20) {
          for (const [uid, ts] of chUsers.entries()) {
            if (Date.now() - ts > 300000) chUsers.delete(uid);
          }
        }
        return;
      }
    } catch (err) {
      logger.error(`Erro no sistema de XP/antispam: ${err.message}`);
      if (!isCommand) return;
    }

    // ── Parsear comando ───────────────────────────────────────────────────────
    const args        = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // ── Camada 3: guard de execução concorrente ───────────────────────────────
    const execKey = `${message.author.id}_${command.name}`;
    if (activeCommands.has(execKey)) return;
    activeCommands.add(execKey);

    try {
      // ── Permissões ────────────────────────────────────────────────────────
      if (command.staffOnly && !checkPermission(message, "staff")) {
        return message.reply({ embeds: [errorEmbed("Sem Permissão", "Você não tem permissão para usar este comando.")] }).catch(() => {});
      }
      if (command.adminOnly && !checkPermission(message, "admin")) {
        return message.reply({ embeds: [errorEmbed("Sem Permissão", "Apenas administradores podem usar este comando.")] }).catch(() => {});
      }
      if (command.ownerOnly && !checkPermission(message, "owner")) {
        return message.reply({ embeds: [errorEmbed("Sem Permissão", "Apenas o dono pode usar este comando.")] }).catch(() => {});
      }

      // ── Cooldown ──────────────────────────────────────────────────────────
      const cooldownSecs = command.cooldown || config.cooldowns?.default || 3;
      const cd = checkCooldown(message.author.id, command.name, cooldownSecs);
      if (cd.onCooldown) {
        return message.reply({
          embeds: [warningEmbed("⏳ Cooldown", `Aguarde **${cd.timeLeft}s** antes de usar \`!${command.name}\` novamente.`)],
        }).catch(() => {});
      }

      // ── Typing indicator: dá sensação de processamento ────────────────────
      message.channel.sendTyping().catch(() => {});

      // ── Executar ──────────────────────────────────────────────────────────
      await command.execute(message, args, client);
    } catch (err) {
      logger.error(`Erro no comando [${commandName}]: ${err.message}\n${err.stack}`);
      message.reply({ embeds: [errorEmbed("Erro Interno", "Ocorreu um erro ao executar o comando.")] }).catch(() => {});
    } finally {
      activeCommands.delete(execKey);
    }
  },
};
