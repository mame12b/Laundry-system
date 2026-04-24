import { Router } from "express";
import { createCustomer, getCustomers, updateCustomer, toggleCustomerActive } from "../controllers/customer.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.get("/", protect, getCustomers);
router.post("/", protect, allowRoles("Collector","Manager"), createCustomer);
router.patch("/:id", protect, allowRoles("Manager"), updateCustomer);
router.patch("/:id/toggle", protect, allowRoles("Manager"), toggleCustomerActive);

export default router;