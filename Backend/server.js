import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./Routes/authRoutes.js";
import folderRoutes from "./Routes/folderRoutes.js";
import fileRoutes from "./Routes/fileRoutes.js";
import shareRoutes from "./Routes/shareRoutes.js";
import linkShareRoutes from "./Routes/linkShareRoutes.js";
import searchRoutes from "./Routes/searchRoutes.js";
import starRoutes from "./Routes/starRoutes.js";
import recentRoutes from "./Routes/recentRoutes.js";
import activityRoutes from "./Routes/activityRoutes.js";

dotenv.config();
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map((v) => v.trim()) || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/', (_req, res) => res.json({ message: 'Cloud Storage Service API is running', version: '1.0.0' }));
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', rateLimit({ windowMs: 5 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/link-shares', linkShareRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stars', starRoutes);
app.use('/api/recent', recentRoutes);
app.use('/api/activity', activityRoutes);
app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
app.use((error, _req, res, _next) => { console.error(error); res.status(error.status || 500).json({ error: { code: 'SERVER_ERROR', message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message } }); });

if (process.env.NODE_ENV !== 'test') app.listen(process.env.PORT || 8080, () => console.log(`Server running on port ${process.env.PORT || 8080}`));
export default app;

