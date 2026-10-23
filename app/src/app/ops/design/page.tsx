import type { Metadata } from "next";

import { CatalogSamples } from "@/components/ops/design/catalog-samples";
import { PageHeader } from "@/components/page/page-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thư viện thiết kế" };

/** /ops/design — trang trưng bày danh mục UI dùng chung (onehub-ui/catalog.md). */
export default function DesignGalleryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Thư viện thiết kế" }]}
        title="Thư viện thiết kế"
        stats={["7 loại UI", "6 mẫu cổng Ops"]}
        description="Mỗi loại UI một cách làm — mẫu sống của từng thành phần."
      />
      <CatalogSamples />
    </div>
  );
}
