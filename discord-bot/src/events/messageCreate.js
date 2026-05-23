const fs     = require("fs");
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

// ── Dedup em memória (intra-processo) ────────────────────────────────────────
const processedMessages  = new Set();
const activeCommands     = new Set();
const recentChannelUsers = new Map();

// ── Dedup persistente em arquivo (inter-processo / múltiplas instâncias) ─────
const DEDUP_FILE = "/tmp/.ll_cmd_dedup.json";
const DEDUP_TTL  = 20_000; // 20 segundos

function claimMessage(msgId) {
  // Retorna true se pode processar, false se já foi processado por outra instância
  let store = {};
  try { store = JSON.parse(fs.readFileSync(DEDUP_FILE, "utf8")); } catch {}

  const now = Date.now();
  // Limpar entradas antigas
  for (const id of Object.keys(store)) {
    if (now - store[id] > DEDUP_TTL) delete store[id];
  }

  if (store[msgId]) {
    // Já processado por outra instância — silenciosamente ignora
    return false;
  }

  store[msgId] = now;
  try { fs.writeFileSync(DEDUP_FILE, JSON.stringify(store)); } catch {}
  return true;
}

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // ── Ignorar mensagens antigas (replay do gateway no reconnect) ────────────
    if (Date.now() - message.createdTimestamp > 5000) return;

    // ── Dedup 1: Set em memória (rápido, síncrono) ────────────────────────────
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), DEDUP_TTL);

    // ── Dedup 2: arquivo compartilhado (cross-instância) ─────────────────────
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

    // ── Executar comando ──────────────────────────────────────────────────────
    const args        = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // ── Dedup 3: guard de execução concorrente do mesmo cmd/usuário ───────────
    const execKey = `${message.author.id}_${command.name}`;
    if (activeCommands.has(execKey)) return;
    activeCommands.add(execKey);

    try {
      if (command.staffOnly && !checkPermission(message, "staff")) {
        return message
          .reply({ embeds: [errorEmbed("Sem Permissão", "Você não tem permissão para usar este comando.")] })
          .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
      }

      if (command.adminOnly && !checkPermission(message, "admin")) {
        return message
          .reply({ embeds: [errorEmbed("Sem Permissão", "Apenas administradores podem usar este comando.")] })
          .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
      }

      if (command.ownerOnly && !checkPermission(message, "owner")) {
        return message
          .reply({ embeds: [errorEmbed("Sem Permissão", "Apenas o dono pode usar este comando.")] })
          .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
      }

      const cooldownSecs = command.cooldown || config.cooldowns?.default || 3;
      const cd = checkCooldown(message.author.id, command.name, cooldownSecs);
      if (cd.onCooldown) {
        // Não auto-deletar — usuário precisa VER que está em cooldown para não reenviar
        return message
          .reply({ embeds: [warningEmbed("⏳ Cooldown", `Aguarde **${cd.timeLeft}s** antes de usar \`!${command.name}\` novamente.`)] })
          .catch(() => {});
      }

      await command.execute(message, args, client);
    } catch (err) {
      logger.error(`Erro no comando [${commandName}]: ${err.message}\n${err.stack}`);
      message
        .reply({ embeds: [errorEmbed("Erro Interno", "Ocorreu um erro ao executar o comando.")] })
        .catch(() => {});
    } finally {
      activeCommands.delete(execKey);
    }
  },
};
