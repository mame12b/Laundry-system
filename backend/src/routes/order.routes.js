import { Router} from "express";
import { createOrder, getOrders, updateOrderStatus, addPayment } from "../controllers/order.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.post("/", protect, createOrder);
router.get("/", protect, getOrders);
router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/payment", protect, addPayment);

export default router;