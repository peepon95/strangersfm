import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · 100 Strangers" },
      {
        name: "description",
        content: "Private sign in for adding new handwritten notes to the jar.",
      },
      { property: "og:title", content: "Sign in · 100 Strangers" },
      { property: "og:description", content: "Private sign in for the notes uploader." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    const { data, error } = await fn;
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) navigate({ to: "/admin" });
    else setMessage("Check your email to confirm the account, then sign in.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMessage("Google sign in failed, try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/admin" });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-4xl">hi.</h1>
      <p className="mt-3 text-muted-foreground">
        This is the private door, it is how new notes get into the jar.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your email"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper disabled:opacity-60"
        >
          {mode === "in" ? "Sign in" : "Create the account"}
        </button>
      </form>

      <button
        type="button"
        onClick={google}
        className="mt-3 rounded-full border border-border px-7 py-3 text-sm transition-colors hover:bg-accent"
      >
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-6 text-sm underline decoration-border underline-offset-4 text-muted-foreground"
      >
        {mode === "in" ? "First time here, create an account" : "I already have an account"}
      </button>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </main>
  );
}
