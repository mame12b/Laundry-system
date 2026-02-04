// import { Router} from "express";
// import { createOrder, getOrders, updateOrderStatus, addPayment, getHotelOrders } from "../controllers/order.controller.js";
// import { protect, allowRoles } from "../middlewares/auth.js";

// const router = Router();

// router.post("/", protect, allowRoles("Collector"),  createOrder);
// router.get("/", protect, getOrders);
// router.patch("/:id/status", protect,  allowRoles("Washer", "Ironer", "Manager"), updateOrderStatus);
// router.patch("/:id/payment", protect, allowRoles("Casheir", "Manager") ,addPayment);
// router.get("/hotel", protect, allowRoles("Hotel"), getHotelOrders);


// export default router;

import express from "express";
import {
  createOrder,
  getOrders,
  getHotelOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = express.Router();

// Manager/Cashier/Staff can see orders
router.get("/", protect, allowRoles("Manager", "Cashier", "Collector", "Washer", "Ironer", "Driver"), getOrders);

// Hotel sees ONLY its orders
router.get("/hotel", protect, allowRoles("Hotel"), getHotelOrders);

// Create order: Collector + Manager
router.post("/", protect, allowRoles("Collector", "Manager"), createOrder);

// Update status: operational roles + manager
router.patch("/:id/status", protect, allowRoles("Manager", "Collector", "Washer", "Ironer", "Driver"), updateOrderStatus);

export default router;
