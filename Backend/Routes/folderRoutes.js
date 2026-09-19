import express from "express";
import { createFolder, getFolders, renameFolder, moveFolder, deleteFolder, getTrashFolders, restoreFolder } from "../Controllers/folderController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
const router = express.Router(); router.use(authMiddleware);
router.post('/', createFolder); router.get('/', getFolders); router.get('/trash', getTrashFolders); router.patch('/:id', renameFolder); router.patch('/:id/move', moveFolder); router.patch('/:id/restore', restoreFolder); router.delete('/:id', deleteFolder);
export default router;

