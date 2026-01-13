import Order from "../models/Order.model.js";
import { isValidTransition } from "../utils/orderFlow.js";

export const createOrder = async (req, res) => {
  try {
    const payload = {
     customer: req.body.customer,
      collectedBy: req.body.collectedBy,
      items: req.body.items.map(i => ({
        item: i.item,
        qty: Number(i.qty ?? i.unit),
        price: Number(i.price ?? i.pricePerUnit),
      
      }))
    };

    console.log("Normalized order:", JSON.stringify(payload, null, 2));

    const order = await Order.create(payload);
    res.status(201).json(order);
  } catch (error) {
    console.error("Order error:", error.message);
    res.status(400).json({ message: "Server error", error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('customer', "name type")
    .populate('collectedBy', 'name phone role');
    res.json(orders);
    } catch (error) {   
    res.status(500).json({ message: "Server error", error: error.message });    
  }
};
 
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!isValidTransition(order.status, status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paidAmount += Number(req.body.amount);
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};