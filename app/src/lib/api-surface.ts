/**
 * Sổ bề mặt API (hồ sơ so-be-mat-api, NT4) — mỗi route dưới `app/src/app/api` khai đúng một dòng: đường thư mục,
 * phương thức export, chế độ quyền. `scripts/check-api-surface.mjs` (chạy trong check-portal-compliance) đỏ khi mã lệch sổ:
 * route chưa khai, dòng sổ trỏ route đã xoá, phương thức lệch, route đọc `sale_offers` mà khai `public`, cổng lệch chế độ.
 *
 * Chế độ:
 *   public          — ai cũng gọi được; KHÔNG được đọc `sale_offers` (kể cả gián tiếp qua thư viện). Ngoại lệ duy nhất: hai
 *                     route tin rao khai `publicOffers`, đọc qua đúng `lib/offers-public.ts` (tin-rao-tren-invest).
 *   ops             — máy có bearer OPS_API_TOKEN hoặc phiên ops (`canCallOpsApi`, hoặc nhánh bearer + `canAccessOps`/`isAdmin`).
 *   ops-session     — chỉ phiên ops (`canAccessOps`); KHÔNG có nhánh bearer.
 *   admin           — chỉ role admin (`isAdmin`); KHÔNG có nhánh bearer.
 *   session-or-noop — có phiên thì làm, khách nhận 204 và không có gì được ghi.
 *   machine         — chỉ token máy theo tên có scope (`kiemTokenMay`, TV4 ADR-0015 §2); không phiên người, bearer chung bị 403.
 * Sổ phải RỘNG BẰNG HOẶC HƠN mã: mã không bao giờ cho một người gọi mà sổ không cho (mã chặt hơn sổ thì được, ghi ở
 * `note`). Thêm route mới: thêm dòng ở đây cùng commit.
 *
 * Công cụ MCP (hồ sơ mcp-tools-theo-so-be-mat, ON15): `app/docs/api/mcp-tools.json` khai công cụ gọi các route này.
 * Đổi chế độ một route có công cụ MCP, hoặc thêm công cụ MCP mới: sửa `mcp-tools.json` cùng commit. Khoá `auth` của mỗi
 * công cụ là một trong năm chế độ trên, bằng chế độ của route nó gọi (khoá `auth` gốc của bản khai chỉ là mặc định, bản
 * khai hiện tại không dùng). `scripts/check-mcp-tools.mjs` (chạy trong làn `portal_static`, tức
 * `check-portal-compliance.mjs`) đỏ khi công cụ trỏ route ngoài sổ, phương thức hay chế độ lệch sổ.
 */
export type ApiMode = "public" | "ops" | "ops-session" | "admin" | "session-or-noop" | "machine";
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/** methodModes: chế độ riêng của phương thức khác chế độ chung (TV1 — vd GET đọc cho bearer, POST quản trị chỉ admin). */
export type ApiSurfaceEntry = {
  route: string;
  methods: ApiMethod[];
  mode: ApiMode;
  methodModes?: Partial<Record<ApiMethod, ApiMode>>;
  /** Route public được đọc tin rao; danh sách route đóng ở check-api-surface.mjs. */
  publicOffers?: boolean;
  note: string;
};

