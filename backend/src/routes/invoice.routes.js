import express  from "express";
import { generateInvoice,  downloadInvoicePdf } from "../controllers/invoice.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/generate", protect, generateInvoice);
router.get("/:id/pdf", protect, downloadInvoicePdf);

export default router;