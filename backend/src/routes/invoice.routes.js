import express  from "express";
import { generateInvoice,  downloadInvoicePdf } from "../controllers/invoice.controller.js";
import { allowRoles, protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/generate", protect, generateInvoice);
router.get("/:id/pdf", protect, allowRoles("Manager", "Hotel"), downloadInvoicePdf);


export default router;