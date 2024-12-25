import mongoose from "mongoose";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

export const getQuizQuestionList = async (req, res) => {
  try {
    const quizId = req.query.quizId
    const allQuizes = await Question.aggregate([
      {
        $match: {
          quizId: mongoose.Types.ObjectId(quizId),
        }
      },
    ]);

    res.status(200).json({
      quizes: allQuizes,
    });
  } catch (error) {
    console.error("Error fetching quiz list", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createQuizQuestion = async (req, res) => {
  try {
    const { quizId, questions } = req.body
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found!" });
    }
    if (Number(quiz?.questionCount) !== questions?.length) {
      return res.status(400).json({ message: `the number of questions in quiz should be ${quiz?.questionCount}!` });
    }
    const questionArr = questions?.map((item) => ({ ...item, quizId: quizId }))
    const questionsCreated = await Question.insertMany(questionArr);
    if (!questionsCreated)
      return res.status(400).json({ message: "the questions  cannot be created!" });
    res.status(201).json({ questions: questionsCreated, message: 'Created successfully' });
  } catch (error) {
    console.log(error, 'error creating questions')
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};


export const updateQuizQuestion = async (req, res) => {
  try {
    const { quizId, questions } = req.body;

    // Find the quiz by its ID
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found!" });
    }

    // Validate the question count
    if (Number(quiz.questionCount) !== questions.length) {
      return res
        .status(400)
        .json({ message: `The number of questions in the quiz should be ${quiz.questionCount}!` });
    }

    // Update the questions
    const bulkOperations = questions.map((item) => ({
      updateOne: {
        filter: { quizId: quizId, _id: item._id }, // Match by quizId and question ID
        update: { $set: { ...item } }, // Update fields from the provided data
        upsert: true, // Insert the document if it does not exist
      },
    }));

    const result = await Question.bulkWrite(bulkOperations);

    if (!result.modifiedCount && !result.upsertedCount) {
      return res.status(400).json({ message: "No questions were updated or created!" });
    }

    res.status(200).json({
      message: "Questions updated successfully!",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};




