const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    username: String,
    subject: { type: String, default: "Sem assunto" },
    status: {
      type: String,
      enum: ["open", "claimed", "closed"],
      default: "open",
    },
    claimedBy: { type: String, default: null },
    members: [String],
    privateCallId: { type: String, default: null },
    transcript: [
      {
        author: String,
        authorId: String,
        content: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
