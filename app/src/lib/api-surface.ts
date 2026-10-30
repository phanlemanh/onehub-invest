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
 *
 * Công cụ MCP (hồ sơ mcp-tools-theo-so-be-mat, ON15): `app/docs/api/mcp-tools.json` khai công cụ gọi các route này.
 * Đổi chế độ một route có công cụ MCP, hoặc thêm công cụ MCP mới: sửa `mcp-tools.json` cùng commit. Khoá `auth` của mỗi
 * công cụ là một trong năm chế độ trên, bằng chế độ của route nó gọi (khoá `auth` gốc của bản khai chỉ là mặc định, bản
 * khai hiện tại không dùng). `scripts/check-mcp-tools.mjs` (chạy trong làn `portal_static`, tức
 * `check-portal-compliance.mjs`) đỏ khi công cụ trỏ route ngoài sổ, phương thức hay chế độ lệch sổ.
 */
export type ApiMode = "public" | "ops" | "ops-session" | "admin" | "session-or-noop";
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/** methodModes: chế độ riêng của phương thức khác chế độ chung (TV1 — vd GET đọc cho bearer, POST quản trị chỉ admin). */
export type ApiSurfaceEntry = {
  route: string;
  methods: ApiMethod[];
  mode: ApiMode;
  methodModes?: Partial<Record<ApiMethod, ApiMode>>;
  note: string;
};

export const API_SURFACE: ApiSurfaceEntry[] = [
  { route: "v1/asset-stats", methods: ["GET"], mode: "public", note: "chỉ số tài sản theo khu vực (metrics precompute)" },
  { route: "v1/listings", methods: ["GET"], mode: "public", note: "listing cho thuê ngắn hạn tự thu" },
  { route: "v1/markets", methods: ["GET"], mode: "public", note: "chỉ số thị trường theo khu vực" },
  { route: "v1/deals", methods: ["GET"], mode: "ops", note: "căn giá tốt — tạm đóng tới khi PL2 rút tin mock (deals-api-tam-dong)" },
  { route: "v1/offers", methods: ["GET"], mode: "ops", note: "tin rao — cùng chế độ tạm đóng với căn giá tốt (so-be-mat-api)" },
  { route: "v1/ops/collections", methods: ["GET"], mode: "ops", note: "sức khoẻ thu thập theo nguồn" },
  { route: "v1/ops/coverage", methods: ["GET"], mode: "ops", note: "độ phủ thu thập — máy chủ đọc khối freshness, cờ state fresh/stale/none (AU12)" },
  { route: "v1/ops/extraction-quality", methods: ["GET"], mode: "ops", note: "chất lượng trích xuất" },
  { route: "v1/ops/ingest", methods: ["POST"], mode: "ops", note: "nạp số ops từ máy local lên cloud" },
  { route: "v1/ops/truthful-coverage", methods: ["GET"], mode: "ops", note: "độ phủ nói thật" },
  { route: "v1/ops/review/[id]/decide", methods: ["POST"], mode: "ops-session", note: "quyết thẻ duyệt — review.decide: vai ops, không bearer (TV1)" },
  { route: "v1/ops/labels", methods: ["GET", "POST"], mode: "ops-session", note: "gắn nhãn đánh giá mù — label.write: vai ops, không bearer; chỉ máy thu (PL7)" },
  { route: "v1/ops/source-groups", methods: ["GET", "POST"], mode: "ops", methodModes: { POST: "admin" }, note: "nhóm nguồn — GET ops.read; mọi action POST là unit.* chỉ admin (TV1)" },
  { route: "v1/ops/zalo/accounts", methods: ["GET", "POST", "DELETE"], mode: "admin", note: "tài khoản thu Zalo — zalo.admin (TV1)" },
  { route: "v1/ops/zalo/groups", methods: ["GET", "POST"], mode: "admin", note: "nhóm Zalo theo dõi — zalo.admin (TV1)" },
  { route: "v1/ops/zalo/login", methods: ["POST", "GET", "DELETE"], mode: "admin", note: "đăng nhập QR tài khoản thu (QR trả base64, không qua zalo-media) — zalo.admin (TV1)" },
  { route: "v1/ops/audit", methods: ["GET"], mode: "admin", note: "nhật ký ops_audit — audit.read: chỉ admin, không bearer (TV1)" },
  { route: "zalo-media", methods: ["GET"], mode: "admin", note: "ảnh tin tầng A cho /ops; chặn ảnh QR đăng nhập" },
  { route: "v1/user-events", methods: ["POST"], mode: "session-or-noop", note: "beacon user_events — khách 204, không ghi" },
];
