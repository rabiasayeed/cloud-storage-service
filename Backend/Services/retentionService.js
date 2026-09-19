import supabase from "../config/Supabase.js";
import { logActivity } from "../utilis/activityLogger.js";
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "drive";
export const purgeExpiredTrash = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: files } = await supabase.from("files").select("id,storage_key,owner_id,name").eq("is_deleted", true).lt("deleted_at", cutoff);
  for (const file of files || []) { await supabase.storage.from(bucket).remove([file.storage_key]); await supabase.from("files").delete().eq("id", file.id); await logActivity({ actorId: file.owner_id, action: "delete", resourceType: "file", resourceId: file.id, context: { permanent: true, reason: "retention" } }); }
  const { data: folders } = await supabase.from("folders").select("id,owner_id").eq("is_deleted", true).lt("deleted_at", cutoff);
  for (const folder of folders || []) await supabase.from("folders").delete().eq("id", folder.id);
  return { files: files?.length || 0, folders: folders?.length || 0 };
};
