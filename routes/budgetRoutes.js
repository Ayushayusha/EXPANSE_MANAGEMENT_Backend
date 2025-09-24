import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { setBudget, getBudget } from "../controllers/budgetController.js";

const router = express.Router();
router.use(authenticate);

router.post("/", setBudget);
router.get("/", getBudget);

export default router;
