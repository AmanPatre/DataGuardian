import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import siteRoutes from "./routes/siteRoutes.js";
import connectDB from "./config/db.js";


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
connectDB();

// Routes
app.use("/api/sites", siteRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
