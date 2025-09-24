import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { addExpense, getExpenses, updateExpense, deleteExpense } from "../controllers/expenseController.js";


const router = express.Router();
router.use(authenticate);

router.post("/", addExpense);
router.get("/", getExpenses);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;