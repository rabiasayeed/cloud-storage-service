import supabase from "../config/Supabase.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                },
            });
        }

        const token = authHeader.split(" ")[1];

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid or expired token",
                },
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message,
            },
        });
    }
};
