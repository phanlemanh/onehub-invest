import { PortalShell } from "@/components/shell/portal-shell";
import { getSessionUser } from "@/lib/auth";
import { getSearchIndex } from "@/lib/queries";

/**
 * Invest Portal — trang marketing (trang chủ, phương pháp). Tạm dùng cùng top
 * bar với trang app nhưng không đóng khung; P5 đổi sang @reui/navbar-12.
 */
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const [user, searchEntries] = await Promise.all([getSessionUser(), getSearchIndex()]);
  return (
    <PortalShell portal="invest" user={user} searchEntries={searchEntries} framed={false}>
      {children}
    </PortalShell>
  );
}
