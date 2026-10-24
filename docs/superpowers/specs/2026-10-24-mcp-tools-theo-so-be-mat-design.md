# Thiết kế — mcp-tools-theo-so-be-mat (ON15)

Căn cứ: `docs/plan/lo-trinh.json` hàng ON15 · `docs/plan/pham-vi-ops-noi-that-2410.md` YC3 ·
`_acceptance/so-be-mat-api/review-findings.md` Ngoài-6 (Mạnh chọn «mở hợp đồng mới» 23/10).

## Vấn đề

`app/docs/api/mcp-tools.json` là bản khai công cụ MCP (C3-wrap, commit 2287ade) cho hai route: `oneinvest_get_asset_stats`
→ `/api/v1/asset-stats` và `oneinvest_get_offers` → `/api/v1/offers`. Khoá gốc `"auth": "public (đã pseudonymize theo SPL
ADR-0007)"` khai chung cho mọi công cụ. Từ NT4 (`so-be-mat-api`), sổ bề mặt `app/src/lib/api-surface.ts` khai
`v1/offers` chế độ `ops` (tạm đóng cùng căn giá tốt tới khi PL2 rút tin mock) — client MCP đọc bản khai sẽ gọi không
token và nhận 401. Không có phép đo nào nối bản khai với sổ, nên lần đổi chế độ kế (mở lại offers, hoặc thêm công cụ) lại
lệch im lặng.

## Cách làm

1. **Bản khai mang chế độ theo từng công cụ.** Mỗi công cụ có khoá `auth` mà giá trị là một trong năm chế độ của sổ
   (`public` · `ops` · `ops-session` · `admin` · `session-or-noop`). `oneinvest_get_offers` GIỮ LẠI với `auth: "ops"`
   (không gỡ): sổ ghi offers «tạm đóng», sẽ mở lại sau PL2 — khi đó đổi một dòng sổ + một khoá bản khai, phép đo bắt
   nếu chỉ đổi một bên. `oneinvest_get_asset_stats` khai `public`. Khoá gốc `auth` thôi khai chế độ chung: thành câu
   tả cách đọc («theo từng công cụ…; ops = header `Authorization: Bearer <OPS_API_TOKEN>`»). `updated` → 2026-10-24.
2. **Phép đo mới `scripts/check-mcp-tools.mjs`** đứng cạnh `check-api-surface.mjs`, dùng chung `loadEntries()` của nó
   (một bộ đọc sổ). Hàm thuần `checkMcpTools({ entries, manifest })` so từng công cụ với dòng sổ của route nó gọi:
   - endpoint `/api/<route>` phải có dòng sổ → «công cụ trỏ route không có trong sổ»;
   - `method` phải nằm trong `methods` của dòng sổ → «phương thức công cụ lệch sổ»;
   - chế độ hiệu lực = `auth` của công cụ (ghi đè), vắng thì chế độ khoá gốc khai (mặc định — chỉ khi khoá gốc là một lời
     khai chế độ: chuỗi mở đầu bằng tên một chế độ); không có → «công cụ thiếu chế độ»; ngoài năm chế độ → «chế độ công cụ
     không có trong sổ»; khác chế độ sổ → «chế độ công cụ lệch sổ» (nêu tên công cụ, khai gì, sổ gì);
   - công cụ vắng `endpoint` hay `method` → trượt có tên như trên (không bỏ qua lặng).
   Ba chế độ chạy: `static` (cây thật, exit 0/1) · `mutation` (bản nguyên ĐẠT, mọi bản đột biến TRƯỢT đúng thông điệp —
   không cần lịch sử git) · `historic` (B0 dưới).
3. **Bảng đột biến viết trước, dựng từ bản khai và sổ thật, theo chế độ TƯƠNG ĐỐI** (đột biến chọn «một chế độ khác
   chế độ sổ hiện tại», không cố định `ops`/`public` — khi PL2 mở lại offers đúng cả hai phía, bảng vẫn áp được):
   MT1 một công cụ đổi `auth` sang chế độ khác sổ · MT2 công cụ bỏ `auth`, gốc không khai chế độ · MT3 khuôn bản cũ
   (gốc khai một chế độ, mọi công cụ bỏ `auth`; gốc chọn khác sổ của ít nhất một công cụ) · MT4 ĐỐI CHỨNG DƯƠNG: gốc khai
   một chế độ, mọi công cụ giữ `auth` riêng khớp sổ → ĐẠT (ghi đè hợp lệ) · MT5 endpoint trỏ route không có · MT6 method
   ngoài `methods` của sổ · MT7 SỔ đổi chế độ route của một công cụ mà bản khai giữ nguyên · MT8 `auth` lạ `bearer` ·
   MT9 bỏ `endpoint` · MT10 bỏ `method`. Ma trận viết trước ở contract mục Coverage: mỗi ô một MT hoặc một lý do loại.
   **B0 (`historic`)**: đọc CẢ bản khai lẫn sổ ở `1c6389b` (main trước vòng) bằng `git show` (sổ ghi ra tệp tạm rồi
   import) và so bằng cùng hàm — phải TRƯỢT «chế độ công cụ lệch sổ» nêu `oneinvest_get_offers`. Đóng băng ở thời điểm
   hàng giao nên không đổi khi sổ đổi về sau. Chỉ chạy ở máy có lịch sử đầy đủ (worktree trên máy này, làn ghim lại);
   `1c6389b` vắng → exit 1 nêu «thiếu lịch sử git 1c6389b», không bỏ qua.
4. **Rào chạy mỗi lượt ghim lại.** `scripts/check-portal-compliance.mjs` (khoá `executors.script.portal_static`, nằm
   trong `feature_loop.suite_keys`) gọi `checkMcpTools` như mục 13. Ca W1 của chế độ `mutation`: chép `scripts/` +
   `app/src/` + `app/docs/` vào thư mục tạm (symlink `app/node_modules`), bản chép nguyên → portal-compliance exit 0;
   bản chép với bản khai MT1 → exit 1 và dòng FAIL nhắc «công cụ MCP».
5. **Tài liệu.** Đầu `app/src/lib/api-surface.ts` và mục sổ bề mặt của `docs/architecture/portals.md` mỗi chỗ nêu đủ
   ba ý: (a) đổi chế độ một route có công cụ MCP, hoặc thêm công cụ MCP mới, thì sửa `app/docs/api/mcp-tools.json` cùng
   commit; (b) khoá `auth` của mỗi công cụ là một trong năm chế độ sổ, bằng chế độ của route nó gọi; (c) phép đo giữ luật
   là `scripts/check-mcp-tools.mjs`, chạy trong làn `portal_static` (`check-portal-compliance.mjs`).

Thêm ba khoá config: `executors.script.mcp_tools_static`, `executors.script.mcp_tools_mutation`, `executors.script.mcp_tools_historic`.

## Không làm

- Dựng MCP server (ROADMAP A3 — chưa có); bản khai vẫn là tệp tĩnh.
- `base_url` `http://localhost:3000` trong bản khai lệch cổng dev 3456 — chuyện cấu hình, không phải chế độ quyền.
- Kiểm `inputSchema` khớp tham số route.

## Giới hạn đã biết

- Khoá gốc viết chế độ bằng chữ khác tên chế độ (vd «công khai») không bị nhận là lời khai chế độ. Bản khai mới không
  dùng; luật nằm ở `api-surface.ts` và `portals.md`.
