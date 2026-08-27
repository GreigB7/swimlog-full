'use client'
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export default function AuthCallback() {
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    (async () => {
      const callbackUrl = new URL(window.location.href);
      const authError =
        callbackUrl.searchParams.get("error_description") ||
        callbackUrl.searchParams.get("error");

      if (authError) {
        window.location.replace(`/?auth_error=${encodeURIComponent(authError)}`);
        return;
      }

      if (callbackUrl.searchParams.has("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          window.location.replace(
            `/?auth_error=${encodeURIComponent(error.message)}`
          );
          return;
        }
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          window.location.replace("/dashboard");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      setMessage("We couldn't complete sign in. Please request a new link.");
      window.location.replace(
        "/?auth_error=We%20couldn't%20complete%20sign%20in.%20Please%20request%20a%20new%20link."
      );
    })();
  }, []);

  return <div className="p-6">{message}</div>;
}
