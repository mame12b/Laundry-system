import { Router } from "express";
import { createCustomer, getCustomers } from "../controllers/customer.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.post("/", protect, allowRoles('Manager') , createCustomer);
router.get("/", protect, getCustomers);

export default router;