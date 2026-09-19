import express from "express";
import { register, login, getMe, updateProfile } from "../Controllers/authController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
const router = express.Router();
router.post('/register', register); router.post('/login', login); router.get('/me', authMiddleware, getMe); router.patch('/profile', authMiddleware, updateProfile);
export default router;

