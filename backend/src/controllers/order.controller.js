import Order from "../models/Order.model.js";
import User from "../models/User.model.js";
import { isValidTransition, ROLE_NEXT_STATUS } from "../utils/orderFlow.js";
import Payment from "../models/Payment.model.js";

export const createOrder = async (req, res) => {
  try {
    const payload = {
      customer: req.body.customer,
      collectedBy: req.user?.role === "Collector" ? req.user._id : req.body.collectedBy,
      items: req.body.items.map(i => ({
        item: i.item,
        qty: Number(i.qty),
        price: Number(i.price ?? i.pricePerUnit),
      }))
    };
    const order = await Order.create(payload);
    res.status(201).json(order);
  } catch (error) {
    console.error("Order error:", error.message);
    res.status(400).json({ message: "Server error", error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const q = {};
    if (req.query.mine === "1") q.collectedBy = req.user._id;
    if (req.query.status) q.status = req.query.status;
    if (req.query.customer) q.customer = req.query.customer;

    const orders = await Order.find(q)
      .sort({ createdAt: -1 })
      .populate("customer", "name type phone")
      .populate("collectedBy", "name phone role")
      .populate("items.item", "name pricePerUnit unit");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name type phone address")
      .populate("collectedBy", "name phone role")
      .populate("items.item", "name pricePerUnit unit");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getHotelOrders = async (req, res) => {
  try {
    if (!req.user.customer) {
      return res.status(400).json({ message: "Hotel user has no linked customer" });
    }
    const orders = await Order.find({ customer: req.user.customer })
      .populate("items.item", "name pricePerUnit unit");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const role = req.user?.role;

    if (!status) return res.status(400).json({ message: "Status is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (role !== "Manager") {
      const allowedNext = ROLE_NEXT_STATUS[role];
      if (!allowedNext) return res.status(403).json({ message: "Role not allowed to update status" });
      if (status !== allowedNext) {
        return res.status(403).json({ message: `${role} can only move order to ${allowedNext}` });
      }
    }

    if (!isValidTransition(order.status, status)) {
      return res.status(400).json({ message: `Invalid transition from ${order.status} to ${status}` });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const assignOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const staff = await User.findById(userId);
    if (!staff) return res.status(404).json({ message: "Staff user not found" });

    order.assignedTo = userId;
    order.assignedRole = staff.role;
    order.assignedBy = req.user._id;
    order.assignedAt = new Date();
    await order.save();

    res.json({ message: "Order assigned", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.customer) return res.status(400).json({ message: "This order has no customer linked." });

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const payment = await Payment.create({
      order: order._id,
      customer: order.customer,
      amount,
      receivedBy: req.user._id,
    });

    order.paidAmount = Number(order.paidAmount || 0) + amount;
    await order.save();

    return res.json({ message: "Payment added", order, payment });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};