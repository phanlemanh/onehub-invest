---
schema_version: 1
feature: Phần danh mục dự án của S07 thu theo giải pháp ZCode, ưu tiên Hà Nội và HCM, và nạp vào stg_* không nhân dòng
slug: thu-danh-muc-s07
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, db]
status: approved
approved_by: Mạnh
approved_at: 2026-11-11
design_doc: docs/superpowers/specs/2026-11-11-thu-danh-muc-s07-design.md
---

# Acceptance Contract: thu-danh-muc-s07

## Context

Raw S07 (nguồn `s07-danh-muc`) đã có 12 snapshot ở `collector/snapshots/vn/` và sẽ tăng theo các lượt thu: trang danh sách
dự án, trang một dự án, sitemap dự án. Chưa có đường nào đưa raw vào DB. Vòng này làm phần **nạp** của hàng DAZ3:

- migration `db/migrations/093_stg_s07.sql` — ba bảng `stg_s07_project_card`, `stg_s07_project`, `stg_s07_sitemap_url`;
- bộ nạp `pipeline/import-s07-danh-muc.mjs` cùng hàm bóc `pipeline/lib/s07-danh-muc.mjs`;
- mục nguồn S07 (schemaVersion 9) trong `collector/docs/DATA-CONTRACT.md`, đặt sau mục v8 của S10 và S11.

Phần **thu** chạy bằng bộ chạy local ở máy thu, không nằm trong PR.

Source input: hàng DAZ3 của `docs/plan/lo-trinh.json`; ô cơ hội `_acceptance/thu-danh-muc-s07/opportunity.md` (Mạnh «build»
11/11); danh sách cột và mục v9 liên làn duyệt 11/11.

## Criteria

- AC-1: Given một lược đồ chưa có bảng `stg_s07_*`, When áp `093_stg_s07.sql` hai lần liên tiếp, Then:
  - có đủ ba bảng, mỗi bảng khoá chính `(snapshot_id, pj_id)` và một chỉ mục `(pj_id, captured_at DESC)`;
  - mỗi bảng có chú thích nói «chỉ máy thu, không sync cloud»; cột `price_range_raw` có chú thích «chỉ nội bộ»;
  - lần áp thứ hai không lỗi và không đổi lược đồ; migration không tạo, sửa hay xoá bảng nào khác.
- AC-2: Given một trang danh sách có thẻ chính và khối «nổi bật», When bộ nạp bóc item `project_list_page`, Then:
  - mỗi thẻ chính thành một dòng `stg_s07_project_card` với mã dự án, trang, vị trí, đường dẫn, loại hình, khu vực, tên,
    trạng thái, địa chỉ nguyên văn, diện tích nguyên văn, số căn, số toà, chủ đầu tư, tóm tắt, ảnh;
  - thời điểm của dòng (`captured_at`) là giờ thu ghi trong item, không phải giờ nạp;
  - thẻ của khối «nổi bật» không thành dòng; thẻ không trỏ tới trang dự án bị bỏ và được đếm;
  - thẻ thiếu cấu hình hay thiếu chủ đầu tư cho `NULL` ở các cột đó, không đoán.
- AC-3: Given một item `project_catalog`, When bộ nạp bóc, Then:
  - một dòng `stg_s07_project` có tên, địa chỉ, breadcrumb, toạ độ, trạng thái và ghi chú trạng thái, mọi cặp thuộc tính theo
    thứ tự nguồn, chủ đầu tư kèm mã, pháp lý, quy mô, khoảng giá, tiện ích, khối mô tả trọn vẹn, câu hỏi thường gặp, album;
  - loại hình và khu vực suy từ đường dẫn của item, không lấy `meta.loaiHinh`;
  - toạ độ `0,0` thành `NULL`; mã dự án trong mô tả và trong khối «dự án liên quan» vào hai mảng riêng, không gồm chính nó;
  - item thiếu nội dung trang hoặc đường dẫn không phải trang dự án không thành dòng và được đếm.
- AC-4: Given một item `project_sitemap`, When bộ nạp bóc, Then mỗi đường dẫn dự án thành một dòng `stg_s07_sitemap_url`;
  trang lọc và đường dẫn lặp không thành dòng.
