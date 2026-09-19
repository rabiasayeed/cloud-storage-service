import express from "express";

import { searchFiles } from "../Controllers/searchController.js";

import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, searchFiles);

export default router;
