import express from "express";

import { getActivity } from "../Controllers/activityController.js";

import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get(
    "/:resourceType/:resourceId",
    authMiddleware,
    getActivity
);

export default router;
