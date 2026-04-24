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
  getOrderById,
  getHotelOrders,
  updateOrderStatus,
  addPayment,
  assignOrder,
} from "../controllers/order.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = express.Router();

// Remove this duplicate route that's causing the error
// router.get("/", authHeader, (req, res) => {
//   res.json({orders: []});
// }); 

// Keep only this route for getting orders
router.get("/", protect, allowRoles("Manager","Cashier","Collector","Washer","Sorter","Ironer","Driver"), getOrders);
router.get("/hotel", protect, allowRoles("Hotel"), getHotelOrders);
router.get("/:id", protect, allowRoles("Manager","Cashier","Collector","Washer","Sorter","Ironer","Driver"), getOrderById);
router.post("/", protect, allowRoles("Collector","Manager"), createOrder);
router.patch("/:id/assign", protect, allowRoles("Manager"), assignOrder);
router.patch("/:id/status", protect, allowRoles("Manager","Collector","Washer","Sorter","Ironer","Driver"), updateOrderStatus);
router.post("/:id/payment", protect, allowRoles("Cashier","Manager"), addPayment);

export default router;
