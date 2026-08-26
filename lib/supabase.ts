import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const fallbackUrl = "https://example.supabase.co";
const fallbackAnonKey = "missing-supabase-anon-key";

export type AppRole = "coach" | "swimmer";

export type CurrentProfile = {
  id: string;
  username: string | null;
  email: string | null;
  role: AppRole | string | null;
};

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    return { url, anonKey };
  }

  if (typeof window === "undefined") {
    return { url: fallbackUrl, anonKey: fallbackAnonKey };
  }

  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = getConfig();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

export async function getCurrentProfile() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { session: null, profile: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,email,role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    return { session, profile: null, error };
  }

  return { session, profile: (data ?? null) as CurrentProfile | null };
}

export function profileHasRole(profile: CurrentProfile | null, role: AppRole) {
  return (profile?.role || "").toLowerCase() === role;
}

