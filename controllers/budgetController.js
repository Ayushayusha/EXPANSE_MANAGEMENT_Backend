import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";


export const setBudget = async (req, res) => {
  try {
    const { month, limit } = req.body;
    if (!month || !limit) return res.status(400).json({ error: "month and limit required" });
    const upsert = await Budget.findOneAndUpdate(
      { user: req.user._id, month },
      { user: req.user._id, month, limit },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(upsert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const { month } = req.query;
    const m = month || new Date().toISOString().slice(0, 7);
    const budget = await Budget.findOne({ user: req.user._id, month: m });
    if (!budget) {
      // compute spent for month = sum of expenses
      const [y, mm] = m.split("-");
      const start = new Date(y, Number(mm) - 1, 1);
      const end = new Date(y, Number(mm), 1);
      const agg = await Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const spent = agg.length ? agg[0].total : 0;
      return res.json({ month: m, limit: 0, spent });
    } else {
      const [y, mm] = m.split("-");
      const start = new Date(y, Number(mm) - 1, 1);
      const end = new Date(y, Number(mm), 1);
      const agg = await Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const spent = agg.length ? agg[0].total : 0;
      res.json({ month: m, limit: budget.limit, spent });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


