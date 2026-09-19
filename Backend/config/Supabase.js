import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(
    process.env.SUPABASE_URL,
    serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        },
        global: {
            headers: {
                Authorization: 'Bearer ' + serviceRoleKey
            }
        }
    }
);

export default supabase;
