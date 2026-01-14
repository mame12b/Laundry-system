import express from "express";
import { addPayment } from "../controllers/order.controller.js";
import { protect, allowRoles  } from "../middlewares/auth.js";

const router = express.Router();

router.post("/:id", protect, allowRoles("Cashier", "Manager"),  addPayment);

export default router;