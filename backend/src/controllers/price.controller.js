import PriceItem from "../models/PriceItem.model.js";

export const createPriceItem = async (req, res) => {
  try {
    const { name, pricePerUnit, unit } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!pricePerUnit || pricePerUnit <= 0) return res.status(400).json({ message: "Valid price is required" });
    if (!unit?.trim()) return res.status(400).json({ message: "Unit is required" });
    const item = await PriceItem.create({ name: name.trim(), pricePerUnit, unit: unit.trim() });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPriceItems = async (req, res) => {
  try {
    const showAll = req.query.all === "1";
    const filter = showAll ? {} : { active: true };
    const items = await PriceItem.find(filter).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePriceItem = async (req, res) => {
  try {
    const item = await PriceItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deletePriceItem = async (req, res) => {
  try {
    const item = await PriceItem.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};