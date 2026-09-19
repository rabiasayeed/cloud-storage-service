import supabase from "../config/Supabase.js";

export const starResource = async (req, res) => {
    try {
        const { resourceType, resourceId } = req.body;

        if (!resourceType || !resourceId) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "resourceType and resourceId are required"
                }
            });
        }

        if (!["file", "folder"].includes(resourceType)) {
            return res.status(400).json({
                error: {
                    code: "INVALID_RESOURCE_TYPE",
                    message: "resourceType must be file or folder"
                }
            });
        }

        // Verify that the resource exists and belongs to the user
        if (resourceType === "file") {
            const { data: file, error: fileError } = await supabase
                .from("files")
                .select("id")
                .eq("id", resourceId)
                .eq("owner_id", req.user.id)
                .eq("is_deleted", false)
                .single();

            if (fileError || !file) {
                return res.status(404).json({
                    error: {
                        code: "FILE_NOT_FOUND",
                        message: "File not found"
                    }
                });
            }
        }

        if (resourceType === "folder") {
            const { data: folder, error: folderError } = await supabase
                .from("folders")
                .select("id")
                .eq("id", resourceId)
                .eq("owner_id", req.user.id)
                .eq("is_deleted", false)
                .single();

            if (folderError || !folder) {
                return res.status(404).json({
                    error: {
                        code: "FOLDER_NOT_FOUND",
                        message: "Folder not found"
                    }
                });
            }
        }

        // Check whether already starred
        const { data: existingStar } = await supabase
            .from("stars")
            .select("*")
            .eq("user_id", req.user.id)
            .eq("resource_type", resourceType)
            .eq("resource_id", resourceId)
            .maybeSingle();

        if (existingStar) {
            return res.status(200).json({
                message: "Resource is already starred",
                star: existingStar
            });
        }

        const { data, error } = await supabase
            .from("stars")
            .insert([
                {
                    user_id: req.user.id,
                    resource_type: resourceType,
                    resource_id: resourceId
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: {
                    code: "STAR_FAILED",
                    message: error.message
                }
            });
        }

        res.status(201).json({
            message: "Resource starred successfully",
            star: data
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


export const unstarResource = async (req, res) => {
    try {
        const { resourceType, resourceId } = req.body;

        if (!resourceType || !resourceId) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "resourceType and resourceId are required"
                }
            });
        }

        const { data, error } = await supabase
            .from("stars")
            .delete()
            .eq("user_id", req.user.id)
            .eq("resource_type", resourceType)
            .eq("resource_id", resourceId)
            .select()
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                error: {
                    code: "UNSTAR_FAILED",
                    message: error.message
                }
            });
        }

        if (!data) {
            return res.status(404).json({
                error: {
                    code: "STAR_NOT_FOUND",
                    message: "Resource is not starred"
                }
            });
        }

        res.status(200).json({
            message: "Resource unstarred successfully",
            star: data
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
