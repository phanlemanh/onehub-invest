export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SavedBody } from "@/components/saved/saved-body";
import { getSavedAreas, getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Đã lưu" };

/**
 * Khu vực đã lưu (IA §3.2) — wishlist-2 chuyển thể, số liệu cùng nguồn Finder. Đăng nhập và danh sách
 * lưu đọc trước (redirect giữ mã 307, không loading.tsx); thân trang ở SavedBody.
 */
export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/saved");
  return <SavedBody saved={await getSavedAreas(user.id)} email={user.email} />;
}
