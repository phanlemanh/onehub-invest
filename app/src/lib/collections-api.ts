import { NextResponse } from "next/server";

import {
  cheDinhDanhThu,
  getFlowDays,
  getZaloAccountsFromFacts,
  getZaloGroups,
  readGateFunnel,
  readRotationPreview,
  readSchedulerStatus,
  readZaloAllowlist,
  readZaloHealth,
} from "@/lib/collections-queries";
import type { User } from "@/lib/auth";
import { kiemQuyen, xemDinhDanhThu } from "@/lib/ops-access";

/** Thân `GET /api/v1/ops/collections` (bề mặt máy của trang "Thu thập", ADR-0007 DCA). */
export async function docThuThap(days: number) {
  const [flow, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, zaloAccounts] = await Promise.all([
    getFlowDays(days),
    readGateFunnel(),
    readSchedulerStatus(),
    readRotationPreview(),
    getZaloGroups(),
    readZaloAllowlist(),
    readZaloHealth(),
    getZaloAccountsFromFacts(),
  ]);
  return { generatedAt: new Date().toISOString(), flow, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, zaloAccounts };
}

export type ThuThapPayload = Awaited<ReturnType<typeof docThuThap>>;

/**
 * Trả lời một lần gọi đã qua `kiemQuyen(req, "ops.read")` (route.ts): `?days=` (1…90, mặc định 7). Người gọi dưới vai
 * ops — Người xem và bearer chung (`nguoi: null`) — nhận bản đã che định danh tài khoản thu và mã nhóm (hồ sơ
 * dinh-danh-tai-khoan-thu-theo-vai, Hỏi-2 = A). `doc` tiêm được để ca thử chạy ngoài máy thu.
 */
export async function traThuThap(
  req: Request,
  nguoi: User | null,
  doc: (days: number) => Promise<Partial<ThuThapPayload>> = docThuThap,
): Promise<Response> {
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("days") ?? 7) || 7));
  const payload = await doc(days);
  return NextResponse.json(xemDinhDanhThu(nguoi) ? payload : cheDinhDanhThu(payload));
}

/** Cùng ba bước của route.ts (kiemQuyen → traThuThap) cho ca thử tiêm nguồn dữ liệu. */
export async function xuLyThuThap(req: Request, doc?: (days: number) => Promise<Partial<ThuThapPayload>>): Promise<Response> {
  const q = await kiemQuyen(req, "ops.read");
  if (!q.ok) return q.res;
  return traThuThap(req, q.nguoi, doc);
}
