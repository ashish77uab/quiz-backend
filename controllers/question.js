import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import Result from "../models/Result.js";

export const getQuizQuestionList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || ""; // Search query from request

    const skip = (page - 1) * limit;

    const matchCondition = {
      name: { $regex: searchQuery, $options: "i" }, // Search by transactionId
    };




    // Count total documents
    const totalQuizes = await Quiz.countDocuments(matchCondition);

    // Fetch transactions with aggregation pipeline
    const allQuizes = await Quiz.aggregate([
      {
        $match: matchCondition, // Use dynamic match condition
      },
      {
        $sort: {
          createdAt: -1,

        },
      },
      {
        $skip: skip, // Skip for pagination
      },
      {
        $limit: limit, // Limit for pagination
      },
    ]);

    res.status(200).json({
      quizes: allQuizes,
      currentPage: page,
      totalPages: Math.ceil(totalQuizes / limit),
      totalQuizes,
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

export const submitQuizQuestion = async (req, res) => {
  try {
    const { quizId, questionAnswer } = req.body
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found!" });
    }
    const totalMarksGot = questionAnswer.reduce((acc, curr) => acc + (curr.isCorrect ? quiz?.rightMark * 1 : quiz?.negativeMark * 1), 0)
    const rightAnswerCount = questionAnswer.reduce((acc, curr) => acc + (curr.isCorrect ? 1 : 0), 0)
    const result = await Result.create({
      quizId: quizId,
      userId: req.user._id,
      questionAnswer: questionAnswer,
      totalMarksGot: totalMarksGot,
      rightAnswerCount: rightAnswerCount,
      wrongAnswerCount: Number(questionCount) - rightAnswerCount,
    });
    if (!result)
      return res.status(400).json({ message: "the quiz can be submitted!" })
    res.status(200).json(result);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};


