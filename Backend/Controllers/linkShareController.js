import supabase from "../config/Supabase.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "drive";

// Create public share link

export const createLinkShare = async (req, res) => {
    try {
        const resourceType = req.body.resourceType ?? req.body.resource_type; const resourceId = req.body.resourceId ?? req.body.resource_id; const expiresAt = req.body.expiresAt ?? req.body.expires_at; const { password } = req.body;

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

        // Currently verify ownership for files
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
                        code: "RESOURCE_NOT_FOUND",
                        message: "File not found"
                    }
                });
            }
        }

        if (resourceType === "folder") {
            const { data: folder, error: folderError } = await supabase.from("folders").select("id").eq("id", resourceId).eq("owner_id", req.user.id).eq("is_deleted", false).single();
            if (folderError || !folder) return res.status(404).json({ error: { code: "RESOURCE_NOT_FOUND", message: "Folder not found" } });
        }
        // Generate secure random token
        const token = crypto.randomBytes(32).toString("hex");

        // Hash password if provided
        let passwordHash = null;

        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        const { data, error } = await supabase
            .from("link_shares")
            .insert([
                {
                    resource_type: resourceType,
                    resource_id: resourceId,
                    token,
                    role: "viewer",
                    password_hash: passwordHash,
                    expires_at: expiresAt || null,
                    created_by: req.user.id
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: {
                    code: "LINK_CREATE_FAILED",
                    message: error.message
                }
            });
        }

        res.status(201).json({
            message: "Public link created successfully",
            linkShare: {
                id: data.id,
                resourceType: data.resource_type,
                resourceId: data.resource_id,
                token: data.token,
                role: data.role,
                expiresAt: data.expires_at,
                hasPassword: !!data.password_hash
            }
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


// Resolve public share link

export const resolveLinkShare = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.query;

        // Find public link
        const { data: linkShare, error: linkError } = await supabase
            .from("link_shares")
            .select("*")
            .eq("token", token)
            .single();

        if (linkError || !linkShare) {
            return res.status(404).json({
                error: {
                    code: "LINK_NOT_FOUND",
                    message: "Public link not found"
                }
            });
        }

        // Check expiry
        if (
            linkShare.expires_at &&
            new Date(linkShare.expires_at) <= new Date()
        ) {
            return res.status(410).json({
                error: {
                    code: "LINK_EXPIRED",
                    message: "Public link has expired"
                }
            });
        }

        // Check password
        if (linkShare.password_hash) {
            if (!password) {
                return res.status(401).json({
                    error: {
                        code: "PASSWORD_REQUIRED",
                        message: "Password is required"
                    }
                });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                linkShare.password_hash
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    error: {
                        code: "INVALID_PASSWORD",
                        message: "Invalid password"
                    }
                });
            }
        }

        // File public link
        if (linkShare.resource_type === "file") {
            const { data: file, error: fileError } = await supabase
                .from("files")
                .select("*")
                .eq("id", linkShare.resource_id)
                .eq("is_deleted", false)
                .single();

            if (fileError || !file) {
                return res.status(404).json({
                    error: {
                        code: "RESOURCE_NOT_FOUND",
                        message: "File not found"
                    }
                });
            }


            // Generate signed URL

            const { data: signedUrlData, error: signedUrlError } =
                await supabase.storage
                    .from(BUCKET)
                    .createSignedUrl(file.storage_key, 60);

                  
            if (signedUrlError || !signedUrlData) {
                 return res.status(500).json({
                    error: {
                        code: "SIGNED_URL_FAILED",
                        message:
                            signedUrlError?.message ||
                            "Failed to generate signed URL"
                

               
                    }
                });
            }

            return res.status(200).json({
                message: "Public link resolved successfully",
                resourceType: "file",
                resourceId: file.id,
                file: {
                    id: file.id,
                    name: file.name,
                    mime_type: file.mime_type,
                    size_bytes: file.size_bytes
                },
                url: signedUrlData.signedUrl,
                expiresIn: 60
            });
        }

        // Folder public link
        return res.status(200).json({
            message: "Public link resolved successfully",
            resourceType: linkShare.resource_type,
            resourceId: linkShare.resource_id
        });

    } catch (error) {
        console.error("RESOLVE LINK ERROR:", error);

        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message
            }
        });
    }
};

// Delete/revoke public link
export const deleteLinkShare = async (req, res) => {
    try {
        const { id } = req.params;

        // First find the link owned by current user
        const { data: linkShare, error: findError } = await supabase
            .from("link_shares")
            .select("*")
            .eq("id", id)
            .eq("created_by", req.user.id)
            .single();

        if (findError || !linkShare) {
            return res.status(404).json({
                error: {
                    code: "LINK_NOT_FOUND",
                    message: "Public link not found"
                }
            });
        }

        const { data, error } = await supabase
            .from("link_shares")
            .delete()
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: {
                    code: "LINK_DELETE_FAILED",
                    message: error.message
                }
            });
        }

        res.status(200).json({
            message: "Public link revoked successfully",
            linkShare: data
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

