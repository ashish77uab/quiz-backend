import mongoose from "mongoose";

export const walletSchema = mongoose.Schema(
  {
    amount: { type: Number, default:0 },
    winnings: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


export default mongoose.model("Wallet", walletSchema);
