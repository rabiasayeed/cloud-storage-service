
import supabase from "../config/Supabase.js";

export const logActivity = async ({
    actorId,
    action,
    resourceType,
    resourceId,
    context = null
}) => {
    try {
        const { error } = await supabase
            .from("activities")
            .insert([
                {
                    actor_id: actorId,
                    action,
                    resource_type: resourceType,
                    resource_id: resourceId,
                    context
                }
            ]);

        if (error) {
            console.error("Activity log error:", error);
        }
    } catch (error) {
        console.error("Activity logger failed:", error);
    }
};
