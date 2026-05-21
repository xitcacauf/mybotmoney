function calcCompatibility(profile1, profile2) {
  let score = 0;
  const max = 100;

  if (profile1.favoriteGame && profile2.favoriteGame) {
    if (profile1.favoriteGame.toLowerCase() === profile2.favoriteGame.toLowerCase())
      score += 25;
  }

  if (profile1.personality && profile2.personality) {
    const compatMatrix = {
      "Extrovertido": ["Extrovertido", "Introvertido"],
      "Introvertido": ["Extrovertido", "Introvertido"],
      "Animado": ["Animado", "Tranquilo"],
      "Tranquilo": ["Animado", "Tranquilo"],
      "Intenso": ["Intenso", "Calmo"],
      "Calmo": ["Intenso", "Calmo"],
    };
    const compat = compatMatrix[profile1.personality] || [];
    if (compat.includes(profile2.personality)) score += 20;
  }

  if (profile1.hobbies && profile2.hobbies) {
    const h1 = profile1.hobbies.toLowerCase().split(/[\s,]+/);
    const h2 = profile2.hobbies.toLowerCase().split(/[\s,]+/);
    const common = h1.filter((h) => h2.includes(h)).length;
    score += Math.min(common * 10, 30);
  }

  if (profile1.location && profile2.location) {
    if (profile1.location.toLowerCase() === profile2.location.toLowerCase())
      score += 15;
  }

  score += Math.floor(Math.random() * 10);

  return Math.min(score, max);
}

function getCompatibilityEmoji(score) {
  if (score >= 90) return "💞 Almas Gêmeas";
  if (score >= 75) return "❤️ Alta Compatibilidade";
  if (score >= 60) return "🧡 Boa Compatibilidade";
  if (score >= 45) return "💛 Compatibilidade Média";
  if (score >= 30) return "💚 Baixa Compatibilidade";
  return "💔 Pouca Compatibilidade";
}

module.exports = { calcCompatibility, getCompatibilityEmoji };
