import express from "express";
import { createShare, getShares, deleteShare, getSharedWithMe } from "../Controllers/shareController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
const router=express.Router(); router.use(authMiddleware); router.post('/',createShare); router.get('/with-me',getSharedWithMe); router.get('/:resourceType/:resourceId',getShares); router.delete('/:shareId',deleteShare); export default router;
