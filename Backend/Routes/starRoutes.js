import express from "express";

import {
    starResource,
    unstarResource
} from "../Controllers/starController.js";

import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, starResource);

router.delete("/", authMiddleware, unstarResource);

export default router;
