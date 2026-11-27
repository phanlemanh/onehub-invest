---
schema_version: 1
feature: Lược đồ mẫu của data-api bản công khai không còn tên nguồn thật ngoài tên bảng/cột đã biết — chú thích, dữ liệu mẫu source_registry và tên tệp dưới data-api/db dùng mã S0x
slug: data-api-don-ten-nguon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
design_doc: docs/superpowers/specs/2026-11-25-data-api-don-ten-nguon-design.md
veto_state: mo
veto_opened_at: 2026-11-25T16:54:41Z
approved_at: 2026-11-25T16:54:41Z
---

# Acceptance Contract: data-api-don-ten-nguon

## Context

Hàng PB5, giám sát đợt cắt 25/11 (chưa có trong `docs/plan/lo-trinh.json`), dãy M5B trên M5. `data-api/` sang repo công
khai qua subtree; tên nguồn thật là tầng A (AGENTS.md luật 6). Bộ dò của kho trên `origin/main` `78ea448dd`: 133 cụm trong
nội dung + 8 tên tệp. Phạm vi GS phán (lối A): 31 chú thích + 13 chuỗi dữ liệu mẫu + 8 tên tệp, CHỈ dưới `data-api/db/**`.
Thước mới: `scripts/data-api-ten-nguon.mjs` + test `scripts/data-api-ten-nguon.test.mjs`. Không đổi hành vi, không đổi
lược đồ, không sửa gì dưới `data-api/src/`.

## Criteria

- AC-1: Given cây `data-api/**` sau khi dọn (mọi tệp chữ, kể cả md, json, tệp không đuôi như Dockerfile), When chạy bộ quét `scripts/data-api-ten-nguon.mjs`, Then 0 cụm ngoài tên bảng/cột đã biết (`DINH_DANH_BIET`, 22 dạng che) và 0 tên tệp mang tên nguồn; mọi cụm còn lại là định danh, số định danh ≤ 89 (89 lúc dọn); trên `origin/main` `78ea448dd` cùng lệnh đỏ với 52 vi phạm (31 chú thích, 13 chuỗi, 8 tên tệp).
- AC-2: Given thư mục `db/migrations` không có câu `INSERT INTO source_registry`, When chạy hàm rút tên và chạy CLI `scripts/data-api-ten-nguon.mjs`, Then cả hai dừng với «không rút được tên nào» (CLI thoát khác 0), không báo sạch mù; đủ migration thì CLI thoát 0.
- AC-3: Given bản sao cây data-api đã dọn, When cấy lần lượt tên thật vào chú thích SQL, chuỗi SQL, chú thích TS, chuỗi TS, README (md), Dockerfile (tệp không đuôi), một định danh mới ngoài danh sách, và tên một tệp, Then mỗi ca ra đúng một vi phạm nêu loại, mã S0x, tệp; bản sao chưa cấy ra 0.
- AC-4: Given DB trống mới, When dựng `data-api/db/*.sql` theo thứ tự tên rồi `seed.sql` từng câu như `psql -f`, Then (a) danh sách bảng/view (đã che) và chữ ký lỗi trùng đúng bản đo trên `origin/main` trước khi dọn (28 bảng + 2 view PostGIS; 1×42P01 ở 012, 1×42P01 + 10×25P02 ở seed), (b) 29 giá trị mặc định của cột trùng bản trước, (c) dòng `source_registry` sau = ánh xạ của dòng trước (`real_name` → `Nguồn mẫu S0x`, mỗi `source_id` `<tên>-<vai>` → `s0x-<vai>`, cả `s03-agent` của 014); đối chứng đỏ: bỏ tệp 018 thì thiếu đúng `ops_audit`, đổi `s03-groups` ở 013 thì dòng S03 lệch ánh xạ. Lệnh đo thoát khác 0 khi có ca bị bỏ qua.

## Coverage

Trục: loại cụm (chú thích · chuỗi dữ liệu · định danh · tên tệp) × loại tệp (SQL · TS · khác).

| | SQL | TS | Khác (md, json) |
|---|---|---|---|
| Chú thích | dọn 31 (AC-1), ca phá (AC-3) | 0 có sẵn, ca phá (AC-3) | 0 có sẵn; bộ quét coi cả tệp là chú thích (AC-1) |
| Chuỗi dữ liệu | dọn 13 (AC-1), ca phá (AC-3) | 0 có sẵn, ca phá (AC-3) | — |
| Định danh | 62 nợ, giữ (Out of scope OOS-1); định danh mới đỏ (AC-3) | 27 nợ, giữ (OOS-1) | — |
| Tên tệp | 8 đổi (AC-1), ca phá (AC-3) | 0 | 0 |

Hành vi lược đồ mẫu sau đổi: AC-4. Thước không mù: AC-2.

## Out of scope

- OOS-1: 89 cụm tên bảng/cột/chỉ mục (`db/*.sql` 48, `seed.sql` 14, `src/routes` 27 — coverage 6, deals 1, listings 4, markets 16) — ngoài phạm vi, vì đổi tên bảng là migration mới + DDL trên cloud (lời riêng của Mạnh) + mọi bên đọc (route data-api, app, pipeline); khoản nợ «dọn tên nguồn trong lược đồ», cùng phán với hàng HT26 (GS 25/11).
- OOS-2: Mọi tệp dưới `data-api/src/` — vùng của PB2/PB3 và tên biến của HT20.
- OOS-3: Dạng viết tắt mà bộ dò của kho không bắt (tiền tố `abnb_` của id listing, bảng `stg_abnb_*`) — định dạng dữ liệu chung của hệ thống; đổi là đổi dữ liệu.
- OOS-4: Lỗi dựng sẵn của lược đồ mẫu (012 cập nhật `area_sources` chưa có, thiếu `v_ruler_p2`) — hàng PB1; PB5 giữ nguyên lỗi đó.

## Notes

- Vùng tệp của vòng: `data-api/db/**`; thước mới `scripts/data-api-ten-nguon.mjs`, `scripts/data-api-ten-nguon.test.mjs`, `scripts/data-api-ten-nguon-db.sh`; ba khoá lệnh trong `_acceptance/config.yaml`; design doc; hồ sơ này.
