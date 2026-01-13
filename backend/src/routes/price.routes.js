import { Router } from "express";
import { createPriceItem, getPriceItems } from "../controllers/price.controller.js";   
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.post('/', protect, allowRoles('Manager'), createPriceItem);
router.get('/', protect, getPriceItems);

export default router;