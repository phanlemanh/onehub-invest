import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OpsShell } from "@/components/shell/ops-shell/ops-shell";
import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Vận hành", template: "%s · Vận hành · One Invest" },
  robots: { index: false, follow: false },
};

/**
 * Ops Portal. proxy.ts chặn sớm khi thiếu cookie; đây là kiểm tra thật
 * (session còn hạn + quyền). Shell riêng của Ops chuyển thể @reui/app-shell-36
 * (thanh bên nhóm); Invest giữ khung app-shell-30.
 */
export default async function OpsLayout({ children }: LayoutProps<"/ops">) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/ops");
  if (!canAccessOps(user)) notFound();
  return (
    <OpsShell user={{ email: user.email, role: user.role }}>{children}</OpsShell>
  );
}
