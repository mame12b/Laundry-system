import express from "express";
import { getMonthlyReport } from "../controllers/report.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = express.Router();

router.get("/monthly",  protect,  allowRoles("Manager"),  getMonthlyReport);

export default router;
