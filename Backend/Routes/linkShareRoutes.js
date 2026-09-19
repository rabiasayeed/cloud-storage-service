import express from "express";
import { createLinkShare, resolveLinkShare, deleteLinkShare } from "../Controllers/linkShareController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
const router = express.Router(); router.post('/', authMiddleware, createLinkShare); router.get('/resolve/:token', resolveLinkShare); router.delete('/:id', authMiddleware, deleteLinkShare); export default router;

