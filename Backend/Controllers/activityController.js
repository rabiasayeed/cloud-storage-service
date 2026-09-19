import supabase from "../config/Supabase.js";

export const getActivity = async (req, res) => {
    try {
        const { resourceType, resourceId } = req.params;

        if (!["file", "folder"].includes(resourceType)) {
            return res.status(400).json({
                error: {
                    code: "INVALID_RESOURCE_TYPE",
                    message: "resourceType must be file or folder"
                }
            });
        }

        const { data, error } = await supabase
            .from("activities")
            .select("*")
            .eq("resource_type", resourceType)
            .eq("resource_id", resourceId)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                error: {
                    code: "ACTIVITY_FETCH_FAILED",
                    message: error.message
                }
            });
        }

        res.status(200).json({
            message: "Activity fetched successfully",
            activities: data || []
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
