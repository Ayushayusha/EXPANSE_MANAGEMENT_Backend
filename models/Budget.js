import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
     ref: "User", required: true 
    },
  month: {
     type: String, required: true 
    }, 
  limit: { 
    type: Number, required: true 
},
  createdAt: { 
    type: Date, default: Date.now 
}
});

budgetSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
