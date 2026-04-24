import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserActive,
  getStaff,
} from "../controllers/userManagement.controller.js";
import { protect, allowRoles } from "../middlewares/auth.js";

const router = express.Router();

router.get("/staff", protect, allowRoles("Manager"), getStaff);
router.get("/", protect, allowRoles("Manager"), getUsers);
router.post("/", protect, allowRoles("Manager"), createUser);
router.patch("/:id/toggle", protect, allowRoles("Manager"), toggleUserActive);
router.patch("/:id", protect, allowRoles("Manager"), updateUser);

export default router;
