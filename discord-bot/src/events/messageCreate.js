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

// ── Dedup: one Set per message ID (same process) + one lock file (cross-process)
const processedMessages = new Set();
// ── Per-user, per-command guard — claimed SYNCHRONOUSLY before any await
const activeCommands    = new Set();
const recentChannelUsers = new Map();

const LOCK_DIR = "/tmp/ll_locks";
try { fs.mkdirSync(LOCK_DIR, { recursive: true }); } catch {}

function claimMessage(msgId) {
  const lockPath = path.join(LOCK_DIR, `${msgId}.lock`);
  try {
    fs.writeFileSync(lockPath, String(Date.now()), { flag: "wx" });
    setTimeout(() => { try { fs.unlinkSync(lockPath); } catch {} }, 20_000);
    return true;
  } catch {
    return false;
  }
}

// Monotonic counter — each command execution gets a unique trace ID
let _execCounter = 0;

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Ignore gateway replays (messages sent before the bot started)
    if (Date.now() - message.createdTimestamp > 5000) return;

    // ── Layer 1: in-memory dedup by message ID (synchronous) ─────────────────
    if (processedMessages.has(message.id)) {
      logger.warn(`[DEDUP-1] message ${message.id} already in-memory — dropped`);
      return;
    }
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 20_000);

    // ── Layer 2: atomic file lock — blocks cross-process duplicates (synchronous)
    if (!claimMessage(message.id)) {
      logger.warn(`[DEDUP-2] message ${message.id} claimed by another process — dropped`);
      return;
    }

    const prefix    = config.prefix;
    const isCommand = message.content.startsWith(prefix);

    // ── For commands: parse name and claim the per-user guard SYNCHRONOUSLY ──
    //    Must happen before any `await` so rapid duplicate messages are blocked
    //    before any async gap opens.
    let command   = null;
    let args      = [];
    let execKey   = null;
    let traceId   = null;

    if (isCommand) {
      const parts = message.content.slice(prefix.length).trim().split(/\s+/);
      const commandName = parts[0]?.toLowerCase();
      if (!commandName) return;

      command = client.commands.get(commandName) ||
        client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

      if (command) {
        execKey = `${message.author.id}_${command.name}`;

        // ── Layer 3: per-user/per-command guard (synchronous, before any await) ──
        if (activeCommands.has(execKey)) {
          logger.warn(`[DEDUP-3] ${execKey} already executing — dropped (msgId=${message.id})`);
          return;
        }
        activeCommands.add(execKey);

        traceId = `${command.name}-${(++_execCounter).toString(36)}`;
        logger.info(`[CMD:${traceId}] START — user=${message.author.id} cmd=${command.name} msgId=${message.id}`);

        args = parts.slice(1);
      }
    }

    // ── Passive systems (XP, heat, bonds) — run for all messages ─────────────
    try {
      await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

      const spamResult = await AntiSpamSystem.check(message, client);
      if (spamResult) {
        if (execKey) activeCommands.delete(execKey);
        return;
      }

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
      logger.error(`[CMD:${traceId}] XP/antispam error: ${err.message}`);
      if (!isCommand) return;
    }

    // ── Command execution ──────────────────────────────────────────────────────
    if (!command) return;

    try {
      if (command.staffOnly && !checkPermission(message, "staff")) {
        return message.reply({ embeds: [errorEmbed("Sem Permissão", "Você não tem permissão para usar este comando.")] }).catch(() => {});
      }
      if (command.adminOnly && !checkPermission(message, "admin")) {
        return message.reply({ embeds: [errorEmbed("Sem Permissão", "Apenas administradores podem usar este comando.")] }).catch(() => {});
      }
      if (command.ownerOnly && !checkPermission(message, "owner")) {
        return message.reply({ embeds: [errorEmbed("Sem Permissão", "Apenas o dono pode usar este comando.")] }).catch(() => {});
      }

      const cooldownSecs = command.cooldown || config.cooldowns?.default || 3;
      const cd = checkCooldown(message.author.id, command.name, cooldownSecs);
      if (cd.onCooldown) {
        return message.reply({
          embeds: [warningEmbed("⏳ Cooldown", `Aguarde **${cd.timeLeft}s** antes de usar \`!${command.name}\` novamente.`)],
        }).catch(() => {});
      }

      message.channel.sendTyping().catch(() => {});

      logger.info(`[CMD:${traceId}] EXECUTING command.execute()`);
      await command.execute(message, args, client);
      logger.info(`[CMD:${traceId}] DONE`);
    } catch (err) {
      logger.error(`[CMD:${traceId}] ERROR in ${command.name}: ${err.message}\n${err.stack}`);
      message.reply({ embeds: [errorEmbed("Erro Interno", "Ocorreu um erro ao executar o comando.")] }).catch(() => {});
    } finally {
      if (execKey) activeCommands.delete(execKey);
    }
  },
};
