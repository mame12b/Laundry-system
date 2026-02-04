import Customer from "../models/Customer.model.js";

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, type, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    // optional: avoid duplicates by phone (only if phone provided)
    if (phone?.trim()) {
      const exists = await Customer.findOne({ phone: phone.trim() });
      if (exists) {
        return res.status(400).json({ message: "Customer phone already exists" });
      }
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone?.trim() || "",
      type: type || "Individual",
      address: address?.trim() || "",
    });

    res.status(201).json(customer);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const list = await Customer.find({ active: true }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

