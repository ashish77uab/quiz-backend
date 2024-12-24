import mongoose from "mongoose";

export const stockTransactionSchema = mongoose.Schema(
  {
    amount: { type: Number, required: true },
    actionType: {
      type: String,
      enum: ["Buy", "Sell", "Settled"],
      default: 'Buy',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("StockTransaction", stockTransactionSchema);
