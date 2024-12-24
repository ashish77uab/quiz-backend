import express from "express";
const router = express.Router();
import {
  getUserHoldings,
  createHolding,
  updateHolding,
  deleteHolding,
  sellHolding,
} from "../controllers/holding.js";
import { authenticateJWT } from "../middleware/auth.js";



router.get("/user-holdings", authenticateJWT, getUserHoldings);
router.post("/create-holding", authenticateJWT, createHolding);
router.post("/sell-holding", authenticateJWT, sellHolding);
router.put("/update-holding/:id", authenticateJWT, updateHolding);
router.delete("/delete-holding/:id", authenticateJWT, deleteHolding);



export default router;
