import mongoose from "mongoose";

export const quizPaymentSchema = mongoose.Schema(
    {
        merchantId: { type: String, required: true },
        merchantTransactionId: { type: String, required: true },
        transactionId: { type: String, required: true },
        statusCode: { type: String, required: true },
        amount: { type: Number, required: true },
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

    },


    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


export default mongoose.model("QuizPayment", quizPaymentSchema);
