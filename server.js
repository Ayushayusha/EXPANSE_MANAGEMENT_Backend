
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";

mongoose.set("strictQuery", true);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budget", budgetRoutes);

app.get("/", (req, res) => res.send({ success: true, message: "Expense Tracker API" }));

app.get("/env-test", (req, res) => {
  res.json({
    frontend: process.env.FRONTEND_URL,
    dashboard: process.env.DASHBOARD_URL,
    mongo: process.env.MONGODB_URI ? "exists" : "missing"
  });
});


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(` Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
