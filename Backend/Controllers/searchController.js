import supabase from "../config/Supabase.js";
const encode = (created_at, id) => Buffer.from(JSON.stringify({ created_at, id })).toString("base64url");
const decode = value => { try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); } catch { return null; } };
export const searchFiles = async (req, res) => {
  try {
    const { q = "", type, starred, limit: rawLimit = 30, cursor } = req.query;
    const limit = Math.min(Math.max(Number(rawLimit) || 30, 1), 100);
    const { data: shares } = await supabase.from("shares").select("resource_id").eq("resource_type", "file").eq("grantee_user_id", req.user.id);
    const ids = [...new Set([...(shares || []).map(row => row.resource_id)])];
    let query = supabase.from("files").select("*").eq("is_deleted", false).or(`owner_id.eq.${req.user.id}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`);
    if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
    if (type) query = query.ilike("mime_type", `${type}%`);
    if (starred === "true") { const { data: stars } = await supabase.from("stars").select("resource_id").eq("user_id", req.user.id).eq("resource_type", "file"); const starIds = (stars || []).map(x => x.resource_id); if (!starIds.length) return res.json({ results: [], pagination: { limit, nextCursor: null, hasMore: false } }); query = query.in("id", starIds); }
    const decoded = cursor && decode(cursor); if (cursor && (!decoded?.created_at || !decoded?.id)) return res.status(400).json({ error: { code: "INVALID_CURSOR", message: "Invalid pagination cursor" } });
    if (decoded) query = query.or(`created_at.lt.${decoded.created_at},and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`);
    const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1); if (error) throw error;
    const rows = data || [], results = rows.slice(0, limit), hasMore = rows.length > limit;
    res.json({ results, pagination: { limit, hasMore, nextCursor: hasMore && results.length ? encode(results.at(-1).created_at, results.at(-1).id) : null } });
  } catch (error) { res.status(500).json({ error: { code: "SEARCH_FAILED", message: error.message } }); }
};
