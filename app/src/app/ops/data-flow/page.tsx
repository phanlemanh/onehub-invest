import { Suspense } from "react";
import type { Metadata } from "next";

import { DataFlowContent } from "@/components/ops/data-flow/data-flow-content";
import { DataFlowSkeleton } from "@/components/ops/data-flow/data-flow-skeleton";
import { RegionError } from "@/components/states/region-error";
import { getSessionUser } from "@/lib/auth";
import { parseFlowWindow } from "@/lib/data-flow-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dòng chảy dữ liệu" };

/**
 * /ops/data-flow «Dòng chảy dữ liệu» (proto 26/10): đường ống bài → tin → căn, chất lượng từng chặng, tin mới nhất.
 * Trang đọc phiên rồi trao cho DataFlowContent (nhánh máy chủ, che nội dung tin theo vai).
 */
export default async function DataFlowPage({ searchParams }: PageProps<"/ops/data-flow">) {
  const window = parseFlowWindow((await searchParams).window);
  const user = await getSessionUser();
  return (
    <RegionError what="dòng chảy dữ liệu">
      <Suspense key={window} fallback={<DataFlowSkeleton />}>
        <DataFlowContent window={window} user={user} />
      </Suspense>
    </RegionError>
  );
}
