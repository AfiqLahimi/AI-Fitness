"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction, signupAction, type ActionState } from "@/lib/server/actions";
import { Button } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(mode === "login" ? loginAction : signupAction, undefined);
  return (
    <form action={action} className="card space-y-4 p-6 md:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-dim">{mode === "login" ? "Pick up where you left off." : "Two minutes to a plan built around you."}</p>
      </div>
      {mode === "signup" && <Field name="name" label="Name" autoComplete="given-name" />}
      <Field name="email" type="email" label="Email" autoComplete="email" />
      <Field name="password" type="password" label="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} hint={mode === "signup" ? "At least 8 characters." : undefined} />
      {state?.error && <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-dim">
        {mode === "login" ? <>New to Pulse? <Link className="text-lime hover:underline" href="/signup">Create an account</Link></> : <>Already have an account? <Link className="text-lime hover:underline" href="/login">Sign in</Link></>}
      </p>
    </form>
  );
}

function Field({ label, hint, ...p }: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input required {...p} className="h-12 w-full rounded-xl border border-line bg-ink px-4 text-fg outline-none transition placeholder:text-mute focus:border-lime/60" />
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}