export const API_SURFACE: ApiSurfaceEntry[] = [
  { route: "v1/asset-stats", methods: ["GET"], mode: "public", note: "chỉ số tài sản theo khu vực (metrics precompute)" },
  { route: "v1/listings", methods: ["GET"], mode: "public", publicOffers: true, note: "danh sách Listing theo loại: thuê ngắn hạn, tin bán, tin thuê dài hạn; không mang SĐT" },
  { route: "v1/listings/[id]/contact", methods: ["GET"], mode: "public", publicOffers: true, note: "SĐT của đúng một tin đang hiện; tin ẩn hay chưa có số cùng một 404" },
  { route: "v1/markets", methods: ["GET"], mode: "public", note: "chỉ số thị trường theo khu vực" },
  { route: "v1/deals", methods: ["GET"], mode: "ops", note: "căn giá tốt — tạm đóng tới khi PL2 rút tin mock (deals-api-tam-dong)" },
  { route: "v1/offers", methods: ["GET"], mode: "ops", note: "tin rao — cùng chế độ tạm đóng với căn giá tốt (so-be-mat-api)" },
  { route: "v1/ops/collections", methods: ["GET"], mode: "ops", note: "sức khoẻ thu thập theo nguồn" },
  { route: "v1/ops/coverage", methods: ["GET"], mode: "ops", note: "độ phủ thu thập — máy chủ đọc khối freshness, cờ state fresh/stale/none (AU12)" },
  { route: "v1/ops/extraction-quality", methods: ["GET"], mode: "ops", note: "chất lượng trích xuất" },
  { route: "v1/ops/ingest", methods: ["POST"], mode: "ops", note: "nạp số ops từ máy local lên cloud; khối kind=change_request_results chỉ nhận token máy ops:pull (TV4), chặt hơn sổ" },
  { route: "v1/ops/change-requests", methods: ["GET", "POST"], mode: "ops-session", note: "sổ Lệnh (TV4) — GET lenh.xem từ viewer kèm last_pull_at; POST lenh.gui từ ops, source.resume còn đòi isAdmin (chặt hơn sổ)" },
  { route: "v1/ops/change-requests/[id]/decide", methods: ["POST"], mode: "admin", note: "duyệt hoặc từ chối lệnh (TV4) — lenh.duyet; lệnh nhắm S03 cần người duyệt khác người gửi" },
  { route: "v1/ops/change-requests/pull", methods: ["GET"], mode: "machine", note: "máy thu kéo lệnh đã duyệt bằng token máy ops:pull (TV4, ADR-0015 §2)" },
  { route: "v1/ops/truthful-coverage", methods: ["GET"], mode: "ops", note: "độ phủ nói thật" },
  { route: "v1/ops/review/[id]/decide", methods: ["POST"], mode: "ops-session", note: "quyết thẻ duyệt — review.decide: vai ops, không bearer (TV1)" },
  { route: "v1/ops/labels", methods: ["GET", "POST"], mode: "ops-session", note: "gắn nhãn đánh giá mù — label.write: vai ops, không bearer; chỉ máy thu (PL7)" },
  { route: "v1/ops/labels/[itemId]/review", methods: ["GET", "POST"], mode: "ops-session", note: "lượt hai sau khi lưu nhãn: so với máy đọc, ghi trường hợp — label.write: vai ops, không bearer; chỉ máy thu (GC0)" },
  { route: "v1/ops/source-groups", methods: ["GET", "POST"], mode: "ops", methodModes: { POST: "admin" }, note: "nhóm nguồn — GET ops.read; mọi action POST là unit.* chỉ admin (TV1)" },
  { route: "v1/ops/zalo/accounts", methods: ["GET", "POST", "DELETE"], mode: "admin", note: "tài khoản thu Zalo — zalo.admin (TV1)" },
  { route: "v1/ops/zalo/groups", methods: ["GET", "POST"], mode: "admin", note: "nhóm Zalo theo dõi — zalo.admin (TV1)" },
  { route: "v1/ops/zalo/login", methods: ["POST", "GET", "DELETE"], mode: "admin", note: "đăng nhập QR tài khoản thu (QR trả base64, không qua zalo-media) — zalo.admin (TV1)" },
  { route: "v1/ops/audit", methods: ["GET"], mode: "admin", note: "nhật ký ops_audit — audit.read: chỉ admin, không bearer (TV1)" },
  { route: "zalo-media", methods: ["GET"], mode: "ops-session", note: "ảnh tin cho /ops; mã chặt hơn sổ: ?nhan=<item_id>&anh=<thứ tự> (ảnh trên thẻ gắn nhãn), ?media=<khoá> (máy chủ tự lấy ảnh gốc, không lộ URL) và ?snapshot= cho vai Vận hành trở lên (xemNoiDungTin, PL3, anh-goc-qua-may-chu); ?path= (staging OpenClaw) chỉ admin; vai Người xem nhận 404; chặn ảnh QR đăng nhập" },
  { route: "v1/user-events", methods: ["POST"], mode: "session-or-noop", note: "beacon user_events — khách 204, không ghi" },
];
