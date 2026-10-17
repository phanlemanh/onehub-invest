import Link from "next/link";
import { logout } from "@/app/actions";
import type { User } from "@/lib/auth";

/** Thanh auth góc phải: email + logout, hoặc link Sign in. */
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
