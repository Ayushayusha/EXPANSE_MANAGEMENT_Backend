// import Expense from "../models/Expense.js";

// export const addExpense = async (req, res) => {
//   try {
//     const { amount, description, category, date } = req.body;
//     if (!amount || !category) return res.status(400).json({ error: "amount and category required" });
//     const expense = await Expense.create({
//       user: req.user._id,
//       amount,
//       description: description || "",
//       category,
//       date: date || Date.now()
//     });
//     res.status(201).json(expense);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const getExpenses = async (req, res) => {
//   try {
//     // optional query params: limit, skip, month (YYYY-MM)
//     const { limit = 20, skip = 0, month } = req.query;
//     const filter = { user: req.user._id };
//     if (month) {
//       const [y, m] = month.split("-");
//       const start = new Date(y, Number(m) - 1, 1);
//       const end = new Date(y, Number(m), 1);
//       filter.date = { $gte: start, $lt: end };
//     }
//     const expenses = await Expense.find(filter).sort({ date: -1 }).skip(Number(skip)).limit(Number(limit));
//     res.json(expenses);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// //update

// export const updateExpense = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updated = await Expense.findOneAndUpdate(
//       { _id: id, user: req.user._id },
//       req.body,
//       { new: true }
//     );
//     if (!updated) return res.status(404).json({ error: "Expense not found" });
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// export const deleteExpense = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await Expense.findOneAndDelete({ _id: id, user: req.user._id });
//     if (!deleted) return res.status(404).json({ error: "Expense not found" });
//     res.json({ success: true, message: "Deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


import Expense from "../models/Expense.js";
import Budget from "../models/Budget.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Add new expense
 */
export const addExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    if (!amount || !category) {
      return res.status(400).json({ error: "amount and category required" });
    }

    // 1. Save expense
    const expense = await Expense.create({
      user: req.user._id,
      amount,
      description: description || "",
      category,
      date: date || Date.now(),
    });

    // 2. Get budget for current month
    const now = new Date();
    const month = now.toISOString().slice(0, 7); // e.g. "2025-09"
    const budget = await Budget.findOne({ user: req.user._id, month });

    if (budget) {
      // 3. Calculate total spent in this month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const agg = await Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const spent = agg.length ? agg[0].total : 0;

      // 4. If exceeded, send email
      if (spent > budget.limit) {
        const user = await User.findById(req.user._id);
        if (user?.email) {
          await sendEmail(
            user.email,
            "⚠️ Budget Exceeded",
            `Hi ${user.name},\n\nYour spending for ${month} is ₹${spent}, which exceeds your budget of ₹${budget.limit}.\n\nPlease review your expenses.`
          );
        }
      }
    }

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get expenses (with optional month filter & pagination)
 */
export const getExpenses = async (req, res) => {
  try {
    const { limit = 20, skip = 0, month } = req.query;

    const filter = { user: req.user._id };
    let start, end;

    if (month) {
      const [y, m] = month.split("-");
      start = new Date(y, Number(m) - 1, 1);
      end = new Date(y, Number(m), 1);
      filter.date = { $gte: start, $lt: end };
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    // calculate total spent in this month (if month provided)
    let spent = 0;
    let remaining = null;
    if (month) {
      const agg = await Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      spent = agg.length ? agg[0].total : 0;

      // check if user has budget set
      const budget = await Budget.findOne({ user: req.user._id, month });
      if (budget) {
        remaining = budget.limit - spent;
      }
    }

    res.json({ expenses, spent, remaining });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update expense
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Expense.findOneAndUpdate(
      { _id: id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Expense not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete expense
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });
    if (!deleted) return res.status(404).json({ error: "Expense not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
