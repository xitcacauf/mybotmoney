const User = require("../models/User");

async function addBondXP(userId, guildId, targetId, amount = 1) {
  if (!targetId || userId === targetId) return;
  const user = await User.findOrCreate(userId, guildId, "");
  const bonds = user.bonds || {};
  if (!bonds[targetId]) bonds[targetId] = { interactions: 0, callMinutes: 0, gifts: 0, obsessionLevel: 0, bondXP: 0 };
  bonds[targetId].interactions += 1;
  bonds[targetId].bondXP = (bonds[targetId].bondXP || 0) + amount;
  const newObs = Math.min(100, Math.floor(bonds[targetId].bondXP / 50));
  bonds[targetId].obsessionLevel = newObs;
  await User.findOneAndUpdate({ userId, guildId }, { $set: { bonds } });
  return bonds[targetId];
}

async function addCallMinutes(userId, guildId, targetId, minutes) {
  if (!targetId || userId === targetId) return;
  const user = await User.findOrCreate(userId, guildId, "");
  const bonds = user.bonds || {};
  if (!bonds[targetId]) bonds[targetId] = { interactions: 0, callMinutes: 0, gifts: 0, obsessionLevel: 0, bondXP: 0 };
  bonds[targetId].callMinutes = (bonds[targetId].callMinutes || 0) + minutes;
  bonds[targetId].bondXP = (bonds[targetId].bondXP || 0) + minutes * 2;
  bonds[targetId].obsessionLevel = Math.min(100, Math.floor(bonds[targetId].bondXP / 50));
  await User.findOneAndUpdate({ userId, guildId }, { $set: { bonds } });
}

async function getTopBonds(userId, guildId) {
  const user = await User.findOne({ userId, guildId });
  if (!user || !user.bonds) return [];
  return Object.entries(user.bonds)
    .map(([id, data]) => ({ userId: id, ...data }))
    .sort((a, b) => (b.bondXP || 0) - (a.bondXP || 0))
    .slice(0, 5);
}

function getObsessionLabel(level) {
  if (level < 10) return "🌱 Conhecido";
  if (level < 25) return "🙂 Amizade";
  if (level < 40) return "💛 Próximo";
  if (level < 55) return "💗 Apegado";
  if (level < 70) return "💘 Intenso";
  if (level < 85) return "🔥 Obcecado";
  return "⛓️ Dependente";
}

module.exports = { addBondXP, addCallMinutes, getTopBonds, getObsessionLabel };
