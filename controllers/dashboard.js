import Transaction from "../models/Transaction.js"
import User from "../models/User.js";


export const getAllDashboardData = async (req, res) => {
  try {
    // Get the total number of users
    const totalUsers = await User.countDocuments();

    // Count total transactions
    const totalTransactions = await Transaction.countDocuments();

    const pendingTransactions = await Transaction.countDocuments({ status: "Pending" });
    // Aggregate transaction data
    const transactionStats = await Transaction.aggregate([
      {
        $match: {
          status: "Accepted", // Filter for accepted transactions
        },
      },
      {
        $group: {
          _id: "$actionType", // Group by actionType (e.g., 'Deposit', 'Withdrawal')
          totalAmount: { $sum: "$amount" }, // Sum the 'amount' field
          highestAmount: { $max: "$amount" }, // Get the highest transaction amount
        },
      },
    ]);

    // Extract deposit and withdrawal statistics
    const depositStat = transactionStats.find(stat => stat._id === "Deposit");
    const withdrawalStat = transactionStats.find(stat => stat._id === "Withdraw");

    const totalDepositAmount = depositStat ? depositStat.totalAmount : 0;
    const highestDepositAmount = depositStat ? depositStat.highestAmount : 0;

    const totalWithdrawalAmount = withdrawalStat ? withdrawalStat.totalAmount : 0;
    const highestWithdrawalAmount = withdrawalStat ? withdrawalStat.highestAmount : 0;

    // Send response with all data
    res.status(200).json({
      totalUsers,
      totalTransactions,
      totalDepositAmount,
      highestDepositAmount,
      totalWithdrawalAmount,
      highestWithdrawalAmount,
      pendingTransactions
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





