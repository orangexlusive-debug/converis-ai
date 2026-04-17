import { LoginForm } from "@/app/login/login-form";
import { Suspense } from "react";

function LoginFallback() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black">
      <div
        className="size-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400"
        aria-hidden
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
