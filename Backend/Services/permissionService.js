import supabase from "../config/Supabase.js";
const tableFor = (type) => type === "file" ? "files" : "folders";
export const getResource = (type, id) => supabase.from(tableFor(type)).select("*").eq("id", id).single();
export const getPermission = async (type, id, userId) => {
  const { data: resource } = await getResource(type, id);
  if (!resource || resource.is_deleted) return null;
  if (resource.owner_id === userId) return "owner";
  const { data: direct } = await supabase.from("shares").select("role").eq("resource_type", type).eq("resource_id", id).eq("grantee_user_id", userId).maybeSingle();
  if (direct?.role) return direct.role;
  if (type === "file" && resource.folder_id) {
    let parentId = resource.folder_id;
    for (let depth = 0; parentId && depth < 25; depth += 1) {
      const { data: parent } = await supabase.from("folders").select("id,parent_id,is_deleted").eq("id", parentId).maybeSingle();
      if (!parent || parent.is_deleted) break;
      const { data: share } = await supabase.from("shares").select("role").eq("resource_type", "folder").eq("resource_id", parent.id).eq("grantee_user_id", userId).maybeSingle();
      if (share?.role) return share.role;
      parentId = parent.parent_id;
    }
  }
  return null;
};
export const canAccess = async (type, id, userId, needed = "viewer") => { const permission = await getPermission(type, id, userId); return permission === "owner" || permission === "editor" || (permission === "viewer" && needed === "viewer"); };
