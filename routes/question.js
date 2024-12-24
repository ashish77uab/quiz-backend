import express from "express";
const router = express.Router();
import {
  getQuizQuestionList,
  createQuizQuestion,
  updateQuizQuestion,
  submitQuizQuestion,
} from "../controllers/question.js";
import { authenticateJWT } from "../middleware/auth.js";



router.get("/list", authenticateJWT, getQuizQuestionList);
router.post("/create-question", authenticateJWT, createQuizQuestion);
router.put("/update-question", authenticateJWT, updateQuizQuestion);
router.post("/submit-question", authenticateJWT, submitQuizQuestion);



export default router;
