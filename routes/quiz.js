import express from "express";
const router = express.Router();
import {
  getQuizList,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  quizAttemptedResult,
  getQuizInfo,
  quizSingleResult,
  quizResultLeaderBoard,
  getQuizListForUser
} from "../controllers/quiz.js";
import { authenticateJWT } from "../middleware/auth.js";



router.get("/list", authenticateJWT, getQuizList);
router.get("/list-user", authenticateJWT, getQuizListForUser);
router.get("/single-quiz/:id", authenticateJWT, getQuizInfo);
router.post("/create-quiz", authenticateJWT, createQuiz);
router.put("/update-quiz/:id", authenticateJWT, updateQuiz);
router.delete("/delete-quiz/:id", authenticateJWT, deleteQuiz);
router.post("/submit-quiz", authenticateJWT, submitQuiz);
router.get("/attempted-result", authenticateJWT, quizAttemptedResult);
router.get("/single-result", authenticateJWT, quizSingleResult);
router.get("/single-result-leaderboard", authenticateJWT, quizResultLeaderBoard);



export default router;
