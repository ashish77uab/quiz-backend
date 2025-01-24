import express from "express";
const router = express.Router();
import {
  signup,
  signin,
  getUser,
  resetPasswordRequestController,
  resetPasswordController,
  getUsers,
  getAllAdmin,
  getUserById,
  changePasswordController,
  contactUsController,
  paymentStatus
} from "../controllers/users.js";
import { authenticateJWT } from "../middleware/auth.js";

router.post("/register", signup);
router.post("/login", signin);
router.post("/requestResetPassword", resetPasswordRequestController);
router.post("/resetPassword", resetPasswordController);
router.post("/update-password", authenticateJWT, changePasswordController);
router.get("/profile", authenticateJWT, getUser);
router.get("/all-users", authenticateJWT, getUsers);
router.get("/single-user", authenticateJWT, getUserById);
router.get("/all-admin", authenticateJWT, getAllAdmin);
router.post("/contact-us", contactUsController);
router.post("/phonepe/status", paymentStatus);


export default router;
