---
schema_version: 1
feature: Người vận hành dữ liệu sinh được một tập tin mẫu của lát Ocean Park 1 có đáp án biết sẵn, sinh lại ra đúng tập cũ, mang dấu mẫu và không bao giờ tới bảng canonical — để PL9 chấm cách đọc tin trước khi đội gắn nhãn xong
slug: tap-nhan-mau-ocp1
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-tap-nhan-mau-ocp1-design.md
---

# Acceptance Contract: tap-nhan-mau-ocp1

## Context

Hàng PL8 của `docs/plan/lo-trinh.json` (T2, đứng trên PL7 đã gộp, PL9 đứng trên hàng này). Cổng Đáng `build`: Mạnh
30/10 «P4 làm cả hai: nhan-gia-va-luu-loi-mang trước, rồi PL8». Căn cứ: RV-L05 (không tầng nào có tập nhãn), RV-L19
(dữ liệu giả lẫn vào canonical), bảng trường của PL7 (`docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md`).
Tập mẫu là hàm thuần của (seed, n, thư viện khuôn) — không bảng, không ghi DB.

## Criteria

- AC-1: Given cùng `lat`, `n`, `seed`, When sinh tập mẫu hai lần (hàm `sinhTapMau` và lệnh `label-mau.mjs --out`),
  Then hai đầu ra JSONL trùng từng byte, và đầu ra của hàm trùng đầu ra của lệnh; seed khác cho ít nhất một tin khác;
  dev/test chia đôi, lệch tối đa 1; tệp kiểm `mau-kiem.jsonl` đã commit trùng từng byte bản sinh lại (n = 40, seed
  `kiem`).
- AC-2: Given mỗi khuôn và mỗi dạng viết của từng ô, When bộ sinh bơm một giá trị vào ô, Then nhãn của tin là đúng giá
  trị đó ở khuôn chuẩn hoá của bộ ghi nhãn PL7.
  - Giá VND nguyên, một giá thì min = max; diện tích thập phân chuẩn («64.5»); phòng ngủ số nguyên.
  - Dự án và toà là chữ thường NFC như tin viết.
  - Ô khuôn không có thì trường là «tin không nêu».
- AC-3: Given mọi nhãn của tập n = 200 ở ba seed, When đổi thành ô thô (giá kèm đơn vị) rồi đưa qua bộ
  ghi nhãn thật `chuanHoaLuot` (`app/src/lib/labels-normalize.ts`), Then bộ ghi nhận cả lượt và trả đúng giá trị ấy cho
  từng trường.
- AC-4: Given tập n = 200 ở mỗi seed của ma trận ba seed, When đếm theo ma trận phủ viết trước (37 ô), Then mỗi ô có
  ít nhất một tin.
  - Năm tổ hợp ý định × loại tin: offer × sale, offer × rent_lt, inquiry × sale, inquiry × rent_lt, not_listing (loại
    tin không nêu).
  - Tám trường `kind`, `property_type`, `project`, `building`, `price_min_vnd`, `price_max_vnd`, `area_m2`, `bedrooms`
    × {nêu, không nêu} (16 ô).
  - Bảy dạng viết giá: tỷ dấu phẩy, tỷ dấu chấm, «x tỷ y», triệu, VND đủ số, khoảng hai đầu, «tr/tháng».
  - Ba dạng diện tích («m2», «m²», «m»), ba dạng phòng ngủ («PN», «ngủ», «N»), ba dạng dự án («Ocean Park 1»,
    «OCP1», «Vinhomes Ocean Park»).
- AC-5: Given thư viện khuôn, When đối chiếu từng khuôn với tin S03 thật của lát OCP1 mà `goc` của nó trỏ tới (DB
  local, đã gạt post thử, chỉ đọc), Then khuôn được rút từ chính tin ấy.
  - `goc` có trong tin của lát, và không hai khuôn chung một `goc`.
  - Các đoạn chữ cố định giữa các ô xuất hiện theo đúng thứ tự trong chữ tin gốc (cùng chuẩn hoá `normText`, đã gạt
    SĐT và URL), phủ ít nhất 80% độ dài chữ cố định của khuôn.
  - Khuôn sai thì phép đo nêu tên khuôn.
