import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Result from "../models/Result.js";
import Question from "../models/Question.js";

export const getQuizList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || ""; // Search query from request

    const skip = (page - 1) * limit;

    const matchCondition = {
      name: { $regex: searchQuery, $options: "i" }, // Search by quiz name
    };

    // Count total quizzes
    const totalQuizes = await Quiz.countDocuments(matchCondition);

    // Fetch quizzes with additional data
    const allQuizes = await Quiz.aggregate([
      {
        $match: matchCondition, // Use dynamic match condition
      },
      {
        $lookup: {
          from: "results", // Collection name for results
          localField: "_id", // Quiz `_id` field
          foreignField: "quizId", // Result `quizId` field
          as: "results", // Name of the array to store matched results
        },
      },
      {
        $addFields: {
          totalUsersAttempted: { $size: { $setUnion: "$results.userId" } }, // Count distinct user IDs
          isAdded: { $gt: [{ $size: "$results" }, 0] }, // Check if the quiz has any results
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort by creation date
        },
      },
      {
        $skip: skip, // Skip for pagination
      },
      {
        $limit: limit, // Limit for pagination
      },
      {
        $project: {
          questions: 0, // Exclude the `questions` array from the response
          results: 0, // Exclude the `results` array from the response
        },
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

export const getQuizListForUser = async (req, res) => {
  try {
    const userId = req.user.id; // User ID from request
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || ""; // Search query from request
    const skip = (page - 1) * limit;
    const matchCondition = {
      name: { $regex: searchQuery, $options: "i" }, // Search by name
    };

    // Count total documents
    const totalQuizes = await Quiz.countDocuments(matchCondition);

    // Fetch quizzes with aggregation pipeline
    const allQuizes = await Quiz.aggregate([
      {
        $match: matchCondition, // Use dynamic match condition
      },
      {
        $lookup: {
          from: "results", // Collection name for results
          let: { quizId: "$_id" }, // Pass the current quiz `_id`
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$quizId", "$$quizId"] }, { $eq: ["$userId", mongoose.Types.ObjectId(userId)] }] } } },
            { $limit: 1 }, // Limit to one result to check for existence
          ],
          as: "attempted", // Name of the array to store matched results
        },
      },
      {
        $lookup: {
          from: "quizpayments", // Collection name for quiz payments
          let: { quizId: "$_id" }, // Pass the current quiz `_id`
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$quizId", "$$quizId"] },
                    { $eq: ["$userId", mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            { $limit: 1 }, // Limit to one result to check for payment existence
          ],
          as: "payments", // Name of the array to store matched payment results
        },
      },
      {
        $addFields: {
          isAttempted: { $gt: [{ $size: "$attempted" }, 0] }, // Check if `attempted` array has at least one document
          isPaymentDone: { $gt: [{ $size: "$payments" }, 0] },
        },
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
      {
        $project: {
          attempted: 0, // Exclude the `attempted` array from the response
          payments: 0,
        },
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


export const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body });
    if (!quiz)
      return res.status(400).json({ message: "the quiz  cannot be created!" });
    res.status(201).json(quiz);
  } catch (error) {
    console.log(error, 'error creating quiz')
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id
    const quiz = await Quiz.findByIdAndDelete(
      quizId
    );
    if (!quiz)
      return res.status(400).json({ message: "the quiz cannot be deleted!" })
    await Question.deleteMany({ quizId: quizId });
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
export const updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id
    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      {
        ...req.body,
      },
      { new: true }
    );
    if (!quiz)
      return res.status(400).json({ message: "the quiz cannot be updated!" })

    res.status(200).json(quiz);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
export const getQuizInfo = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const quizInfo = await Quiz.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(quizId) }, // Match the specific quiz by ID
      },

      {
        $lookup: {
          from: "quizpayments", // Collection name for quiz payments
          let: { quizId: "$_id" }, // Pass the quiz `_id`
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$quizId", "$$quizId"] },
                    { $eq: ["$userId", mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            { $limit: 1 }, // Limit to one payment record
          ],
          as: "payments", // Store the result in `payments` field
        },
      },
      {
        $addFields: {
          isPaymentDone: { $gt: [{ $size: "$payments" }, 0] }, // Check if `payments` has any document
        },
      },
      {
        $project: {
          payments: 0, // Exclude the `payments` field
        },
      },
    ]);

    if (!quizInfo || quizInfo.length === 0) {
      return res.status(400).json({ message: "Quiz not found" });
    }

    res.status(200).json(quizInfo[0]); // Return the first (and only) result
  } catch (error) {
    console.error("Error fetching quiz info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, questionAnswer } = req.body
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found!" });
    }
    const totalMarksGot = questionAnswer?.filter((curr) => curr.isCorrect !== null)?.reduce((acc, curr) => acc + (curr.isCorrect ? quiz?.rightMark * 1 : - quiz?.negativeMark * 1), 0)
    const rightAnswerCount = questionAnswer?.filter((curr) => curr.userAnswer !== null).reduce((acc, curr) => acc + (curr.isCorrect ? 1 : 0), 0)
    const wrongAnswerCount = questionAnswer?.filter((curr) => curr.userAnswer !== null)?.reduce((acc, curr) => acc + (!curr.isCorrect ? 1 : 0), 0)
    const questionAttempted = questionAnswer?.filter((item) => item?.userAnswer)?.length
    const result = await Result.create({
      quizId: quizId,
      userId: req.user.id,
      questionAnswer: questionAnswer,
      totalMarksGot: totalMarksGot,
      rightAnswerCount: rightAnswerCount,
      wrongAnswerCount: wrongAnswerCount,
      questionAttempted: questionAttempted
    });
    if (!result)
      return res.status(400).json({ message: "the quiz can not be submitted!" })
    res.status(200).json(result);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};

export const quizAttemptedResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    const quizId = req.query?.quizId;
    const page = parseInt(req.query.page, 10) || 1; // Default page is 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
    // Check if quizId or userId is missing
    if (!userId) {
      return res.status(400).json({ message: "quizId and userId are required" });
    }

    // Aggregation pipeline to calculate rank and total participants
    const rankData = await Result.aggregate([
      // Match results for the specific quiz
      {
        $match: {
          quizId: mongoose.Types.ObjectId(quizId),
        },
      },
      // Sort by totalMarksGot in descending order
      {
        $sort: {
          totalMarksGot: -1, // Highest marks first
        },
      },
      // Add a rank field using $setWindowFields
      {
        $setWindowFields: {
          sortBy: { totalMarksGot: -1 },
          output: {
            rank: {
              $rank: {},
            },
          },
        },
      },
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
        },
      },
      // Perform a $lookup to populate questionId in questionAnswer
      {
        $lookup: {
          from: "questions", // Name of the collection to join
          localField: "questionAnswer.questionId", // Field in the Result collection
          foreignField: "_id", // Field in the Question collection
          as: "questionDetails", // Output array containing joined documents
        },
      },
      // Add the question details back into questionAnswer
      {
        $addFields: {
          questionAnswer: {
            $map: {
              input: "$questionAnswer",
              as: "qa",
              in: {
                $mergeObjects: [
                  "$$qa",
                  {
                    question: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$questionDetails",
                            as: "qd",
                            cond: { $eq: ["$$qd._id", "$$qa.questionId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "quizzes", // Name of the Quiz collection
          localField: "quizId", // Field in the Result collection
          foreignField: "_id", // Field in the Quiz collection
          as: "quizDetails", // Output array containing joined documents
        },
      },
      // Flatten the quizDetails array (if only one document is expected)
      {
        $unwind: {
          path: "$quizDetails",
          preserveNullAndEmptyArrays: true, // In case no match is found
        },
      },
      // Optionally project fields if needed
      {
        $project: {
          questionDetails: 0, // Remove the temporary questionDetails array
        },
      },
      {
        $skip: (page - 1) * limit, // Skip documents for previous pages
      },
      {
        $limit: limit, // Limit the number of documents per page
      },
    ]);

    // Total participants in the quiz
    const totalParticipants = await Result.countDocuments({ quizId });
    const totalData = await Result.countDocuments({ quizId, userId });
    // Return the user's rank, marks, and total participants
    res.status(200).json({
      result: rankData,
      totalParticipants,
      currentPage: page,
      count: totalData,
      totalPages: Math.ceil(totalData / limit),
    });
  } catch (error) {
    console.error("Error fetching attempted result", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const quizSingleResult = async (req, res) => {
  try {
    const resultId = req.query?.resultId;
    const quizId = req.query?.quizId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Aggregation pipeline
    const rankData = await Result.aggregate([
      {
        $match: { quizId: mongoose.Types.ObjectId(quizId) }, // Match results for the specific quiz
      },
      {
        $sort: { totalMarksGot: -1 }, // Sort by total marks
      },
      {
        $setWindowFields: {
          sortBy: { totalMarksGot: -1 },
          output: { rank: { $rank: {} } },
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "questionAnswer.questionId",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      {
        $match: { _id: mongoose.Types.ObjectId(resultId) }, // Match the specific resultId
      },
      {
        $addFields: {
          questionAnswer: {
            $map: {
              input: "$questionAnswer",
              as: "qa",
              in: {
                $mergeObjects: [
                  "$$qa",
                  {
                    question: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$questionDetails",
                            as: "qd",
                            cond: { $eq: ["$$qd._id", "$$qa.questionId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      {
        $unwind: { path: "$quizDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: { questionDetails: 0 },
      },
    ]);

    // Calculate the percentage of users who answered each question correctly
    const questionStatistics = await Result.aggregate([
      {
        $match: { quizId: mongoose.Types.ObjectId(quizId) }, // Match the specific quiz
      },
      {
        $unwind: "$questionAnswer", // Deconstruct the questionAnswer array
      },
      {
        $group: {
          _id: "$questionAnswer.questionId", // Group by questionId
          totalAnswers: { $sum: 1 }, // Count total answers for the question
          correctAnswers: {
            $sum: { $cond: [{ $eq: ["$questionAnswer.isCorrect", true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalAnswers: 1,
          correctAnswers: 1,
          percentageCorrect: {
            $cond: [
              { $gt: ["$totalAnswers", 0] },
              { $multiply: [{ $divide: ["$correctAnswers", "$totalAnswers"] }, 100] },
              0,
            ],
          },
        },
      },
    ]);
    const quizStatistics = await Result.aggregate([
      {
        $match: { quizId: mongoose.Types.ObjectId(quizId) },
      },
      {
        $group: {
          _id: null, // No grouping by field, calculate stats for the whole quiz
          highestMark: { $max: "$totalMarksGot" },
          averageScore: { $avg: "$totalMarksGot" },
        },
      },
    ]);

    // Total participants in the quiz
    const totalParticipants = await Result.countDocuments({ quizId });

    return res.status(200).json({
      result: rankData,
      totalParticipants,
      questionStatistics, // Include question statistics
      quizStatistics,
    });
  } catch (error) {
    console.error("Error fetching quiz result:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const quizResultLeaderBoard = async (req, res) => {
  try {
    const quizId = req.query?.quizId;
    const page = parseInt(req.query.page, 10) || 1; // Default page is 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
    const skip = (page - 1) * limit;

    // Get the total count of results for the given quiz
    const totalResults = await Result.countDocuments({ quizId: mongoose.Types.ObjectId(quizId) });

    const results = await Result.aggregate([
      // Match results for the specified quiz
      {
        $match: { quizId: mongoose.Types.ObjectId(quizId) },
      },
      // Add a secondary field to sort by createdAt (convert createdAt to a timestamp for sorting)
      {
        $addFields: {
          createdAtTimestamp: { $toLong: "$createdAt" },
        },
      },
      // Sort by totalMarksGot (descending) and createdAt (ascending)
      {
        $sort: { totalMarksGot: -1, createdAtTimestamp: 1 },
      },
      // Add rank field using totalMarksGot and the timestamp-based sort
      {
        $setWindowFields: {
          sortBy: { totalMarksGot: -1 }, // Top-level field for ranking
          output: {
            rank: {
              $rank: {},
            },
          },
        },
      },
      // Pagination: Skip and Limit
      { $skip: skip },
      { $limit: limit },
      // Lookup user details for the userId field
      {
        $lookup: {
          from: "users", // Collection name for the User model
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      // Optionally unwind the user details if only a single user is expected
      {
        $unwind: "$userDetails",
      },
      {
        $lookup: {
          from: "quizzes", // Collection name for the User model
          localField: "quizId",
          foreignField: "_id",
          as: "quiz",
        },
      },
      // Optionally unwind the user details if only a single user is expected
      {
        $unwind: "$quiz",
      },
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalResults / limit);

    return res.status(200).json({
      result: results,
      currentPage: page,
      count: totalResults,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching quiz's leaderboard ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};









