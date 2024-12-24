import Quiz from "../models/Quiz.js";

export const getQuizList = async (req, res) => {
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
    res.status(200).json(quiz);
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

