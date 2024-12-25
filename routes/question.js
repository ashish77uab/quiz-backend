import express from "express";
const router = express.Router();
import {
  getQuizQuestionList,
  createQuizQuestion,
  updateQuizQuestion,
} from "../controllers/question.js";
import { authenticateJWT } from "../middleware/auth.js";



router.get("/list", authenticateJWT, getQuizQuestionList);
router.post("/create-question", authenticateJWT, createQuizQuestion);
router.put("/update-question", authenticateJWT, updateQuizQuestion);




export default router;
