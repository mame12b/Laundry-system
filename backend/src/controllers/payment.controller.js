import Payment from "../models/Payment.model.js";

export const getPaymentsByOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const payments = await Payment.find({order: orderId})
        .sort({ createdAt: -1})
        .populate("receivedBy", "name role");

        res.json(payments);
    } catch (error) {
        console.error("getPaymentsByOrder error:", error);
        res.status(500).json({ message: "server error", error: error.message });
    }
};