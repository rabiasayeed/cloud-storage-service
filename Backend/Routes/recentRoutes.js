import express from "express";

import { getRecentFiles } from "../Controllers/recentController.js";

import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRecentFiles);

export default router;
