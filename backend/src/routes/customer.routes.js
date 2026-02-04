import { Router } from "express";
import { createCustomer, getCustomers } from "../controllers/customer.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.get("/", protect, getCustomers);

// ✅ Collector + Manager can create customers
router.post("/", protect, allowRoles("Collector", "Manager"), createCustomer);

export default router;
