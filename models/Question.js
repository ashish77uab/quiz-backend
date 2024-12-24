import mongoose from "mongoose";

export const questionSchema = mongoose.Schema(
    {
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true
        },
        question: { type: String, required: true },
        option1: { type: String, required: true },
        option2: { type: String, required: true },
        option3: { type: String, required: true },
        option4: { type: String, required: true },
        answer: {
            type: String,
            enum: ["A", "B", "C", 'D'],
            required: true
        },

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

export default mongoose.model("Question", questionSchema);