- AC-5: Given DB đã có 093, When nạp cùng một snapshot hai lần, rồi nạp một snapshot mới chứa lại một dự án cũ, rồi nạp cả
  thư mục cha, Then:
  - lần nạp thứ hai của cùng snapshot ghi 0 dòng ở cả ba bảng;
  - dự án có mặt ở hai snapshot có hai dòng, mỗi snapshot một dòng;
  - nạp theo thư mục cha chỉ đọc snapshot S07 chưa có dấu và bỏ qua snapshot của nguồn khác;
  - mỗi snapshot đã nạp có đúng một dòng dấu ở `airbnb_snapshots`;
  - đọc lại từ DB, từng cột của một dòng mỗi bảng bằng đúng giá trị bộ bóc trả cho item đó (thứ tự các cặp thuộc tính, mảng
    mã dự án là mảng số, toạ độ rỗng là `NULL`);
  - nạp hai snapshot theo thứ tự cũ trước hay mới trước đều cho cùng nội dung ba bảng.
- AC-6: Given raw mang tên miền của nguồn ở link trang, link ảnh và chữ, When nạp, Then:
  - không dòng nào của ba bảng chứa tên miền đó, và không link nào còn lại trong ba bảng trỏ tới máy chủ mang nhãn của nguồn;
  - link trang thành đường dẫn tương đối, link ảnh thành `s07://<máy con>/<đường dẫn>`, tên miền đứng trần thành «S07»;
  - link ngoài nguồn giữ nguyên;
  - nếu sau khi bóc vẫn còn tên miền trong một dòng, bộ nạp dừng với thông điệp gọi tên bảng và không ghi gì của snapshot đó.
- AC-7: Given snapshot có item thu trong phiên đăng nhập (`meta.sessionLoggedIn` là `true`), hoặc trang danh sách và trang dự
  án thiếu cờ đó (Hỏi-1: không nạp), When nạp, Then item đó không thành dòng và dòng tổng kết in số item bị bỏ; sitemap
  thiếu cờ vẫn được nạp.
- AC-8: Given các tình huống không nạp được, When chạy bộ nạp, Then:
  - DB chưa có đủ ba bảng: in `CHUA-AP-093`, thoát 0, không ghi dấu snapshot;
  - manifest có `schemaVersion` ngoài `{1..9}`: thoát khác 0, gọi tên phiên bản, không ghi;
  - tệp items sai `sha256`: thoát khác 0 với «checksum sai», không ghi;
  - thư mục sai khuôn tên, thiếu manifest hay `manifest.source` khác S07: bỏ qua có dòng báo, không ghi.
- AC-9: Given mọi snapshot S07 thật đang có trên máy thu và DB thử đã áp 093, When nạp cả thư mục rồi nạp lại, Then:
  - số dòng mỗi bảng bằng số đếm độc lập trên raw trừ đi phần bỏ theo từng lý do (phiên đăng nhập hoặc thiếu cờ, lặp trong
    cùng snapshot, trang dự án không có nội dung, thẻ không trỏ tới dự án); từng con số bỏ khớp dòng tổng kết của bộ nạp;
  - 0 item thuộc kind lạ và 0 item lành mà bộ bóc trả rỗng;
  - không dòng stg nào thuộc một item có cờ đăng nhập `true`;
  - lần nạp thứ hai ghi 0 dòng;
  - không dòng stg nào chứa tên miền suy từ raw, và không link nào còn lại trong stg trỏ tới máy chủ mang nhãn của nguồn;
  - không tệp nào của vòng trong kho (migration, bộ nạp, hàm bóc, test, lệnh đo, mục S07 của DATA-CONTRACT) chứa tên miền
    hay nhãn của nguồn;
  - lệnh in số dòng stg còn nhãn của nguồn trong văn bản tự do (con số để người biết, không phải điều kiện).

## Coverage

Quét theo preset ma trận kiểm thử, ba trục; chân sản phẩm là hợp đồng dữ liệu của kho, chân ngành là cách nạp raw → staging
của công cụ tích hợp dữ liệu.

- Trục loại item: trang danh sách · trang dự án · sitemap · kind lạ — `[SUY-TỪ-REPO: collector/docs/DATA-CONTRACT.md]`
  (AC-2, AC-3, AC-4; kind lạ đếm ở AC-9 «0 item không bóc được»).
