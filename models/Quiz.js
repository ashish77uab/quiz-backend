import mongoose from "mongoose";
import Question from "./Question.js";

export const quizSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        questionCount: { type: Number, required: true },
        negativeMark: { type: Number, required: true },
        rightMark: { type: Number, required: true },
        time: { type: Number, required: true },
        isPaid: {
            type: Boolean,
            default: false,
            required: true
        },
        amount: {
            type: Number,
            required: function () {
                return this.isPaid;
            }
        },
        userId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: [],
            }
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


export default mongoose.model("Quiz", quizSchema);
