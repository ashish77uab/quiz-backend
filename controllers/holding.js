import mongoose from "mongoose";
import Holding from "../models/Holding.js";
import Wallet from "../models/Wallet.js";

export const getUserHoldings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId;
    const searchQuery = req.query.search || ""; // Search query from request
    const actionType = req.query.actionType || ''; // Status filter from request

    const skip = (page - 1) * limit;

    // Build dynamic match condition
    const matchCondition = {
      name: { $regex: searchQuery, $options: "i" }, // Search by transactionId
      userId: mongoose.Types.ObjectId(userId),
    };


    if (actionType) {
      matchCondition.actionType = actionType; // Add status condition only if provided
    }

    // Count total documents
    const totalHoldings = await Holding.countDocuments(matchCondition);

    // Fetch transactions with aggregation pipeline
    const allHoldings = await Holding.aggregate([
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
      holdings: allHoldings,
      currentPage: page,
      totalPages: Math.ceil(totalHoldings / limit),
      totalHoldings,
    });
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createHolding = async (req, res) => {
  try {
    const { quantity, startPrice, userId } = req.body
    let amount = quantity * startPrice;
    const wallet = await Wallet.findOne(
      { user: userId },
    );
    if (wallet?.amount < amount) {
      return res.status(400).json({ message: "Insufficient funds in wallet!" });
    }

    let quantityLeft = quantity;
    const holding = await Holding.create({ ...req.body, amount, quantityLeft: quantityLeft });
    await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          amount: -amount
        }
      },
    );
    if (!holding)
      return res.status(400).json({ message: "the holding  cannot be created!" });
    res.status(201).json(holding);
  } catch (error) {
    console.log(error, 'error creating holding')
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
export const sellHolding = async (req, res) => {
  try {
    const { quantity, endPrice = 0, userId, holdingId } = req.body
    const OldHolding = await Holding.findById(holdingId);
    let priceDiff = endPrice - OldHolding?.startPrice;
    let diffAmount = quantity * priceDiff;
    let quantityLeft = OldHolding?.quantityLeft - quantity;
    const newAmount = OldHolding?.amount + diffAmount
    const holding = await Holding.create({
      name: OldHolding?.name,
      quantity: OldHolding?.quantity,
      quantityLeft: quantityLeft,
      amount: newAmount,
      startPrice: OldHolding?.startPrice,
      endPrice: req?.body?.endPrice,
      diffAmount: diffAmount,
      actionType: req?.body?.actionType,
      userId: OldHolding?.userId,
      date: req.body.date,
      isSettled: quantityLeft === 0 ? true : false
    });

    if (!holding)
      return res.status(400).json({ message: "the holding  cannot be sell!" });
    res.status(201).json(holding);
  } catch (error) {
    console.log(error, 'error selling holding')
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
export const deleteHolding = async (req, res) => {
  try {
    const holdingId = req.params.id
    const holding = await Holding.findByIdAndDelete(
      holdingId
    );
    if (!holding)
      return res.status(400).json({ message: "the holding cannot be deleted!" })
    res.status(200).json(holding);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
export const updateHolding = async (req, res) => {
  try {
    const holdingId = req.params.id
    const isChecked = req.query.isChecked === 'true'
    const { quantity, endPrice } = req.body
    const oldholding = await Holding.findById(holdingId);
    let priceDiff = endPrice - oldholding?.startPrice;
    let diffAmount = quantity * priceDiff;
    const holding = await Holding.findByIdAndUpdate(
      holdingId,
      {
        ...req.body,
        diffAmount: isChecked ? req.body.diffAmount : diffAmount,
      },
      { new: true }
    );
    if (!holding)
      return res.status(400).json({ message: "the holding cannot be updated!" })
    res.status(200).json(holding);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Internal server error" });
  }
};

