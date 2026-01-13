import PriceItem from "../models/PriceItem.model.js";

export const createPriceItem = async (req, res) => {
  try {
    const item = await PriceItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error("Create Price Item Error:", error.message);
    res.status(500).json({ message: "Server error" + error.message });
  }
};

export const getPriceItems = async (req, res) => {
  try {
    const items = await PriceItem.find({ active: true });
    res.json(items);
  } catch (error) {
    console.error("Get Price Items Error:", error.message);
    res.status(500).json({ message: "Server error" + error.message });
  }
};