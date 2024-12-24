import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";

export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || ""; // Search query from request
    const status = req.query.status; // Status filter from request
    const actionType = req.query.actionType; // Status filter from request

    const skip = (page - 1) * limit;

    // Build dynamic match condition
    const matchCondition = {
      // transactionId: { $regex: searchQuery, $options: "i" }, 
    };

    if (status) {
      matchCondition.status = status; // Add status condition only if provided
    }
    if (actionType) {
      matchCondition.actionType = actionType; // Add status condition only if provided
    }

    // Count total documents
    const totalTransactions = await Transaction.countDocuments(matchCondition);

    // Fetch transactions with aggregation pipeline
    const allTransactions = await Transaction.aggregate([
      {
        $match: matchCondition, // Use dynamic match condition
      },
      {
        $lookup: {
          from: "users", // Collection to join (Team)
          localField: "userId", // Field from Match schema
          foreignField: "_id", // Field from Team schema
          as: "user" // Alias for the output (home team details)
        }
      },
      {
        $unwind: "$user" // Unwind the array to get a single user object
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          actionType: 1,
          screenShot: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          "user.email": 1,
          "user.fullName": 1,
          "user._id": 1,
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
    ]);

    res.status(200).json({
      transactions: allTransactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { transactionId, status, userId, amount } = req.body
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: status,
      },
      { new: true }
    );
    if (!transaction)
      return res.status(400).json({ message: "the transaction status cannot be updated!" });
    let amountToDeduct = amount
    if ((transaction.actionType === 'Deposit' && status === 'Accepted') || (transaction.actionType === 'Withdraw' && status === 'Rejected')) {
      await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: {
            amount: Number(amount)
          }
        },
      );
    }


    res.status(201).json(transaction);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
export const updateTransactionAmount = async (req, res) => {
  try {
    const { oldAmount, newAmount } = req.body
    const transactionId = req.params.id
    const userId = req.params.userId
    const newAmountToAdd = Number(oldAmount) - Number(newAmount)
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        amount: newAmount
      },
      { new: true }
    );
    await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          amount: newAmountToAdd
        }
      },
    );
    if (!transaction)
      return res.status(400).json({ message: "the transaction status cannot be updated!" });
    res.status(201).json(transaction);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};

