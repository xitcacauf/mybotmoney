function sanitizeText(text, maxLength = 2000) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/[<>@#&]/g, (char) => {
      const map = { "<": "&lt;", ">": "&gt;", "@": "@ ", "#": "# ", "&": "&amp;" };
      return map[char];
    })
    .slice(0, maxLength)
    .trim();
}

function sanitizeUsername(name) {
  return name.replace(/[^\w\s\u00C0-\u024F]/gi, "").slice(0, 32).trim();
}

function isValidAge(age) {
  const n = parseInt(age);
  return !isNaN(n) && n >= 1 && n <= 99;
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

function isImageUrl(url) {
  if (!isValidUrl(url)) return false;
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

module.exports = { sanitizeText, sanitizeUsername, isValidAge, isValidUrl, isImageUrl };
