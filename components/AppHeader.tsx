'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Role = 'coach' | 'swimmer' | '';

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setEmail(session.user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', session.user.id)
        .maybeSingle();

      setUsername(data?.username || '');
      const r = (data?.role || '').toLowerCase();
      if (r === 'coach' || r === 'swimmer') setRole(r as Role);
    })();
  }, []);

  // Typed routes so <Link> is happy with typedRoutes enabled
  const links: { href: Route; label: string; show: boolean }[] = [
    // swimmer
    { href: '/' as Route,                       label: 'Start',        show: true },
    { href: '/dashboard/swimmer' as Route,      label: 'Zwemmer',      show: role === 'swimmer' },
    { href: '/dashboard/swimmer/plan' as Route, label: 'Techniekplan', show: role === 'swimmer' },

    // coach
    { href: '/dashboard/coach' as Route,        label: 'Coach',        show: role === 'coach' },
    { href: '/dashboard/coach/plan' as Route,   label: 'Plan bewerken',show: role === 'coach' },
  ];

  function isActive(href: Route) {
    return pathname === href || pathname?.startsWith(href + '/');
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href={'/' as Route} className="font-semibold tracking-tight">Zwem Logboek</Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {links.filter(l => l.show).map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 ${isActive(l.href) ? 'bg-white/10' : ''}`}
            >
              {l.label}
            </Link>
          ))}

          {email ? (
            <div className="ml-3 flex items-center gap-2">
              <span className="text-xs text-slate-300">
                Ingelogd als <strong>{username || email}</strong>
              </span>
              <button onClick={signOut} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
                Afmelden
              </button>
            </div>
          ) : (
            <Link href={'/' as Route} className="ml-3 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
              Inloggen
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 hover:bg-white/10"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-2 space-y-1">
            {links.filter(l => l.show).map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm hover:bg-white/10 ${isActive(l.href) ? 'bg-white/10' : ''}`}
              >
                {l.label}
              </Link>
            ))}

            <div className="px-3 py-2 text-xs text-slate-300">
              {email ? <>Ingelogd als <strong>{username || email}</strong></> : 'Niet ingelogd'}
            </div>

            {email ? (
              <button
                onClick={signOut}
                className="mx-3 mb-2 w-[calc(100%-1.5rem)] px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
              >
                Afmelden
              </button>
            ) : (
              <Link
                href={'/' as Route}
                onClick={() => setOpen(false)}
                className="mx-3 mb-2 block px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-center"
              >
                Inloggen
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
