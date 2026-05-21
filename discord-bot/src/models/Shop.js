const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ["furniture", "clothing", "decoration", "pet", "effect", "role", "other"],
      default: "other",
    },
    price: { type: Number, required: true },
    emoji: { type: String, default: "📦" },
    available: { type: Boolean, default: true },
    stock: { type: Number, default: -1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);
