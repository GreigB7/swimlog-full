'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();
const resendCooldownSeconds = 60;

type AuthMessageError = {
  message: string;
  status?: number;
  code?: string;
};

function getAuthMessage(error: AuthMessageError) {
  const message = error.message.toLowerCase();

  if (error.status === 429 || message.includes('rate limit')) {
    return 'Er zijn te veel inloglinks aangevraagd. Wacht even en probeer het daarna opnieuw.';
  }

  if (error.message === 'User not found') {
    return 'Dit e-mailadres is niet goedgekeurd voor toegang.';
  }

  return error.message;
}

export default function Page() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const [loggedInEmail, setLoggedInEmail] = useState<string>('')
  const [role, setRole] = useState<string>('') // 'swimmer' | 'coach' (optioneel)

  // Check huidige sessie
  useEffect(() => {
    ;(async () => {
      const authError = new URLSearchParams(window.location.search).get('auth_error')
      if (authError) {
        setMsg(authError)
        window.history.replaceState(null, '', window.location.pathname)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setLoggedInEmail(session.user.email || '')
        // Haal rol op (als je 'profiles' tabel gebruikt met kolom 'role')
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        if (data?.role) setRole(String(data.role))
      } else {
        setLoggedInEmail('')
        setRole('')
      }
    })()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = window.setInterval(() => {
      setCooldown(value => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false, // <-- alleen vooraf toegevoegde users mogen inloggen
        },
      })
      if (error) {
        setMsg(getAuthMessage(error))
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          setCooldown(resendCooldownSeconds)
        }
      } else {
        setMsg('Controleer je e-mail voor de inloglink.')
        setCooldown(resendCooldownSeconds)
      }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setLoggedInEmail('')
    setRole('')
    setMsg('Je bent uitgelogd.')
  }

  return (
    <main className="p-6 max-w-3xl mx-auto vstack gap-6">
      <div className="card">
        <h1 className="text-xl font-semibold">Zwem Logboek</h1>
        <p className="text-sm text-slate-600">
          Log trainingssessies, rusthartslag en lichaamsmaten. Coaches kunnen de voortgang per zwemmer bekijken.
        </p>
      </div>

      {loggedInEmail ? (
        <div className="card vstack gap-3">
          <div className="text-sm">
            Ingelogd als <strong>{loggedInEmail}</strong>
            {role ? <> &middot; Rol: <strong>{role}</strong></> : null}
          </div>
          <div className="hstack gap-3">
            <Link href="/dashboard" className="btn">Ga naar dashboard</Link>
            <button className="btn bg-slate-600 hover:bg-slate-700" onClick={signOut}>Uitloggen</button>
          </div>
          {msg && <div className="text-sm text-slate-600">{msg}</div>}
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="card vstack gap-3 max-w-md">
          <h2 className="text-lg font-semibold">Inloggen</h2>
          <label className="label">E-mailadres</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jij@voorbeeld.nl"
          />
          <button className="btn" type="submit" disabled={loading || cooldown > 0}>
            {loading
              ? 'Versturen…'
              : cooldown > 0
                ? `Probeer opnieuw over ${cooldown}s`
                : 'Stuur inloglink'}
          </button>
          <div className="text-xs text-slate-500">
            Alleen vooraf toegevoegde gebruikers kunnen inloggen.
          </div>
          {msg && <div className="text-sm text-slate-600">{msg}</div>}
        </form>
      )}
    </main>
  )
}
