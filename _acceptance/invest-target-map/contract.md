---
schema_version: 1
feature: Bản đồ đích cổng Invest — block đích cho mọi route Invest trước khi dọn tiếp
slug: invest-target-map
owner: phanlemanh@gmail.com
risk_tier: T2      # đổi .claude/skills/** + test lint; không đụng t3_paths, không đổi mã trang
surfaces: [docs, config]
status: approved
approved_by: Mạnh
approved_at: 2026-10-23
design_doc: _acceptance/invest-target-map/ban-quyet-dinh.html
---

# Acceptance Contract: invest-target-map

## Context

Mạnh muốn các trang Invest chọn shell/block/component như đợt B1 đã làm cho Ops, nhưng chốt một
lượt cho cả cổng rồi dọn theo nhóm trang thay vì theo loại component (KPI/biểu đồ/trạng thái).
Phiên này khảo sát MCP reui cho 13 route Invest (`khao-sat-mcp.md`), dựng bảng quyết định có ảnh
hiện trạng + thumbnail ứng viên (`ban-quyet-dinh.html`, `figures/`), trình Mạnh chọn (2026-10-23:
theo khuyến nghị cả 13 trang; giữ `app-shell-30`; `/dau-tu` gộp vào `/yield`; URL tiếng Anh toàn bộ;
bản đồ nguồn `mapcn` — `decisions.jsonl`),
rồi ghi kết quả vào `routes.md`, thêm test và cắt lại Track 6. Không sửa mã trang.

Phạm vi file: `.claude/skills/onehub-ui/{routes,loop,catalog}.md`, `app/eslint-plugin-onehub-ui/tests/routes-map.test.mjs`,
`docs/ROADMAP.md` (Track 6), `_acceptance/invest-target-map/**`.

## Criteria

- AC-1: Given `routes.md`, When đọc bảng route, Then có cột "Block đích" và mọi dòng route có giá trị:
  tên block trong backtick, `chờ (lý do)`, hoặc `—` chỉ khi bề mặt là redirect; mọi route Invest
  không phải redirect mang tên block đã chốt (không dòng Invest nào còn `chờ`).
- AC-2: Given test `routes-map.test.mjs`, When chạy `npm run test:lint-rules`, Then xanh với
  `routes.md` hiện tại, và đỏ (báo tên route) khi một dòng route thiếu hoặc sai giá trị Block đích.
- AC-3: Given `routes.md`, When đọc mục "Shell theo cổng" và "Đợt dọn cổng Invest theo nhóm trang",
  Then shell Invest ghi `app-shell-30` (giữ) kèm lý do, và 6 đợt I1–I6 phủ đúng 13 route Invest
  có UI (mỗi route đúng một đợt), mỗi đợt ghi block kéo theo biểu đồ.
- AC-4: Given `ban-quyet-dinh.html`, When mở, Then mỗi route Invest có một hàng gồm ảnh hiện trạng,
  2–3 ứng viên kèm thumbnail + previewUrl, khuyến nghị + lý do 1 dòng, tác động KPI/biểu đồ/trạng thái,
  và phần không có block; mọi ảnh tải được.
- AC-5: Given `docs/ROADMAP.md` Track 6, When đọc, Then có dòng bản đồ đích + các đợt I1–I6 thay
  cho B2/B4, B5 thu về phần Ops.
- AC-6: Given `routes.md`, When đọc bảng route, Then có cột "Slug đích" cho mọi route (`giữ` hoặc
  đường dẫn ASCII trong backtick): `/so-sanh` → `/compare`, `/phuong-phap` → `/methodology`,
  `/dau-tu` → 301 `/yield`; test đỏ khi thiếu cột hoặc giá trị sai dạng.
- AC-7: Given `routes.md` mục Bản đồ + `catalog.md` mục Bản đồ nền, When đọc, Then nguồn bản đồ đích
  là `mapcn` (Finder choropleth, Duyệt listing store-locator + clusters, Insight map cơ bản), và
  `ban-quyet-dinh.html` có mục Bản đồ với ảnh hiện tại cạnh ảnh block mapcn/shadcn-map + mục
  "Thuật ngữ cần chốt".
- AC-8: Given `loop.md` bước 3, When đọc, Then có bước tra Mobbin 3–6 màn khi chốt khuôn IA (≥2 khuôn),
  ghi `mobbin_url`, Mobbin chỉ cho IA, block từ ReUI (bản đồ mapcn), không có Mobbin thì chọn từ
  archetype của `reui/rules/compose.md` kèm lý do.

## Out of scope

- Mọi thay đổi mã trang/component, cài block hay mapcn, đổi file route / thêm 301 (làm ở đợt I*).
- Tham chiếu Mobbin đủ 2–4 cho mọi nhóm trang: phiên này không có MCP Mobbin — mới có 3 link
  điều phối tra cho Finder/Listing, các nhóm khác ghi từ khoá chờ tra.
- Gỡ ảnh AirDNA khỏi `/listing/[id]` (phiên riêng); bảng màu biểu đồ (B3).
- Dòng Ops của routes.md chỉ chép block đã chốt ở bảng 2b của B1, không quyết lại.

## Notes

- Ảnh hiện trạng chụp từ server của worktree này (`main` f51b01c) vì :3456 là server nhánh B3.
- `/saved` cần đăng nhập: ảnh hiện trạng là trang đăng nhập.
- Khi B1 merge, dòng Ops của `routes.md` sẽ xung đột (cả hai nhánh sửa cùng dòng): giữ cột Block
  đích, lấy phần còn lại theo B1.
