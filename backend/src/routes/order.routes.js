import { Router} from "express";
import { createOrder, getOrders, updateOrderStatus, addPayment, getHotelOrders } from "../controllers/order.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.post("/", protect, allowRoles("Collector"),  createOrder);
router.get("/", protect, getOrders);
router.patch("/:id/status", protect,  allowRoles("Washer", "Ironer", "Manager"), updateOrderStatus);
router.patch("/:id/payment", protect, allowRoles("Casheir", "Manager") ,addPayment);
router.get("/hotel", protect, allowRoles("Hotel"), getHotelOrders);


export default router;