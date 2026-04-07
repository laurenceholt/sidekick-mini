import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qwqsgfepygsfempjmquq.supabase.co";
const SUPABASE_KEY = "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
