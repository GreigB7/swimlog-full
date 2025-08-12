'use client'
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      window.location.replace('/dashboard');
    })();
  }, []);
  return <div className="p-6">Signing you in…</div>;
}
