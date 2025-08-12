import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Swim Log",
  description: "Swim team logging app (Supabase + Next.js)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="font-semibold">Swim Log</Link>
            <div className="text-sm text-slate-600">Next.js + Supabase</div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
