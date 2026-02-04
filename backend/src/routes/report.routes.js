import express from "express";
import { getReportsSummary } from "../controllers/report.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = express.Router();

router.get("/summary",  protect,  allowRoles("Manager"),  getReportsSummary);

export default router;
