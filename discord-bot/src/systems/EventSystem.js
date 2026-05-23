const { EmbedBuilder } = require("discord.js");
const User = require("../models/User");
const JsonDB = require("../utils/JsonDB");
const logger = require("../utils/logger");

const eventDB = new JsonDB("events");

const eventTemplates = [
  {
    id: "bonus_trabalho",
    name: "💼 Hora Extra!",
    description: "Todos os trabalhos pagam **2x** por 1 hora!",
    duration: 60,
    type: "economy",
    color: 0x00ff88,
  },
  {
    id: "caca_tesouro",
    name: "🗺️ Caça ao Tesouro!",
    description: "Um tesouro escondido! Use `!tesouro` para tentar encontrar o prêmio!",
    duration: 30,
    type: "fun",
    color: 0xffd700,
    reward: { min: 500, max: 2000 },
  },
  {
    id: "speed_dating",
    name: "💘 Speed Dating!",
    description: "Hora do speed dating! Apresente-se e conheça alguém novo!",
    duration: 45,
    type: "social",
    color: 0xff69b4,
  },
  {
    id: "tempestade_economica",
    name: "⚡ Tempestade Econômica!",
    description: "Cuidado! Crimes têm 50% a mais de chance de falhar por 30 min!",
    duration: 30,
    type: "economy",
    color: 0xff4500,
  },
  {
    id: "noite_confissao",
    name: "🌙 Noite da Confissão!",
    description: "A noite chegou... quem tem coragem de fazer uma confissão? Use `!confissao`!",
    duration: 60,
    type: "social",
    color: 0x6a0dad,
  },
  {
    id: "bonus_xp",
    name: "⭐ Explosão de XP!",
    description: "Todas as mensagens dão **3x XP** por 1 hora! Fale bastante!",
    duration: 60,
    type: "social",
    color: 0xffd700,
  },
  {
    id: "guerra_casais",
    name: "⚔️ Guerra de Casais!",
    description: "O casal com mais interações nos próximos 30 min ganha um prêmio especial!",
    duration: 30,
    type: "social",
    color: 0xff1493,
  },
  {
    id: "leilao",
    name: "🔨 Leilão Especial!",
    description: "Item raro em leilão! Use `!loja` para ver o item do dia com desconto de 30%!",
    duration: 60,
    type: "economy",
    color: 0xffa500,
  },
];

let activeEvent = null;

function getActiveEvent() {
  return activeEvent;
}

function isEventActive(eventId) {
  return activeEvent?.id === eventId && Date.now() < activeEvent?.endsAt;
}

async function triggerRandomEvent(client) {
  try {
    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    const endsAt = Date.now() + template.duration * 60 * 1000;

    activeEvent = { ...template, endsAt, startedAt: Date.now() };

    const embed = new EmbedBuilder()
      .setColor(template.color)
      .setTitle(`🎉 EVENTO: ${template.name}`)
      .setDescription(template.description)
      .addFields({ name: "⏱️ Duração", value: `${template.duration} minutos`, inline: true })
      .setFooter({ text: "Aproveite o evento!" })
      .setTimestamp();

    for (const guild of client.guilds.cache.values()) {
      try {
        const gConfig = require("../models/GuildConfig");
        const cfg = await gConfig.findOrCreate(guild.id);
        const channelId = cfg.channels?.logs || cfg.channels?.general || cfg.welcome?.channelId;
        if (channelId) {
          const channel = guild.channels.cache.get(channelId);
          if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
        } else {
          const ch = guild.channels.cache.find(
            (c) => c.isTextBased() && c.permissionsFor(guild.members.me)?.has("SendMessages") && !c.isThread()
          );
          if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
        }
      } catch {}
    }

    setTimeout(() => {
      if (activeEvent?.id === template.id) activeEvent = null;
    }, template.duration * 60 * 1000);

    logger.info(`🎉 Evento iniciado: ${template.name}`);
  } catch (err) {
    logger.error(`Erro ao disparar evento: ${err.message}`);
  }
}

module.exports = { triggerRandomEvent, getActiveEvent, isEventActive, eventTemplates };
