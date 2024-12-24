import { getAllTransactions, updateTransaction, updateTransactionAmount } from "../controllers/transactions.js";
import express from "express";
const router = express.Router();

router.get(`/all-transactions`, getAllTransactions)
router.put('/update-status', updateTransaction)
router.put('/update-transaction/:id/:userId', updateTransactionAmount)
export default router;