'use client'
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      window.location.replace('/dashboard');
    })();
  }, []);
  return <div className="p-6">Signing you in…</div>;
}
