'use client'
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string>('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function sendLink() {
    setStatus('');
    if (!email) { setStatus('Enter your email'); return; }
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    if (error) setStatus(error.message);
    else setStatus('Check your email for the sign-in link.');
  }

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <div className="vstack gap-6">
      <div className="card vstack">
        <h1 className="text-2xl font-semibold">Welcome to Swim Log</h1>
        {!session ? (
          <>
            <p className="text-slate-600">Enter your email, we’ll send you a sign-in link.</p>
            <input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <button className="btn" onClick={sendLink}>Send sign-in link</button>
            <div className="text-sm text-slate-600">{status}</div>
          </>
        ) : (
          <div className="hstack justify-between">
            <div className="text-slate-700">Signed in as <b>{session.user.email}</b></div>
            <div className="hstack">
              <Link className="btn" href="/dashboard">Go to Dashboard</Link>
              <button className="btn" onClick={signOut}>Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
