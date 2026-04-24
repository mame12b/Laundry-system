import Customer from "../models/Customer.model.js";

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, type, address } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Customer name is required" });
    if (phone?.trim()) {
      const exists = await Customer.findOne({ phone: phone.trim() });
      if (exists) return res.status(400).json({ message: "Customer phone already exists" });
    }
    const customer = await Customer.create({
      name: name.trim(),
      phone: phone?.trim() || null,
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
    const showAll = req.query.all === "1";
    const filter = showAll ? {} : { active: true };
    const list = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const toggleCustomerActive = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    customer.active = !customer.active;
    await customer.save();
    res.json(customer);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};