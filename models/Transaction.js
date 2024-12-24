import mongoose from "mongoose";

export const transactionSchema = mongoose.Schema(
  {
    amount: { type: Number, required: true },
    screenShot: {
      type: String,
      required: function () {
        return this.actionType === "Deposit";
      },
    },
    actionType: {
      type: String,
      enum: ["Deposit", "Withdraw"],
      default: "Deposit",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
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

export default mongoose.model("Transaction", transactionSchema);
