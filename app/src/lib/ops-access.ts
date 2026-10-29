import type { User, Vai } from "./auth";

/**
 * Luật quyền Ops ở MỘT chỗ (TV1 `quyen-bon-vai-mot-cho`, docs/research/ops-tu-van-hanh-nguon-saas.md §3.5) — ĐÓNG MẶC ĐỊNH.
 * Bốn vai xếp bậc viewer < ops < admin < owner; `user` không vào Ops. Email trong OPS_EMAILS (danh sách cách nhau dấu
 * phẩy) tính như vai `ops` (Hỏi-1) — cửa phụ theo env không bao giờ cho quyền quản trị.
 */
export const BAC_VAI: Record<Vai, number> = { user: 0, viewer: 1, ops: 2, admin: 3, owner: 4 };

export type HanhDong =
  | "ops.read"
  | "audit.read"
  | "ingest.push"
  | "review.decide"
  | "unit.toggle"
  | "unit.create"
  | "unit.delete"
  | "unit.set_mode"
  | "unit.update_meta"
  | "zalo.admin";

/**
 * Bảng quyền: hành động → vai tối thiểu, và bearer chung (`OPS_API_TOKEN`) có được dùng không. Bearer chỉ đọc số và nạp
 * số; mọi thao tác ghi khác cần một người thật. Ghi thẳng ở máy thu là quản trị → admin (portals.md); quyền «gửi lệnh» của
 * vai ops đi đường lệnh kéo (TV4), không qua bảng này (Hỏi-2).
 */
export const QUYEN_OPS: Record<HanhDong, { vai: Exclude<Vai, "user">; bearer: boolean }> = {
  "ops.read": { vai: "viewer", bearer: true },
  "audit.read": { vai: "admin", bearer: false },
  "ingest.push": { vai: "ops", bearer: true },
  "review.decide": { vai: "ops", bearer: false },
  "unit.toggle": { vai: "admin", bearer: false },
  "unit.create": { vai: "admin", bearer: false },
  "unit.delete": { vai: "admin", bearer: false },
  "unit.set_mode": { vai: "admin", bearer: false },
  "unit.update_meta": { vai: "admin", bearer: false },
  "zalo.admin": { vai: "admin", bearer: false },
};

/** Actor của máy dùng bearer chung (chỉ ingest ghi audit bằng nó). */
export const ACTOR_BEARER = "machine:cloud-sync";

function trongOpsEmails(user: User): boolean {
  const allow = (process.env.OPS_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(user.email.toLowerCase());
}

/** Vai có hiệu lực: role trong DB, nâng tối đa lên `ops` khi email nằm trong OPS_EMAILS. */
export function vaiHieuLuc(user: User | null): Vai {
  if (!user) return "user";
  if (BAC_VAI[user.role] < BAC_VAI.ops && trongOpsEmails(user)) return "ops";
  return user.role;
}

/** Quyền vào Ops Portal (portals.md luật 3): từ vai viewer trở lên. */
export function canAccessOps(user: User | null): boolean {
  return BAC_VAI[vaiHieuLuc(user)] >= BAC_VAI.viewer;
}

/** Clearance law (ADR-0007 + portals.md): trang quản trị /ops — admin trở lên. */
export function isAdmin(user: User | null): boolean {
  return BAC_VAI[vaiHieuLuc(user)] >= BAC_VAI.admin;
}

/**
 * Nội dung tin (thẻ duyệt review_queue, bài gốc) — AGENTS.md luật 6: cho vai ops trở lên. Vai viewer vào được Ops nhưng
 * chỉ nhận số và mã S0x; mọi chỗ đưa nội dung tin xuống trình duyệt hỏi hàm này.
 */
export function xemNoiDungTin(user: User | null | undefined): boolean {
  return BAC_VAI[vaiHieuLuc(user ?? null)] >= BAC_VAI.ops;
}

/**
 * Định danh tài khoản thu (mã tài khoản, hồ sơ, tài khoản giữ nhóm) và mã nhóm Zalo ở bề mặt Thu thập — AGENTS.md luật 6
 * (tầng A); hồ sơ dinh-danh-tai-khoan-thu-theo-vai Hỏi-2 = A: vai ops trở lên. Bearer chung (`nguoi: null`) không thấy.
 */
export function xemDinhDanhThu(user: User | null | undefined): boolean {
  return BAC_VAI[vaiHieuLuc(user ?? null)] >= BAC_VAI.ops;
}

function bearerKhop(req: Request): boolean {
  const token = process.env.OPS_API_TOKEN;
  return !!token && req.headers.get("authorization") === `Bearer ${token}`;
}

/**
 * Cổng của mọi route /api/v1/ops/**. Bearer chung khớp ở hành động cho bearer → qua với actor máy. Còn lại đọc phiên từ
 * chính request: không ai → 401; bearer ở hành động cấm bearer hoặc vai dưới bảng → 403; qua → actor `user:<id>`.
 */
export async function kiemQuyen(
  req: Request,
  hd: HanhDong,
): Promise<{ ok: true; nguoi: User | null; actor: string } | { ok: false; res: Response }> {
  const luat = QUYEN_OPS[hd];
  if (luat.bearer && bearerKhop(req)) return { ok: true, nguoi: null, actor: ACTOR_BEARER };
  // Nạp auth muộn: tệp này phải nạp được bằng node thuần (scripts/check-portal-compliance.mjs chạy thật canAccessOps).
  const { nguoiTuRequest } = await import("./auth");
  const nguoi = await nguoiTuRequest(req);
  // Bearer chung khớp ở hành động cấm bearer, không kèm phiên: máy đã xưng danh nhưng không được làm → 403.
  if (!nguoi && bearerKhop(req)) return { ok: false, res: Response.json({ error: "forbidden" }, { status: 403 }) };
  if (!nguoi) return { ok: false, res: Response.json({ error: "unauthorized" }, { status: 401 }) };
  if (BAC_VAI[vaiHieuLuc(nguoi)] < BAC_VAI[luat.vai]) {
    return { ok: false, res: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, nguoi, actor: `user:${nguoi.id}` };
}

/**
 * Quyền gọi API của đội vận hành ngoài /api/v1/ops (hiện /api/v1/deals, /api/v1/offers) — bearer HOẶC phiên Ops.
 * Token đọc lúc gọi; OPS_API_TOKEN trống → nhánh bearer luôn sai. `getUser` là tham số để test chạy ngoài request Next.
 */
export async function canCallOpsApi(req: Request, getUser: () => Promise<User | null>): Promise<boolean> {
  if (bearerKhop(req)) return true;
  return canAccessOps(await getUser());
}
