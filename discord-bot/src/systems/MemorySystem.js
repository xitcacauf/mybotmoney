const User = require("../models/User");

const memoryTypes = {
  first_message: { label: "💬 Primeira Mensagem", emoji: "💬" },
  first_gift: { label: "🎁 Primeiro Presente", emoji: "🎁" },
  first_call: { label: "📞 Primeira Call", emoji: "📞" },
  started_dating: { label: "💕 Começaram a Namorar", emoji: "💕" },
  got_married: { label: "💍 Casamento", emoji: "💍" },
  had_child: { label: "👶 Filho Adotado", emoji: "👶" },
  collar_placed: { label: "⛓️ Coleira Colocada", emoji: "⛓️" },
  anniversary: { label: "🎂 Aniversário", emoji: "🎂" },
};

async function addMemory(userId, guildId, type, description) {
  const info = memoryTypes[type] || { label: type, emoji: "📝" };
  const memory = {
    type,
    label: info.label,
    emoji: info.emoji,
    description,
    timestamp: new Date().toISOString(),
  };
  await User.findOneAndUpdate(
    { userId, guildId },
    { $push: { "relationship.memories": memory } }
  );
  return memory;
}

async function getMemories(userId, guildId) {
  const user = await User.findOne({ userId, guildId });
  return user?.relationship?.memories || [];
}

module.exports = { addMemory, getMemories, memoryTypes };
