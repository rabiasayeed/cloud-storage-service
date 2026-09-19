import supabase from "../config/Supabase.js";



const encodeCursor = (createdAt, id) => {
    return Buffer.from(
        JSON.stringify({
            createdAt,
            id
        })
    ).toString("base64");
};

const decodeCursor = (cursor) => {
    try {
        return JSON.parse(
            Buffer.from(cursor, "base64").toString("utf8")
        );
    } catch {
        return null;
    }
};

export const searchFiles = async (req, res) => {
    try {
        const {
            q,
            type,
            owner,
            starred,
            limit: limitParam,
            cursor
        } = req.query;

        const limit = Math.min(
            Math.max(parseInt(limitParam, 10) || 20, 1),
            100
        );

        let query = supabase
            .from("files")
            .select("*")
            .eq("is_deleted", false);

        // Current user's own files
        query = query.eq("owner_id", req.user.id);

        // Optional owner filter
        if (owner) {
            query = query.eq("owner_id", owner);
        }

        // Search by name
        if (q) {
            query = query.ilike("name", `%${q}%`);
        }

        // Filter by MIME type
        if (type) {
            query = query.ilike("mime_type", `${type}%`);
        }

        // Starred filter
        if (starred === "true") {
            const { data: stars, error: starError } = await supabase
                .from("stars")
                .select("resource_id")
                .eq("user_id", req.user.id)
                .eq("resource_type", "file");

            if (starError) {
                return res.status(500).json({
                    error: {
                        code: "STAR_SEARCH_FAILED",
                        message: starError.message
                    }
                });
            }

            const starredIds = (stars || []).map(
                (star) => star.resource_id
            );

            if (starredIds.length === 0) {
                return res.status(200).json({
                    message: "Search completed successfully",
                    results: [],
                    pagination: {
                        limit,
                        nextCursor: null,
                        hasMore: false
                    }
                });
            }

            query = query.in("id", starredIds);
        }

        // Cursor pagination
        if (cursor) {
            const decodedCursor = decodeCursor(cursor);

            if (!decodedCursor?.createdAt || !decodedCursor?.id) {
                return res.status(400).json({
                    error: {
                        code: "INVALID_CURSOR",
                        message: "Invalid pagination cursor"
                    }
                });
            }

            query = query.or(
                `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`
            );
        }

        // Fetch one extra row to determine whether another page exists
        const { data, error } = await query
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(limit + 1);

        if (error) {
            return res.status(500).json({
                error: {
                    code: "SEARCH_FAILED",
                    message: error.message
                }
            });
        }

        const rows = data || [];
        const hasMore = rows.length > limit;
        const results = hasMore
            ? rows.slice(0, limit)
            : rows;

        let nextCursor = null;

        if (hasMore && results.length > 0) {
            const lastItem = results[results.length - 1];

            nextCursor = encodeCursor(
                lastItem.created_at,
                lastItem.id
            );
        }

        return res.status(200).json({
            message: "Search completed successfully",
            results,
            pagination: {
                limit,
                nextCursor,
                hasMore
            }
        });

    } catch (error) {
        console.error("SEARCH ERROR:", error);

        return res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message
            }
        });
    }
};
