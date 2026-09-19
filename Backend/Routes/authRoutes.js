import express from "express";
import { register, login, getMe, updateProfile } from "../Controllers/authController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import rateLimit from "express-rate-limit";
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const router = express.Router();
router.post('/register', authLimiter, register); router.post('/login', authLimiter, login); router.get('/me', authMiddleware, getMe); router.patch('/profile', authMiddleware, updateProfile);
export default router;


