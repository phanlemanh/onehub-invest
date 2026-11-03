import { NextResponse } from "next/server";

import { getOfferPhone } from "@/lib/offers-public";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/listings/<id>/contact — số của đúng một tin đang hiện công khai (nút «Xem số»). Tin không hiện, không tồn
 * tại hay chưa có số đều trả cùng một 404: không ai dò được tin ẩn qua đây. `inferred`: số chưa xác minh. Không lưu đệm.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getOfferPhone(id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ phone: found.phone, inferred: found.inferred }, { headers: { "Cache-Control": "no-store" } });
}
