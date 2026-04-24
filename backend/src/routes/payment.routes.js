import express from "express";
import { addPayment } from "../controllers/order.controller.js";
import { getPaymentsByOrder } from "../controllers/payment.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = express.Router();

router.get("/:id/history", protect, allowRoles("Cashier","Manager"), getPaymentsByOrder);
router.post("/:id", protect, allowRoles("Cashier","Manager"), addPayment);

export default router;