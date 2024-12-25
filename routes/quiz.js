import express from "express";
const router = express.Router();
import {
  getQuizList,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  quizDashboard
} from "../controllers/quiz.js";
import { authenticateJWT } from "../middleware/auth.js";



router.get("/list", authenticateJWT, getQuizList);
router.post("/create-quiz", authenticateJWT, createQuiz);
router.put("/update-quiz/:id", authenticateJWT, updateQuiz);
router.delete("/delete-quiz/:id", authenticateJWT, deleteQuiz);
router.post("/submit-quiz", authenticateJWT, submitQuiz);
router.get("/dashboard", authenticateJWT, quizDashboard);



export default router;
