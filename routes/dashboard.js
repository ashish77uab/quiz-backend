import { getAllDashboardData } from "../controllers/dashboard.js";
import express from "express";
const router = express.Router();

router.get(`/all-data`, getAllDashboardData)

export default router;