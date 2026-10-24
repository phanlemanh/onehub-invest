---
schema_version: 1
feature: "Bản khai công cụ app/docs/api/mcp-tools.json khớp sổ bề mặt API: công cụ tin rao đòi bearer ops hoặc bị gỡ, không công cụ nào ghi «public» trái sổ"
slug: mcp-tools-theo-so-be-mat
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: approved
design_doc: docs/superpowers/specs/2026-10-24-mcp-tools-theo-so-be-mat-design.md
veto_state: mo
veto_opened_at: 2026-10-24T10:47:00Z
approved_by:
---

# Acceptance Contract: mcp-tools-theo-so-be-mat

## Context

Bản khai công cụ MCP `app/docs/api/mcp-tools.json` khai chung «auth: public» cho cả hai công cụ, trong khi sổ bề mặt
`app/src/lib/api-surface.ts` (NT4) đã đóng `/api/v1/offers` về chế độ `ops`: client MCP gọi `oneinvest_get_offers` không
token sẽ nhận 401. Không phép đo nào nối bản khai với sổ. Vòng này cho mỗi công cụ một chế độ khớp sổ và dựng phép đo
bắt lệch ở cả hai phía. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-8) theo lệnh Mạnh 24/10.

Căn cứ: `docs/plan/lo-trinh.json` ON15 · `docs/plan/pham-vi-ops-noi-that-2410.md` YC3 ·
`_acceptance/so-be-mat-api/review-findings.md` Ngoài-6 (`d-20261023T152726Z-20`, Mạnh chọn mở hợp đồng mới).

Source input: `_acceptance/mcp-tools-theo-so-be-mat/opportunity.md` · hàng ON15 của lộ trình.

## Criteria

- AC-1: Given bản khai `app/docs/api/mcp-tools.json` trên cây, When đọc từng công cụ, Then mỗi công cụ có khoá `auth`
  bằng đúng chế độ sổ của route nó gọi — `oneinvest_get_offers` khai `ops` và vẫn còn trong bản khai,
  `oneinvest_get_asset_stats` khai `public` — và khoá `auth` gốc không phải một lời khai chế độ chung.
- AC-2: Given cây thật, When chạy `node scripts/check-mcp-tools.mjs static`, Then exit 0 và in từng công cụ khớp sổ;
  Given bản khai VÀ sổ ở `1c6389b` (main trước vòng, đọc bằng git), When chạy `node scripts/check-mcp-tools.mjs historic`,
  Then cặp ấy trượt với «chế độ công cụ lệch sổ» nêu tên `oneinvest_get_offers`; thiếu lịch sử git thì exit 1 có tên.
- AC-3: Given bảng đột biến viết trước dựng từ bản khai và sổ thật theo chế độ tương đối (MT1–MT10 ở mục Coverage), When
  chạy `node scripts/check-mcp-tools.mjs mutation`, Then bản nguyên ĐẠT, MT4 (gốc khai chế độ, mọi công cụ ghi đè khớp sổ)
  ĐẠT, và mỗi bản đột biến còn lại TRƯỢT với đúng thông điệp ghim của nó; bản đột biến không áp được thì FAIL có tên.
- AC-4: Given làn kiểm cổng tĩnh `node scripts/check-portal-compliance.mjs` (khoá `portal_static`, chạy mỗi lượt ghim
  lại), When bản khai lệch sổ, Then làn ấy exit 1 và dòng FAIL nhắc công cụ MCP; bản khai khớp sổ thì làn ấy ĐẠT — chứng
  trên bản chép của cây ở thư mục tạm, không sửa tệp thật.
- AC-5: Given người đổi chế độ một route hay thêm công cụ MCP, When đọc đầu `app/src/lib/api-surface.ts` và mục sổ bề
  mặt của `docs/architecture/portals.md`, Then mỗi tệp nêu đủ ba ý: (a) đổi chế độ route có công cụ MCP hoặc thêm công cụ
  MCP thì sửa `app/docs/api/mcp-tools.json` cùng commit; (b) khoá `auth` mỗi công cụ là một trong năm chế độ sổ, bằng chế
  độ route nó gọi; (c) phép đo `scripts/check-mcp-tools.mjs` chạy trong làn `portal_static`. (judgment)

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Ma trận viết trước, mỗi ô
một bản đột biến của `check-mcp-tools.mjs mutation` (thông điệp ghim) hoặc một lý do loại:

| Trường \ Kiểu lệch | vắng | giá trị lạ | lệch quan hệ với sổ |
|---|---|---|---|
| endpoint | MT9 «công cụ trỏ route không có trong sổ» | MT5 (cùng thông điệp) | — loại: route có trong sổ thì quan hệ duy nhất là chế độ/phương thức, đo ở hai dòng dưới |
| method | MT10 «phương thức công cụ lệch sổ» | MT6 (cùng thông điệp) | MT6 (method ngoài `methods` của sổ chính là lệch quan hệ) |
| `auth` riêng | MT2 «công cụ thiếu chế độ» | MT8 «chế độ công cụ không có trong sổ» | MT1 «chế độ công cụ lệch sổ» |
| `auth` gốc (mặc định) | — loại: gốc vắng là khuôn mới, bản nguyên đo | — loại: chữ ngoài tên chế độ không là lời khai (Giới hạn đã biết của design) | MT3 «chế độ công cụ lệch sổ»; MT4 ghi đè hợp lệ → ĐẠT (đối chứng dương) |

Phía đổi: bản khai đổi (MT1–MT6, MT8–MT10) · sổ đổi (MT7 «chế độ công cụ lệch sổ»). Bản cũ thật: B0 (`historic`).

- Core: AC-1 trạng thái bản khai; AC-2 cây thật + cặp cũ thật; AC-3 ma trận trên; AC-4 rào nằm trong làn chạy mỗi lượt;
  AC-5 luật viết ra.
- Later: kiểm `inputSchema` khớp tham số route; `base_url` lệch cổng dev.
- Never: dựng MCP server trong vòng này (ROADMAP A3).

## Đường đo

- Thước: «lệch chế độ một tool → đỏ» · số từ: `node scripts/check-mcp-tools.mjs mutation` (MT1–MT10), `historic` (B0) và ca W1
  trên làn portal · bảo đảm bởi: AC-2, AC-3, AC-4
- Thước: «bản hiện tại xanh» · số từ: `node scripts/check-mcp-tools.mjs static` và `node scripts/check-portal-compliance.mjs`
  trên cây thật · bảo đảm bởi: AC-1, AC-2, AC-4

## Out of scope

- Dựng MCP server phục vụ bản khai (ROADMAP A3).
- Sửa `base_url` localhost:3000 của bản khai cho khớp cổng dev 3456.
- Kiểm `inputSchema` của công cụ khớp tham số route.
- Mở lại `/api/v1/offers` công khai — việc sau PL2, không thuộc hàng.

## Notes
