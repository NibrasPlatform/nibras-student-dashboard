const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "fa-medal",
    },
    category: {
      type: String,
      enum: ["course", "competition", "community", "streak", "special"],
      default: "special",
    },
    points: {
      type: Number,
      default: 10,
    },
    requirement: {
      type: Number, // e.g., complete 5 courses
      default: 1,
    },
    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "epic", "legendary"],
      default: "common",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Achievement", achievementSchema);
