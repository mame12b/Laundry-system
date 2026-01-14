import Order from "../models/Order.model.js";
import Payment  from "../models/Payment.model.js";

export const getMonthlyReport = async (req, res) => {
    try {
        const { month } = req.query;
        if(!month) return res.status(400).json({message: "Month is required" });

        const [year, m] = month.split("-");
        const start = new Date(Date.UTC(year, m - 1, 1));
        const end = new Date(Date.UTC(year, m, 1));

        const orders = await Order.find ({createAt: {$gte: start, $lt: end} });
        const payments = await Payment.find({createdAt: {$gte: start, $lt: end} });

        const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
        const collected = payments.reduce((s, p) => s + p.amount, 0);

        res.json({
            month,
            orders: orders.length,
            revenue,
            collected,
            outstanding: revenue  -  collected,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message});
        
    }
};