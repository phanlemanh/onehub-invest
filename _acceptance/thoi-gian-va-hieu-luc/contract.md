---
schema_version: 1
feature: Mọi phát biểu có thời điểm quan sát; mỗi tin có trạng thái chào được phân xử từ bằng chứng theo thời gian; giá và trạng thái của tin được giữ thành lịch sử gom được theo căn; căn lên B5 khi đang chào, còn trong cửa sổ độ tươi và có lịch sử giá
slug: thoi-gian-va-hieu-luc
owner: phanlemanh@gmail.com
risk_tier: T3      # db/migrations/** (t3_paths) — migration 059
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-thoi-gian-va-hieu-luc-design.md
---

# Acceptance Contract: thoi-gian-va-hieu-luc

## Context

Hàng PL19 (mã review C2.8, lỗi L18, review §0.2 D-4), đứng trên PL15 (phát biểu + phân xử, 045) và PL16 (hàm bậc,
056 — nhánh xếp chồng lên PR #202). Đo ngày 30/10 trên DB máy thu: 50.278 phát biểu `legacy` thiếu `observed_at`
(mọi phát biểu khác đã có); không có cột trạng thái chào; `properties.price_history` không bộ ghi nào giữ; 21.851/27.733
tin S06 sống có `last_seen` quá 3 ngày. Khung: `reso-khung-phan-loai.md` §6.

Căn cứ: RV-C2.8 · RV-L18 · FR-§3.4 (B5) · RESO-§6.

## Criteria

- AC-1: Given DB sau 059, When đếm phát biểu sống thiếu `observed_at` và thử chèn một phát biểu không có `observed_at`,
  Then đếm bằng 0, phát biểu `legacy` mang `observed_at = least(last_seen của tin, created_at của phát biểu)` (tin không
  còn → `created_at`), và lệnh chèn bị CHECK/NOT NULL từ chối.
- AC-2: Given ba bộ ghi phát biểu — bộ đọc tin (`lib/assert.mjs`), áp đề xuất làm giàu (`apply_enrichment`), bước chuyển
  giá trị có trước (`phat-bieu-cat-chuyen.mjs`) — When mỗi bộ ghi một phát biểu mà nguồn không cho thời điểm đăng,
  Then phát biểu có `observed_at` khác rỗng: bộ đọc lấy lúc đọc, áp đề xuất lấy lúc tạo đề xuất, bước chuyển theo luật
  điền lùi của AC-1.
- AC-3: Given 059, When đọc lược đồ và chạy `vocab.mjs --check-db`, Then `sale_offers` có cột `offer_status` (mặc định
  `unknown`, CHECK đúng năm giá trị trục `offer_status`), `field_assertions.field` theo trục mới `assertion_field` (năm
  trường enrich + `offer_status`), `enrichment_proposals.field` vẫn theo `enrich_field`, và lệnh kiểm DB khớp sổ.
- AC-4: Given tin sống S06, tin sống S03 và S05, tin S06 nghỉ `het_trong_luot`, tin nghỉ `doi_khoa`, When chạy bộ ghi
  bằng chứng hai lần, Then tin S06 sống có phát biểu `active` lớp `fact` phương pháp `source_field`; tin S03/S05 sống có
  `active` lớp `observed` phương pháp `parser`, mọi `active` mang `observed_at` = `last_seen` của tin (không phải giờ
  chạy); tin `het_trong_luot` có `withdrawn` lớp `fact` với `observed_at` = lúc nghỉ; tin `doi_khoa` không có `withdrawn`;
  lần hai không thêm phát biểu nào; đầu–cuối: tin sống → ghi + phân xử → nghỉ `het_trong_luot` → chạy lại ra
  `withdrawn` → quay lại ra `active`.
- AC-5: Given một tin có `active` quan sát lúc t1 và `withdrawn` lúc t2 > t1, rồi tin xuất hiện lại lúc t3 > t2, When
  phân xử sau mỗi bước, Then trạng thái lần lượt là `withdrawn` rồi `active` (phát biểu `active` cũ bị rút có lý do và
  một phát biểu mới lúc t3 được ghi); hai phát biểu khác giá trị cùng thời điểm thì theo thứ tự phương pháp của 045; một
  phát biểu lớp `observed` mới hơn và một phát biểu lớp `fact` cũ hơn phân xử theo lối Hỏi-4 chọn; tin chỉ quá cửa sổ
  độ tươi, không có bằng chứng mới, giữ nguyên trạng thái (Hỏi-1).
- AC-6: Given một tin mới, một tin đổi giá, một tin đổi trạng thái và các tin có sẵn trước 059, When ghi qua
  `sale_offer_records`, Then lịch sử có `NewListing` cho tin mới, `PriceChange` mang giá cũ và giá mới, dòng đổi trạng
  thái theo bảng §6 (`Withdrawn`, `BackOnMarket`), mỗi tin có sẵn đúng một `NewListing` điền lùi, ghi lại cùng giá không
  sinh dòng, và lịch sử gom theo căn trả các dòng của mọi tin gắn căn ấy theo thời gian.
- AC-7: Given căn B4 có tin `active` còn trong cửa sổ độ tươi và có lịch sử giá theo định nghĩa Hỏi-3, căn B4 cùng điều
  kiện nhưng `last_seen` quá cửa sổ, căn B4 có tin `withdrawn`, căn B4 thiếu lịch sử giá theo định nghĩa Hỏi-3, căn hai
  tin (một tin đạt, một tin `withdrawn`), căn hai tin (một tin đạt, một tin quá cửa sổ), When gọi `property_data_level`
  rồi chụp phân bố (`bac-du-lieu`) trước và sau khi đẩy `last_seen` của căn đầu quá cửa sổ, Then căn đầu là B5 với chỗ
  kẹt `giu-nhip`, ba căn sau là B4 với chỗ kẹt `hieu-luc`, hai căn hai tin là B5 (căn lấy tin tốt nhất, như PL16); ảnh
  chụp sau có B5 giảm một và B4 tăng một; mọi ca của AC-1…AC-4 PL16 vẫn trả như cũ.
- AC-8: Given bản chép DB máy thu, When chạy `node pipeline/trang-thai-chao.mjs` hai lần, Then lệnh thoát 0, in đếm tin
  theo năm trạng thái với tổng bằng số tin; mọi tin sống có trạng thái khác `unknown` hoặc nằm trong danh sách nguồn
  không có bằng chứng đã in; lần hai in «0 phát biểu mới» và cùng đếm; lỗi chạy (DB không tới được) làm lệnh thoát khác 0.
- AC-9: Given cây sau vòng, When chạy `scripts/cloud-sync.sh` trong hộp thử job-exit và áp 059 hai lần, Then bước
  `trang-thai-chao` đứng ngay trước `bac-du-lieu`, hỏng thì job thoát khác 0 với dòng `JOB FAIL [cloud-sync] bước
  trang-thai-chao`; 059 chạy hai lần không lỗi, không nhân dòng ở `history_transactional`, `ref_lookup`,
  `ref_field_lookup`; `CONTEXT.md` có thuật ngữ «Trạng thái chào» và «Lịch sử giá»; bộ test pipeline, test app,
  typecheck và lint đều thoát 0.

## Coverage

Quét không gian (preset test-matrix) trên ba trục, thước CE ghi cạnh mỗi trục:
- Bộ ghi × thời điểm: {bộ đọc, áp đề xuất, bước chuyển, bộ ghi bằng chứng} × {nguồn có thời điểm, nguồn không có} — AC-1,
  AC-2, AC-4. [thước CE: danh sách bộ ghi `field_assertions` đo ngày 30/10 — design §1]
- Bằng chứng × trạng thái: {tin còn trên sàn S06, bài nhóm S03/S05, nghỉ vắng lượt, nghỉ đổi khoá, xuất hiện lại, quá
  cửa sổ} × {active, withdrawn, giữ nguyên} — AC-4, AC-5. [thước CE: bảng bằng chứng §6 của khung RESO]
- Đường ra: phát biểu → phân xử → lịch sử → bậc B5 → nhịp chạy — AC-5…AC-9. [thước CE: thành phần 1–3 của design §2]

Ô bị cắt có lý do ở Out of scope. `active_under_contract` và `closed` có trong trục và trong bảng lịch sử, nhưng vòng này
không có bộ ghi bằng chứng cho chúng (bộ đọc chữ «đã bán/đã cọc» là việc của làn đọc tin).

## Out of scope

- Bộ đọc «đã bán / đã cọc» trong chữ tin S03 — làn P1 (`transform-zalo.mjs` không được chạm).
- Hiện trạng thái chào và lịch sử giá trên giao diện Invest hay `/ops`.
- Đưa `offer_status` và lịch sử lên cloud (migration Supabase + leak gate).
- Cửa sổ độ tươi theo từng nguồn (một hằng cho mọi nguồn ở vòng này — Hỏi-2).
- `ClosePrice`, `PreviousListPrice` trên tin.
- Dọn cột cũ `properties.price_history` (031).
- Thêm giá trị «hết hạn» vào trục `offer_status` (Hỏi-1, khung §6).

## Đường đo

- Ngưỡng SỐNG nguyên văn «Tin quá cửa sổ hiệu lực tự về hết hạn; căn tụt B5 về B4»: vế «căn tụt B5 về B4» đo bằng ca
  AC-7 (căn quá cửa sổ về B4 `hieu-luc`, ảnh chụp phân bố thấy B5 giảm, B4 tăng) và ảnh chụp mỗi lượt cloud-sync đọc
  bậc sau bước `trang-thai-chao` (AC-9). Vế «tự về hết hạn» phụ thuộc Hỏi-1: theo khuyến nghị thì được thay bằng «trạng
  thái giữ nguyên» và ngưỡng ở `opportunity.md` sửa theo lựa chọn trước khi ký.
- «Mọi phát biểu có observed_at»: ràng buộc NOT NULL (AC-1) — không còn đường ghi thiếu.

## Notes
