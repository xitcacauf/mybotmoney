const JsonDB = require("../utils/JsonDB");

const heatDB = new JsonDB("socialheat");

async function getGuildHeat(guildId) {
  let rec = await heatDB.findOne({ guildId });
  if (!rec) {
    rec = await heatDB.create({ guildId, heat: 0, totalInteractions: 0, lastReset: new Date().toISOString() });
  }
  return rec;
}

async function addHeat(guildId, amount = 1) {
  const rec = await getGuildHeat(guildId);
  const newHeat = Math.min(100, (rec.heat || 0) + amount);
  await heatDB.findOneAndUpdate(
    { guildId },
    { $set: { heat: newHeat }, $inc: { totalInteractions: amount } },
    { upsert: true }
  );
  return newHeat;
}

async function decayHeat(guildId) {
  const rec = await getGuildHeat(guildId);
  const newHeat = Math.max(0, (rec.heat || 0) - 5);
  await heatDB.findOneAndUpdate({ guildId }, { $set: { heat: newHeat } }, { upsert: true });
  return newHeat;
}

function getHeatLabel(heat) {
  if (heat < 10) return { label: "🧊 Gelado", color: 0x87ceeb };
  if (heat < 25) return { label: "😐 Morno", color: 0x98fb98 };
  if (heat < 50) return { label: "😊 Agitado", color: 0xffd700 };
  if (heat < 75) return { label: "🔥 Quente", color: 0xff8c00 };
  return { label: "🌋 VULCÃO!", color: 0xff0000 };
}

function getHeatBonus(heat) {
  if (heat < 25) return { xpMult: 1, econMult: 1 };
  if (heat < 50) return { xpMult: 1.25, econMult: 1.1 };
  if (heat < 75) return { xpMult: 1.5, econMult: 1.25 };
  return { xpMult: 2, econMult: 1.5 };
}

module.exports = { getGuildHeat, addHeat, decayHeat, getHeatLabel, getHeatBonus };
