import { Router } from "express";
import { generateInvoice, downloadInvoicePdf, getInvoices } from "../controllers/invoice.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = Router();

router.get("/", protect, allowRoles("Manager","Cashier"), getInvoices);
router.post("/", protect, allowRoles("Manager","Cashier"), generateInvoice);
router.get("/:id/pdf", protect, downloadInvoicePdf);

export default router;