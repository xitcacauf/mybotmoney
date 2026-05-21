const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    type: { type: String, enum: ["dating", "duo", "gf", "darkLove"], required: true },
    user1Id: { type: String, required: true },
    user2Id: { type: String, required: true },
    compatibility: { type: Number, default: 0 },
    channelId: { type: String, default: null },
    callId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "ended"],
      default: "active",
    },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
