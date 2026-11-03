import type { Metadata } from "next";
import Link from "next/link";

import { DealDetailView } from "@/components/ops/deal-detail-view";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { dealTheoVai } from "@/lib/deals";
import { PROTO } from "@/lib/deals-proto";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Một căn" };

// BẢN MẪU design-pass: dữ liệu mẫu; S3 thay bằng getDeal và vai thật.
export default async function DealPage({ params, searchParams }: { params: Promise<{ offerId: string }>; searchParams: Promise<{ vai?: string; noi?: string }> }) {
  const { offerId } = await params;
  const { vai, noi } = await searchParams;
  const d = PROTO.find((x) => x.offerId === offerId);
  if (!d) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Không tìm thấy căn này</EmptyTitle>
          <EmptyDescription>Căn có thể đã rời danh sách vì giá đổi hoặc tin quá 45 ngày.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link prefetch={false} href="/ops/deals" />}>Về Căn giá tốt</Button>
        </EmptyContent>
      </Empty>
    );
  }
  const xem = vai !== "viewer";
  const mayThu = noi !== "cloud";
  const loc = dealTheoVai(d, { lienHe: xem, noiDung: xem && mayThu });
  return <DealDetailView d={{ ...d, ...loc, images: xem && mayThu ? d.images : [], postTextFull: xem && mayThu ? d.postTextFull : null, ...(xem ? {} : { block: null, floor: null, unit: null, street: null, streetNumber: null }) }} xemNoiDung={xem} mayThu={mayThu} />;
}
