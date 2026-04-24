import { Router } from "express";
import { createPriceItem, getPriceItems, updatePriceItem, deletePriceItem } from "../controllers/price.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.get("/", protect, getPriceItems);
router.post("/", protect, allowRoles("Manager"), createPriceItem);
router.patch("/:id", protect, allowRoles("Manager"), updatePriceItem);
router.delete("/:id", protect, allowRoles("Manager"), deletePriceItem);

export default router;