- AC-6: Given thư viện khuôn và tập n = 200, When quét, Then không có định danh nào.
  - Không có dãy số dạng SĐT Việt Nam (chỉ dạng che `09xx xxx xxx`) và không có URL.
  - Không có tên người gửi hay tên nhóm của lát (đọc từ DB local), so nguyên tên sau NFC + chữ thường, có ranh giới
    từ; không có tên nguồn thật. Phạm vi quét gồm cả mã nguồn bộ sinh (mọi bể giá trị) và tệp kiểm `mau-kiem.jsonl`.
  - Chữ nghiệp vụ hợp lệ («phương án thanh toán», «Ocean Park 1», «OCP1») không bị tính là định danh.
- AC-7: Given tập mẫu, When đọc, Then mọi tin mang `mau: true` và `id` bắt đầu `mau-`; dòng đầu JSONL khai
  `"loai":"tap-nhan-mau"`, `"mau":true`, seed, n và băm thư viện khuôn; lệnh không có cờ bỏ dấu (cờ lạ → lỗi).
- AC-8: Given bộ sinh, When soát mã và DB, Then tập mẫu không có đường tới bảng canonical hay `stg_*`.
  - `tap-mau.mjs` và `label-mau.mjs` không import `pg` và không có câu SQL ghi.
  - Không tệp nào khác trong `pipeline/` import bộ sinh (trừ test của nó).
  - DB local có 0 dòng `sale_offer_records` mang khoá hay post_id `mau-`, 0 dòng `stg_zalo_posts` có post_id `mau-`.
- AC-9 (judgment): Given tệp kiểm `mau-kiem.jsonl` (40 tin, seed `kiem`), When một người đọc chữ từng tin theo bảng
  trường của PL7, Then nhãn của từng tin là đúng điều người gắn cẩn thận sẽ gắn, không tin nào sai hay có hai cách hiểu.
- AC-10: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong:
  - `pipeline/lib/tap-mau.mjs`, `pipeline/lib/khuon-mau-ocp1.mjs`, `pipeline/lib/tap-mau.test.mjs`,
    `pipeline/label-mau.mjs`, `pipeline/CLAUDE.md` (một dòng bảng lệnh);
  - `app/tests/labels-mau.test.tsx`, `_acceptance/config.yaml`;
  - hồ sơ này, design doc, plan, tệp máy sinh (`PRODUCT-MAP.md`, `LO-TRINH.html`).

## Coverage

- Trục **trường × trạng thái** (chín trường PL7 × nêu/không nêu) — AC-2, AC-4.
- Trục **dạng viết** (giá: bảy dạng; diện tích, phòng ngủ, dự án: ba dạng mỗi trường; toà theo mã) — AC-2, AC-4.
- Trục **ý định × loại tin** (năm tổ hợp hợp lệ; not_listing không có loại tin) — AC-4.
- Trục **đường ra** (hàm, JSONL, DB) — AC-1, AC-7, AC-8.
- Thước CE: ma trận viết trước trong test (số assert = số phần tử). Bản quét: `coverage-scan.md`.

## Đường đo

- Ngưỡng ở `opportunity.md`: «Sinh lại hai lần ra cùng tập; 0 dòng mẫu trong sale_offers».
- Số từ hai chỗ. Băm hai lần chạy lệnh `label-mau.mjs --out` bảo đảm bằng AC-1. Câu SQL đếm dòng `mau-` trong
  `sale_offer_records` và `stg_zalo_posts` trên DB local bảo đảm bằng AC-8.

## Out of scope

- `eval:classify`, `dq_check_results`, hiển thị số trên `/ops/quality` (PL9, C4) — kể cả việc báo số tập mẫu tách
  khỏi số nhãn người.
- Ghi tập mẫu vào DB (bảng mới cần migration).
- Lát khác OCP1, nguồn khác S03, cặp ghép căn (G3).
- Dạng viết có hai cách hiểu: giá che «5,5x tỷ», «1N+1», «Studio», giá không đơn vị (Hỏi-2).

## Notes

- Câu chờ Mạnh ở Cổng Phạm vi: Hỏi-1 (khuôn trong kho công khai), Hỏi-2 (bỏ dạng viết mơ hồ), Hỏi-3 (tập là hàm
  thuần hay bảng eval riêng) — sổ quyết định.
