import express from "express";
const router = express.Router();
import {
  getUserStocks,
  createStock,
  updateStock,
  deleteStock,
  sellStock,
  makeSettle
} from "../controllers/stock.js";
import { authenticateJWT } from "../middleware/auth.js";



router.get("/user-stocks", authenticateJWT, getUserStocks);
router.post("/create-stock", authenticateJWT, createStock);
router.post("/sell-stock", authenticateJWT, sellStock);
router.post("/settle-stock/:id", authenticateJWT, makeSettle);
router.put("/update-stock/:id", authenticateJWT, updateStock);
router.delete("/delete-stock/:id", authenticateJWT, deleteStock);



export default router;
