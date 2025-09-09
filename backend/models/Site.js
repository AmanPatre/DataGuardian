import mongoose from "mongoose";

const siteSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 },
  simplifiedPolicy: { type: String },
  trackers: [String], // Example: ["cookies", "location", "email"]
}, { timestamps: true });

export default mongoose.model("Site", siteSchema);
