'use client'
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string>('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false, // <-- critical
      },
    });

    if (error) {
      setMsg(error.message === 'User not found'
        ? 'This email is not approved for access.'
        : error.message);
    } else {
      setMsg('Check your email for the login link.');
    }
  }

  return (
    <form onSubmit={sendLink} className="card vstack gap-3 max-w-md">
      <h2 className="text-lg font-semibold">Sign in</h2>
      <label className="label">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <button className="btn" type="submit">Send login link</button>
      {msg && <div className="text-sm text-slate-600">{msg}</div>}
    </form>
  );
}
