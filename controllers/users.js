import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import User from "../models/User.js";
import Token from "../models/Token.js";
import crypto from "crypto";
import { sendEmail, sendEmailAdminToUser, sendEmailToAdminForUserDetail } from "../SendEmail.js";
import mongoose from "mongoose";
import { uploadImageToCloudinary } from "../helpers/functions.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

export const signin = async (req, res) => {

  try {
    const { email, password } = req.body;
    const userData = await User.aggregate([
      {
        $match: { email: email }, // Find the user by email
      },
    ]);
    const oldUser = userData?.[0]
    if (!oldUser)
      return res.status(404).json({ message: "User doesn't exist" });

    const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign(
      { email: oldUser.email, id: oldUser._id, role: oldUser.role },
      process.env.JWTSECRET,
      {
        expiresIn: "10d",
      }
    );
    const tempUser = { ...oldUser }
    delete tempUser.password;
    delete tempUser.normalPassword;


    res.status(200).json({ result: tempUser, token });
  } catch (error) {
    console.log(error, 'error while login')
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const signup = async (req, res) => {

  try {
    const data = { ...req.body };
    const oldUser = await User.findOne({ email: data.email });
    if (oldUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    let fullName = `${data.firstName} ${data.lastName}`;
    delete data.firstName;
    delete data.lastName;
    const result = await User.create({
      ...data,
      password: hashedPassword,
      normalPassword: data.password,
      fullName: fullName,
    });
    const wallet = await Wallet.create({
      user: result?._id,
    });

    const updatedUser = await User.findByIdAndUpdate(
      result?._id,
      { wallet: wallet?._id },
      { new: true }
    ).select('-password -normalPassword'); // Excludes the password field

    const token = jwt.sign(
      { email: result.email, id: result._id, role: result.role },
      process.env.JWTSECRET,
      {
        expiresIn: "10d",
      }
    );
    res.status(201).json({ user: updatedUser, token });
  } catch (error) {
    console.log(error, 'error');
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const getUser = async (req, res) => {
  try {
    const user = req.user;
    const userData = await returnUserData(user?.id);
    const tempUser = { ...userData?.[0] }
    delete tempUser.password;
    delete tempUser.normalPassword;
    res.status(200).json(tempUser); // Send the first (and likely only) result back
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });

  }
};
export const getUserById = async (req, res) => {
  try {
    const userId = req.query?.userId;
    const userData = await returnUserData(userId);
    res.status(200).json(userData[0] || {}); // Send the first (and likely only) result back
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });

  }
};
export const returnUserData = async (userId) => {
  return await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "wallets", // Name of the collection you're joining
        localField: "_id",
        foreignField: "user",
        as: "wallet",
      },
    },
    {
      $unwind: "$wallet" // Unwind the array to have a single team object
    },
    {
      $project: {
        password: 0,
      },
    },
  ]);
}
export const getUsers = async (req, res) => {
  try {
    const userId = req?.user?.id
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || ""; // Search query from request
    const totalUsers = await User.countDocuments({
      role: "User",
      fullName: { $regex: searchQuery, $options: "i" }, // Search for fullName case-insensitively
    });
    const allUsers = await User.aggregate([
      // Match users with role "User"
      {
        $match: {
          role: "User",
          fullName: { $regex: searchQuery, $options: "i" },
        },
      },
      {
        $lookup: {
          from: "wallets", // Name of the collection you're joining
          localField: "wallet",
          foreignField: "_id",
          as: "wallet",
        },
      },
      {
        $unwind: {
          path: "$wallet", // Unwind the subCategory field
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip, // Skip the necessary number of documents for pagination
      },
      {
        $limit: limit, // Limit the results to the page size
      }

    ]);
    res.status(200).json({
      users: allUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getAllAdmin = async (req, res) => {
  try {
    const userId = req?.user?.id
    const allAdmin = await User.aggregate([
      {
        $match: {
          role: "Admin",
        },
      },
      {
        $lookup: {
          from: "messages", // Name of the Message collection
          let: { userId: "$_id" }, // Variable to use in pipeline
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sender", "$$userId"] },
                    { $eq: ["$recipient", mongoose.Types.ObjectId(userId)] }, // Match recipient to the user
                    { $eq: ["$read", false] }, // Only include unread messages
                  ],
                },
              },
            },
            {
              $sort: { createdAt: -1 }, // Sort the results by createdAt (most recent messages first)
            },
          ],
          as: "unreadMessages",
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" }, // Variable to use in pipeline (current user ID)
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$sender", mongoose.Types.ObjectId(userId)] }, // sender is userId
                            { $eq: ["$recipient", "$$userId"] } // recipient is current userId
                          ]
                        },
                        {
                          $and: [
                            { $eq: ["$sender", "$$userId"] }, // sender is current userId
                            { $eq: ["$recipient", mongoose.Types.ObjectId(userId)] } // recipient is userId
                          ]
                        }
                      ]
                    },
                    // { $eq: ["$read", true] } // Only include read messages
                  ]
                }
              }
            },
            {
              $sort: { createdAt: -1 } // Sort by createdAt (most recent first)
            },
            {
              $limit: 1 // Limit to 1 (get the latest read message)
            }
          ],
          as: "latestReadMessage"
        }
      },
      {
        $addFields: {
          unreadMessageCount: { $size: "$unreadMessages" }, // Add a field to store the number of unread messages
        },
      },
      {
        $sort: { unreadMessageCount: -1 }, // Sort by the number of unread messages (descending order)
      },


    ]);
    res.status(200).json(allAdmin);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
};


