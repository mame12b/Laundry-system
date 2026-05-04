import User from "../models/User.model.js";

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;
    if (!name || !phone || !role || !password)
      return res.status(400).json({ message: "Missing required fields" });
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ message: "Phone already registered" });
    const user = await User.create({ name, phone, role, password });
    res.status(201).json({ _id: user._id, name: user.name, role: user.role, phone: user.phone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.active = !user.active;
    await user.save();
    res.json({ _id: user._id, active: user.active });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaff = async (_req, res) => {
  try {
    const staff = await User.find({
      active: true,
      role: { $nin: ["Hotel", "Manager"] },
    }).select("_id name role phone").sort({ name: 1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
