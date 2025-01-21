import mongoose from "mongoose";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

export const getQuizQuestionInfoById = async (req, res) => {
  try {
    const questionId = req.query.questionId
    const question = await Question.findById(questionId);

    res.status(200).json(question);
  } catch (error) {
    console.error("Error fetching quiz questions", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getQuizQuestionList = async (req, res) => {
  try {
    const quizId = req.query.quizId
    const allQuestions = await Question.aggregate([
      {
        $match: {
          quizId: mongoose.Types.ObjectId(quizId),
        }
      },
    ]);

    res.status(200).json({
      questions: allQuestions,
    });
  } catch (error) {
    console.error("Error fetching quiz questions", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createQuizQuestion = async (req, res) => {
  try {
    const quizId = req.query.quizId
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found!" });
    }
    const questionsLength = await Question.countDocuments({ quizId: mongoose.Types.ObjectId(quizId) });
    console.log(questionsLength, 'questionsLength', quiz?.questionCount)
    if (Number(quiz?.questionCount) === Number(questionsLength)) {
      return res.status(400).json({ message: `the number of questions in quiz should be ${quiz?.questionCount}!` });
    }
    const questionCreated = await Question.create({ ...req.body, quizId: quizId });
    if (!questionCreated)
      return res.status(400).json({ message: "the questions  cannot be created!" });
    res.status(201).json({ questionCreated: questionCreated, message: 'Created successfully' });
  } catch (error) {
    console.log(error, 'error creating questions')
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};


export const updateQuizQuestion = async (req, res) => {
  try {
    const questionId = req.query.questionId;

    // Find the quiz by its ID
    const question = await Question.findByIdAndUpdate(
      questionId,
      {
        ...req.body,
      },
      { new: true }
    );
    if (!question)
      return res.status(400).json({ message: "the question cannot be updated!" })

    return res.status(200).json({
      message: "Question updated successfully!",
      question,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};




