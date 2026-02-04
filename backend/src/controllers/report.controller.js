import Order from "../models/Order.model.js";
import Payment from "../models/Payment.model.js";

export const getReportsSummary = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const orderMatch = {};
    const paymentMatch = {};

    // Optional date filter
    if (from || to) {
      orderMatch.createdAt = {};
      paymentMatch.createdAt = {};

      if (from) {
        orderMatch.createdAt.$gte = from;
        paymentMatch.createdAt.$gte = from;
      }

      if (to) {
        orderMatch.createdAt.$lte = to;
        paymentMatch.createdAt.$lte = to;
      }
    }

    // 1) Totals
    const [totalOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments(orderMatch),
      Order.countDocuments({ ...orderMatch, status: "DELIVERED" }),
    ]);

    // 2) Outstanding = sum(max(totalAmount - paidAmount, 0))
    const outstandingAgg = await Order.aggregate([
      { $match: orderMatch },
      {
        $project: {
          due: {
            $max: [{ $subtract: ["$totalAmount", "$paidAmount"] }, 0],
          },
        },
      },
      { $group: { _id: null, outstanding: { $sum: "$due" } } },
    ]);

    const outstanding = outstandingAgg?.[0]?.outstanding || 0;

    // 3) Revenue from payments (sum of Payment.amount)
    const revenueAgg = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, revenue: { $sum: "$amount" } } },
    ]);

    const revenue = revenueAgg?.[0]?.revenue || 0;

    // 4) Orders by status
    const byStatus = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // 5) Revenue by day (default last 7 days if no from/to provided)
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(now.getDate() - 6);

    const revenueFrom = from || defaultFrom;
    const revenueTo = to || now;

    const revenueByDay = await Payment.aggregate([
      { $match: { createdAt: { $gte: revenueFrom, $lte: revenueTo } } },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    ]);

    return res.json({
      totals: {
        totalOrders,
        deliveredOrders,
        revenue,
        outstanding,
      },
      byStatus,
      revenueByDay,
    });
  } catch (error) {
    console.error("getReportsSummary error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
