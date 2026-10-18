export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSavedAreas, getSessionUser } from "@/lib/auth";
import { toggleSaved } from "@/app/actions";
import { AuthBar } from "@/components/auth-bar";

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=%2Fsaved");

  const areas = await getSavedAreas(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">One Invest</div>
          <h1 className="text-2xl font-bold text-neutral-900">Saved markets</h1>
          <div className="text-sm text-neutral-500">{areas.length} đã lưu · {user.email}</div>
        </div>
        <AuthBar user={user} redirectTo="/saved" />
      </div>

      {areas.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          Chưa lưu market nào. Mở một trang insight và bấm <span className="font-medium">☆ Save</span>.
          <div className="mt-2">
            <Link href="/th/bangkok" className="text-blue-700 hover:underline">
              Bangkok →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {areas.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={a.href} className="text-sm font-medium text-blue-700 hover:underline">
                  {a.name}
                </Link>
                <div className="text-xs text-neutral-500">
                  {a.regionType} · saved {a.savedAt}
                </div>
              </div>
              <form action={toggleSaved}>
                <input type="hidden" name="areaId" value={a.id} />
                <input type="hidden" name="redirectTo" value="/saved" />
                <button
                  type="submit"
                  className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
