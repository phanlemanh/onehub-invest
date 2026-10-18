export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { login, register } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; mode?: string }>;
}) {
  const { error, next = "/", mode } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next);

  const isRegister = mode === "register";
  const Form = isRegister ? register : login;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <div className="text-xs uppercase tracking-wide text-neutral-500">One Invest</div>
      <h1 className="text-2xl font-bold text-neutral-900">
        {isRegister ? "Create account" : "Sign in"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {isRegister
          ? "Password ≥ 8 ký tự. Plan khởi đầu là Free."
          : "Saved markets và Pro features cần đăng nhập."}
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form action={Form} className="mt-6 space-y-3">
        <input type="hidden" name="next" value={next} />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="email"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          name="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="password"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-neutral-500">
        <Link
          href={
            isRegister
              ? `/login?next=${encodeURIComponent(next)}`
              : `/login?mode=register&next=${encodeURIComponent(next)}`
          }
          className="text-blue-700 hover:underline"
        >
          {isRegister ? "← Đã có tài khoản" : "Tạo tài khoản mới →"}
        </Link>
      </div>
    </main>
  );
}
