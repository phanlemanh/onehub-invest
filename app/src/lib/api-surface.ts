/**
 * Sổ bề mặt API (hồ sơ so-be-mat-api, NT4) — mỗi route dưới `app/src/app/api` khai đúng một dòng: đường thư mục,
 * phương thức export, chế độ quyền. `scripts/check-api-surface.mjs` (chạy trong check-portal-compliance) đỏ khi mã lệch sổ:
 * route chưa khai, dòng sổ trỏ route đã xoá, phương thức lệch, route đọc `sale_offers` mà khai `public`, cổng lệch chế độ.
 *
 * Chế độ:
 *   public          — ai cũng gọi được; KHÔNG được đọc `sale_offers` (kể cả gián tiếp qua thư viện).
 *   ops             — máy có bearer OPS_API_TOKEN hoặc phiên ops (`canCallOpsApi`, hoặc nhánh bearer + `canAccessOps`/`isAdmin`).
 *   ops-session     — chỉ phiên ops (`canAccessOps`); KHÔNG có nhánh bearer.
 *   admin           — chỉ role admin (`isAdmin`); KHÔNG có nhánh bearer.
 *   session-or-noop — có phiên thì làm, khách nhận 204 và không có gì được ghi.
 * Sổ phải RỘNG BẰNG HOẶC HƠN mã: mã không bao giờ cho một người gọi mà sổ không cho (mã chặt hơn sổ thì được, ghi ở
 * `note`). Thêm route mới: thêm dòng ở đây cùng commit.
 */
export type ApiMode = "public" | "ops" | "ops-session" | "admin" | "session-or-noop";
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiSurfaceEntry = { route: string; methods: ApiMethod[]; mode: ApiMode; note: string };

export const API_SURFACE: ApiSurfaceEntry[] = [
  { route: "v1/asset-stats", methods: ["GET"], mode: "public", note: "chỉ số tài sản theo khu vực (metrics precompute)" },
  { route: "v1/listings", methods: ["GET"], mode: "public", note: "listing cho thuê ngắn hạn tự thu" },
  { route: "v1/markets", methods: ["GET"], mode: "public", note: "chỉ số thị trường theo khu vực" },
  { route: "v1/deals", methods: ["GET"], mode: "ops", note: "căn giá tốt — tạm đóng tới khi PL2 rút tin mock (deals-api-tam-dong)" },
  { route: "v1/offers", methods: ["GET"], mode: "ops", note: "tin rao — cùng chế độ tạm đóng với căn giá tốt (so-be-mat-api)" },
  { route: "v1/ops/collections", methods: ["GET"], mode: "ops", note: "sức khoẻ thu thập theo nguồn" },
  { route: "v1/ops/coverage", methods: ["GET"], mode: "ops", note: "độ phủ thu thập" },
  { route: "v1/ops/extraction-quality", methods: ["GET"], mode: "ops", note: "chất lượng trích xuất" },
  { route: "v1/ops/ingest", methods: ["POST"], mode: "ops", note: "nạp số ops từ máy local lên cloud" },
  { route: "v1/ops/truthful-coverage", methods: ["GET"], mode: "ops", note: "độ phủ nói thật" },
  { route: "v1/ops/review/[id]/decide", methods: ["POST"], mode: "ops", note: "quyết thẻ duyệt" },
  { route: "v1/ops/source-groups", methods: ["GET", "POST"], mode: "ops", note: "nhóm nguồn" },
  { route: "v1/ops/zalo/accounts", methods: ["GET", "POST", "DELETE"], mode: "ops", note: "tài khoản thu Zalo" },
  { route: "v1/ops/zalo/groups", methods: ["GET", "POST"], mode: "ops", note: "nhóm Zalo theo dõi" },
  { route: "v1/ops/zalo/login", methods: ["POST", "GET", "DELETE"], mode: "ops", note: "đăng nhập QR tài khoản thu (QR trả base64, không qua zalo-media)" },
  { route: "v1/ops/audit", methods: ["GET"], mode: "ops", note: "nhật ký ops_audit — mã chặt hơn sổ: phiên phải là admin" },
  { route: "zalo-media", methods: ["GET"], mode: "admin", note: "ảnh tin tầng A cho /ops; chặn ảnh QR đăng nhập" },
  { route: "v1/user-events", methods: ["POST"], mode: "session-or-noop", note: "beacon user_events — khách 204, không ghi" },
];
