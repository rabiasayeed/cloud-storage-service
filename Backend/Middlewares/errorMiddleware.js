import multer from "multer";
export const errorMiddleware = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError || error.code?.startsWith?.("LIMIT_")) return res.status(413).json({ error: { code: error.code || "UPLOAD_LIMIT", message: "Upload is too large or contains too many files" } });
  const status = Number(error.status) >= 400 ? Number(error.status) : 500;
  res.status(status).json({ error: { code: status === 500 ? "SERVER_ERROR" : "REQUEST_ERROR", message: process.env.NODE_ENV === "production" && status === 500 ? "Internal server error" : error.message } });
};