export const resetPasswordRequestController = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "Email does not exist" });

    let token = await Token.findOne({ userId: user._id });
    if (token) {
      await token.deleteOne();
    }

    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(process.env.BCRYPT_SALT));

    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${process.env.CLIENT_URL}/passwordReset?token=${resetToken}&id=${user._id}`;

    sendEmail(
      user.email,
      "Password Reset Request",
      {
        name: user.fullName,
        link: link,
      },
      "/views/template/requestResetPassword.ejs"
    );
    return res.status(200).json({ link });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const contactUsController = async (req, res) => {
  try {

    const { fullName, email, mobile, message } = req.body

    sendEmailAdminToUser(
      `This is Mail from Algotrons Team`,
      {
        fullName: fullName,
        email: email,
        mobile: mobile,
        message: message,
      },
      "/views/template/contactUsUser.ejs"
    );
    sendEmailToAdminForUserDetail(
      `Contact: ${fullName} is trying to contact you`,
      {
        fullName: fullName,
        email: email,
        mobile: mobile,
        message: message,
      },
      "/views/template/contactUsAdmin.ejs"
    );
    return res.status(200).json({ success: 'Sent Success' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { userId, token, password } = req.body;

    let passwordResetToken = await Token.findOne({ userId });

    if (!passwordResetToken) {
      return res
        .status(404)
        .json({ message: "Invalid or expired password reset token first one" });
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);

    if (!isValid) {
      return res
        .status(404)
        .json({ message: "Invalid or expired password reset token" });
    }

    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT));

    await User.updateOne(
      { _id: userId },
      { $set: { password: hash } },
      { new: true }
    );

    const user = await User.findById({ _id: userId });

    sendEmail(
      user.email,
      "Password Reset Successfully",
      {
        name: user.fullName,
      },
      "/views/template/resetPassword.ejs"
    );

    await passwordResetToken.deleteOne();

    return res.json({ message: "Password reset was successful" });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const changePasswordController = async (req, res) => {
  try {
    const { newPassword, oldPassword } = req.body;
    const userId = req.user?.id;

    let oldUser = await User.findById(userId);

    if (!oldUser) {
      return res
        .status(501)
        .json({ message: "Unauthorize" });
    }
    if (oldPassword !== oldUser.normalPassword) {
      return res
        .status(500)
        .json({ message: "Old Password not matched" });
    }
    const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT));

    await User.updateOne(
      { _id: userId },
      { $set: { password: hash, normalPassword: newPassword } },
      { new: true }
    );
    return res.status(200).json({ message: "Password changed was successful" });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const addDepositController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { screenShot } = req.files
    const screenShotUrl = await uploadImageToCloudinary(screenShot?.[0], res)
    console.log(req.body, 'req.body')
    let transaction = await Transaction.create({ amount: Number(req.body.amount), screenShot: screenShotUrl, userId: userId, actionType: 'Deposit', status: 'Pending' });
    return res.status(201).json(transaction);
  } catch (error) {
    console.log(error, 'while creating transaction error');
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const withdrawFundController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.find({ panNumber: req.body.panNumber })
    if (!user[0]) {
      return res.status(404).json({ message: "PAN Number not matched" });
    }

    const wallet = await Wallet.findById(user[0]?.wallet)
    if (Number(req.body.amount) === 0) {
      return res.status(403).json({ message: "Please add more than 0 Rs amount" });
    }
    if (Number(wallet?.amount) < Number(req.body.amount))
      return res.status(403).json({ message: "Insufficient funds" });
    let transaction = await Transaction.create({ ...req.body, userId: userId, actionType: 'Withdraw', status: 'Pending' });
    await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          amount: -Number(req.body?.amount)      // Increase the winnings
        }
      },
    );
    return res.status(201).json(transaction);
  } catch (error) {
    console.log(error, 'while creating transaction error');
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const updateWalletAmount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const amount = req.body.amount;
    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: userId },
      {
        amount: amount
      },
    );
    return res.status(200).json(updatedWallet);
  } catch (error) {
    console.log(error, 'while creating transaction error');
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getUserTransactionsController = async (req, res) => {
  try {
    const { limit = 10, page = 1, actionType = 'Deposit', userId } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    // Aggregation pipeline
    const transactions = await Transaction.aggregate([
      // Match transactions based on userId and actionType
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          actionType: actionType,
        },
      },
      // Sort transactions by creation date (most recent first)
      {
        $sort: { createdAt: -1 },
      },
      // Pagination: Skip and limit
      {
        $skip: (pageNumber - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ]);

    // Get total count of matching transactions for pagination metadata
    const totalTransactions = await Transaction.countDocuments({
      userId: userId,
      actionType: actionType,
    });

    return res.status(200).json({
      transactions,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalTransactions / pageSize),
      totalTransactions,
    });
  } catch (error) {
    console.error(error, 'while fetching transactions');
    return res.status(500).json({ message: 'Internal server error' });
  }
};

