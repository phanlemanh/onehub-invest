import Link from "next/link";
import { logout, setPlan } from "@/app/actions";
import type { User } from "@/lib/auth";

/** Thanh auth góc phải: email + plan switcher (demo) + logout, hoặc link Sign in. */
export function AuthBar({
  user,
  redirectTo,
}: {
  user: User | null;
  redirectTo: string;
}) {
  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(redirectTo)}`}
        className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
      >
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {/* Demo plan switcher — thay billing thật; mirror hai tier free/pro */}
      <div className="flex overflow-hidden rounded-full border border-neutral-300 text-xs font-medium">
        {(["free", "pro"] as const).map((p) => (
          <form key={p} action={setPlan}>
            <input type="hidden" name="plan" value={p} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className={`px-2.5 py-1.5 uppercase tracking-wide transition-colors ${
                user.plan === p
                  ? "bg-blue-700 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {p}
            </button>
          </form>
        ))}
      </div>
      <span className="hidden text-xs text-neutral-500 sm:inline">{user.email}</span>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
