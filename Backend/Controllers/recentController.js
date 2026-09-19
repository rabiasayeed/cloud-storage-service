import supabase from "../config/Supabase.js";

export const getRecentFiles = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("files")
            .select("*")
            .eq("owner_id", req.user.id)
            .eq("is_deleted", false)
            .order("updated_at", { ascending: false })
            .limit(20);

        if (error) {
            return res.status(500).json({
                error: {
                    code: "RECENT_FETCH_FAILED",
                    message: error.message
                }
            });
        }

        res.status(200).json({
            message: "Recent files fetched successfully",
            files: data || []
        });

    } catch (error) {
        res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message
            }
        });
    }
};
