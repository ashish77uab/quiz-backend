import mongoose from "mongoose";

export const stockSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    startPrice: { type: Number, required: true },
    endPrice: { type: Number, default: null },
    quantityLeft: { type: Number, default: null },
    diffAmount: { type: Number, default: null },
    isSettled: { type: Boolean, default: false },
    date: { type: Date },
    actionType: {
      type: String,
      enum: ["Buy", "Sell", 'Settled'],
      default: "Buy",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("Stock", stockSchema);
