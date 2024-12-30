import mongoose from "mongoose";

export const resultSchema = mongoose.Schema(
    {
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
        totalMarksGot: { type: Number, required: true },
        rightAnswerCount: { type: Number, required: true },
        wrongAnswerCount: { type: Number, required: true },
        questionAttempted: { type: Number, required: true },
        questionAnswer: [{
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
            answer: { type: String },
            userAnswer: { type: String },
            isCorrect: { type: Boolean }
        }],

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

export default mongoose.model("Result", resultSchema);