- Trục trạng thái item: lành · phiên đăng nhập hoặc thiếu cờ · không bóc được · nguồn khác lẫn vào —
  `[SUY-TỪ-REPO: collector/docs/DATA-CONTRACT.md]` (AC-2, AC-3, AC-7; nguồn khác lẫn vào: đếm, không AC riêng).
- Trục trạng thái nạp: chưa áp 093 · nạp lần đầu · nạp lại · snapshot mới cùng dự án · manifest sai phiên bản · checksum
  sai · thư mục không phải snapshot S07 — `[NGÀNH: Airbyte — bảng raw nạp lại không nhân dòng, khử trùng theo khoá]`,
  `[SUY-TỪ-REPO: pipeline/import-airbnb.mjs]` (AC-1, AC-5, AC-8).
- Cắt ngang mọi ô: tên miền nguồn không vào stg (AC-6, AC-9); nạp lại không nhân dòng (AC-5, AC-9).
- Thước CE: bảy luật đọc của mục S07 trong DATA-CONTRACT và 12 snapshot thật (AC-9). `[CE: ngành Airbyte]` cho trục trạng
  thái nạp.
- Later: view «bản mới nhất» và nối danh bạ (DA7); nối lịch chạy đêm; `project_facilities`.
- Never trong vòng: quyết định cha–con (DA11, DA3); `stg_s07_*` lên cloud.

## Đường đo

- «nạp mọi snapshot S07 hiện có ra đủ thẻ, trang dự án, đường dẫn sitemap; nạp lần hai ghi 0 dòng» — lệnh
  `pipeline/scripts/s07-nap-that.mjs` trên DB thử, so với số đếm độc lập trên raw có trừ phần bỏ theo lý do · AC-9, AC-5.
- «không dòng `stg_s07_*` nào chứa tên miền nguồn» — cùng lệnh, soát `row_to_json` của ba bảng · AC-9, AC-6.
- «item thu trong phiên đăng nhập không vào stg» — test nạp trên lược đồ tạm · AC-7; trên raw thật: 0 dòng stg thuộc item cờ
  `true` · AC-9.
- «không đánh dấu snapshot đã nạp khi DB chưa có bảng» — test nạp trên lược đồ tạm · AC-8.

## Out of scope

- Phần thu (bộ chạy local, nhịp, hồ sơ trình duyệt) và tiến độ 608 trang danh sách.
- Áp 093 lên DB máy thu và nối bộ nạp vào lịch chạy đêm: bước sau gộp, cần lời riêng của Mạnh và lời giao triển khai.
- View «bản mới nhất», nối `stg_s07_*` vào danh bạ, quyết định cha–con, chuẩn hoá địa chỉ về xã/phường (DA7, DA3, DA11, PX1).
- Đưa `stg_s07_*` lên cloud; che tên nguồn viết bằng chữ trong mô tả (đường lên cloud phải qua `mask-source-names`).
- Sửa `import-airbnb.mjs`, ALLOWLIST hay `SUPPORTED_SCHEMA_VERSIONS` (thuộc commit S10 của dãy P3).
- Build lại `collector/dist` để manifest ghi `schemaVersion 9`.

## Notes

- Mọi snapshot S07 tới nay mang `schemaVersion 4` trong manifest vì `collector/dist` ở checkout chính chưa nhận số phiên
  bản; cùng hình dạng, bất biến, bộ nạp nhận diện theo `source`.
- AC-9 đo trên snapshot thật chỉ có ở máy thu; CI không có raw nên không chạy được phép đo này.
- Bộ nạp chỉ bỏ tên **miền** (và link tới máy chủ mang nhãn nguồn). Tên nguồn viết bằng chữ trong `description_html`,
  `summary_raw`, `faq` có thể còn ở stg: stg chỉ nằm ở máy thu. Mọi đường đưa các cột này lên cloud phải qua
  `mask-source-names`.
- `attributes` lưu thành mảng các cặp `{label, value}` để giữ thứ tự nguồn (đối tượng jsonb không giữ thứ tự khoá).
- Đếm trên 12 snapshot hiện có (11/11): 38 trang danh sách và 7 trang dự án có cờ `false`, 2 sitemap thiếu cờ, 0 item cờ `true`.
