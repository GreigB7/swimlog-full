'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const role = (data?.role || 'swimmer') as string;
      router.replace(role === 'coach' ? '/dashboard/coach' : '/dashboard/swimmer');
    })();
  }, [router]);

  return <div className="p-4">Bezig met laden…</div>;
}
