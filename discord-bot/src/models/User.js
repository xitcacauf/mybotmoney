const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    username: String,

    profile: {
      bio: { type: String, default: "" },
      age: { type: Number, default: 0 },
      gender: { type: String, default: "" },
      location: { type: String, default: "" },
      photo: { type: String, default: "" },
      personality: { type: String, default: "" },
      hobbies: [String],
      favoriteGame: { type: String, default: "" },
      badges: [String],
      reputation: { type: Number, default: 0 },
    },

    economy: {
      wallet: { type: Number, default: 1000 },
      bank: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      lastDaily: { type: Date, default: null },
      lastWork: { type: Date, default: null },
      lastCrime: { type: Date, default: null },
    },

    inventory: [
      {
        itemId: String,
        name: String,
        type: String,
        quantity: { type: Number, default: 1 },
        acquiredAt: { type: Date, default: Date.now },
      },
    ],

    house: {
      level: { type: Number, default: 0 },
      name: { type: String, default: "" },
      furniture: [String],
      value: { type: Number, default: 0 },
    },

    relationship: {
      status: {
        type: String,
        enum: ["single", "dating", "married", "divorced"],
        default: "single",
      },
      partnerId: { type: String, default: null },
      partnerName: { type: String, default: "" },
      marriedAt: { type: Date, default: null },
      children: [{ name: String, age: Number, bornAt: Date }],
    },

    social: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      messages: { type: Number, default: 0 },
      voiceMinutes: { type: Number, default: 0 },
    },

    darkLove: {
      role: {
        type: String,
        enum: [
          "Dominante",
          "Submisso",
          "Dono",
          "Dona",
          "Switch",
          "Observador",
          "Brat",
          "Pet",
          "Sadista",
          "Masoquista",
          "none",
        ],
        default: "none",
      },
      coleira: { type: String, default: null },
      coleiradoAt: { type: Date, default: null },
    },

    dating: {
      active: { type: Boolean, default: false },
      profileData: {
        name: String,
        age: Number,
        gender: String,
        desiredGender: String,
        personality: String,
        hobbies: String,
        favoriteGame: String,
        location: String,
        photo: String,
        bio: String,
      },
      matches: [{ userId: String, matchedAt: Date }],
    },

    duo: {
      active: { type: Boolean, default: false },
      profileData: {
        game: String,
        rank: String,
        platform: String,
        mode: String,
        playstyle: String,
        schedule: String,
        microphone: Boolean,
        objective: String,
      },
    },

    punishments: [
      {
        type: { type: String },
        reason: String,
        moderatorId: String,
        duration: Number,
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    warnings: [
      {
        reason: String,
        moderatorId: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ userId: 1, guildId: 1 });

userSchema.statics.findOrCreate = async function (userId, guildId, username) {
  let user = await this.findOne({ userId, guildId });
  if (!user) {
    user = await this.create({ userId, guildId, username });
  }
  return user;
};

module.exports = mongoose.model("User", userSchema);
