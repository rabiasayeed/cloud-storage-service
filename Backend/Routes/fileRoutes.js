import express from "express";
import rateLimit from "express-rate-limit";
import { uploadFile, getFiles, renameFile, moveFile, copyFile, deleteFile, getTrash, restoreFile, downloadFile, permanentlyDeleteFile, getVersions, revertVersion } from "../Controllers/fileController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import upload from "../Middlewares/uploadMiddleware.js";
const router = express.Router();
const uploadLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
router.post('/upload', uploadLimiter, authMiddleware, upload.single('file'), uploadFile);
router.get('/', authMiddleware, getFiles); router.get('/trash', authMiddleware, getTrash);
router.get('/:id/download', authMiddleware, downloadFile); router.get('/:id/versions', authMiddleware, getVersions); router.post('/:id/versions/:versionId/revert', authMiddleware, revertVersion); router.patch('/:id', authMiddleware, renameFile);
router.patch('/:id/move', authMiddleware, moveFile); router.post('/:id/copy', authMiddleware, copyFile); router.patch('/:id/restore', authMiddleware, restoreFile);
router.delete('/:id', authMiddleware, deleteFile); router.delete('/:id/permanent', authMiddleware, permanentlyDeleteFile);
export default router;



