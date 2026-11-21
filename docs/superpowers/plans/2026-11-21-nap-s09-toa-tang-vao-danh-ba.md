# Kế hoạch — nap-s09-toa-tang-vao-danh-ba (DA42)

Hồ sơ `_acceptance/nap-s09-toa-tang-vao-danh-ba/` (T3, Cổng Phạm vi Mạnh duyệt 18/11, sửa phạm vi «Chỉ làm cao tầng» 19/11,
thêm AC-11 19/11). Thiết kế: `docs/superpowers/specs/2026-11-18-nap-s09-toa-tang-vao-danh-ba-design.md`. Kế hoạch này chờ
**Cổng 1.5** (Mạnh duyệt) trước khi viết mã.

## 1. Bảng phủ ca — đo lại ngày 21/11 trên DB máy thu và snapshot gói 1 thật

Bản thu gói 1: `vn__s09-danh-ba__2026-11-19T004959637` (1.462 item: danh mục 1, `toa` 221, `tang` 928, `khu-thap-tang` 221,
`can-thap-tang` 91; 0 lỗi, `meta.so*` khớp độ dài `data` ở mọi item). Ba bản thu khác của nguồn chỉ có `can-thap-tang` (bản
19/11 21:18 là lượt hỏng, không nạp) nên ngoài phạm vi cao tầng. Lệnh đo: tệp nháp chỉ đọc, in số, không in tên.

| # | Chiều | Giá trị | Số | Xử lý | Ai đọc đầu ra |
|---|---|---|---:|---|---|
| 1 | Dự án gói 1 | Tổng / có toà / 0 toà | 221 / 198 / 23 | Đi bốn đường; dự án 0 toà vẫn đi đường dự án, 0 toà | `/ops/registry`, DA43 |
| 2 | Dự án | Đã nối (`NOI_KHU_S09`) | 2 | Giữ nối, đi tiếp toà | `/ops/registry`, DA43 |
| 3 | Dự án | Trùng tên đúng một nút (chuẩn `chuanKhop`) | 13 (6 nút `xac_minh`, 7 nút `mot_loi_khai` của S06) | Một thẻ luật theo nguồn S09, chưa nối khi chưa duyệt | Mạnh, rồi DA43 |
| 4 | Dự án | Trùng tên từ hai nút | 0 | Thẻ từng cặp (ca giữ cho ma trận E3) | Người duyệt |
| 5 | Dự án | Tên gần giống (bỏ dấu, chứa nhau, ≥8 ký tự) | 36 | Thẻ từng cặp, chưa nối | Người duyệt |
| 6 | Dự án | Không khớp | 170 | Nút ứng viên `mot_loi_khai` (Hỏi-2) | `/ops/registry`, DA43 |
| 7 | Toà | Tổng / theo đường dự án: đã nối · trùng một · gần giống · không khớp | 928 / 112 · 100 · 147 · 569 | Toà của dự án chưa nối chờ; toà của nút ứng viên tạo mới | `/ops/registry`, DA43 |
| 8 | Toà | Trùng tên trong cùng dự án | 8 dòng (2 ở dự án nối hoặc trùng một) | Thẻ, 0 toà | Người duyệt |
| 9 | Toà (dự án nối hoặc trùng một, 212) | Khớp một / khớp hai / không khớp | 139 / 0 / 71 | Bí danh / thẻ / toà `mot_loi_khai` | DA43 |
| 10 | Toà khớp một | Có S16 | 137 (4 không có tầng để so) | Luật AC-5 | DA43, khử trùng |
| 11 | Toà có S16 | Số tầng S09 − số tầng có căn > 2 | 22, **cả 22 đều S09 nhiều hơn** (3–8 tầng) | Xem Câu hỏi Q1 | Người duyệt |
| 12 | Toà có S16 | Mọi tầng có căn nằm trong danh sách tầng S09 | 104 trọn, 29 thiếu 1–4 tên tầng | Tín hiệu phụ, đo ở T2 | — |
| 13 | Toà mang mã cũ S09 | Tổng / có căn hoặc S16 / không căn, không S16 | 175 / 110 / 65 (cùng dự án đã nối) | 109 trong 110 nhận mã mới; 65 là toà gom không có trong danh sách toà gói 1 | DA43; xem Q2 |
| 14 | Tầng | Tổng / tên có chữ («12B») / trùng tên trong toà / toà 0 tầng | 23.708 / 980 / 0 / 5 | View tầng, một dòng mỗi mã | DA43 |
| 15 | Danh bạ | Dự án / toà / căn | 344 (20 `xac_minh`, 324 `mot_loi_khai`) / 307 / 111.668 | Không đổi cột gốc toà, căn có sẵn | `/ops/registry` |

**Ngoài phạm vi, vì:** `khu-thap-tang`, `can-thap-tang` và ba bản thu bù (Mạnh 19/11, DA50) · căn cao tầng (DA43) · nối tin
vào nút ứng viên · thuộc tính căn.

## 2. Cách làm (chốt ở S2)

- **Đường nạp.** Bộ nạp `pipeline/import-s09-danh-ba.mjs` là của ZCode (đang viết ở worktree ZCode, chưa lên nhánh). DA42 viết
  migration 115 đúng bảng GS chốt 20/11 18:38Z. E1 gọi hàm của bộ nạp đó với fixture rút từ snapshot thật (đã thay tên).
- **Dự án** dùng lại hạ tầng của DA32 (migration 100): `project_links` (source `S09`, mã dự án nguồn), `project_link_rules`
  cho thẻ luật theo nguồn, `review_queue entity_match` cho thẻ từng cặp. Nút ứng viên là `asset_nodes` project `mot_loi_khai`,
  bí danh `node:<id>` `ma_nguon` = `danh-ba/<du_an_id>`. Ca trùng tên một nút `mot_loi_khai` của S06 vẫn đi thẻ luật, không
  đúc nút thứ hai (AC-11).
- **Nút ứng viên không lên Invest**: không nối tin nên không có trang Invest nào đọc nó (giống 324 nút ứng viên S06). `asset_nodes`
  vẫn đồng bộ cloud, theo ROADMAP §3 mục 38 (thông tin dự án là công khai). E9 kiểm 0 tin trỏ nút ứng viên S09.
- **Toà**: so tên bằng `khoaTenS09` trong các toà của nút dự án (cùng câu với DA31). Bí danh mới `ma_nguon` =
  `danh-ba/<toa_id>`, namespace riêng nên 0 mã trỏ hai toà. Mã cũ `<pid>/<block_id>` nối qua (dự án, tên toà). Toà mới gắn
  vào nút dự án (gói 1 không có phân khu), bậc `mot_loi_khai`. Số tầng của toà S09 = số dòng `tang`.
- **Thứ tự nguồn (AC-8)**: bước S09 gói 1 chạy sau bước S09 cũ và trước S16. Bước S16 tra bí danh `danh-ba/…` trước khi đúc toà.
- **Lệnh đếm** `pipeline/scripts/danh-ba-s09-toa-that.mjs --dem` chỉ đọc, không import `pipeline/lib/s09*`.

## 3. Task (tuần tự, cùng giao dịch dựng)

| Task | Tệp | Lệnh kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|
| T1 Migration 115: bảng `stg_s09_danh_ba` (cột, PK, FK đúng bản GS), index `(snapshot_id, kind, source_id)`, view `v_s09_db_toa`, `v_s09_db_tang` (bản thu mới nhất mỗi `source_id`, trải `data[]`) | `db/migrations/115_stg_s09_danh_ba.sql` | áp hai lần trên DB thử, `\d` không đổi | E1, E6 | false |
| T2 Hàm thuần: đọc dự án, toà, tầng từ dòng view; xếp dự án bốn đường; xét toà (khớp một, hai, trùng tên, mã cũ, luật S16) | `pipeline/lib/s09-danh-ba-can.mjs` + `.test.mjs` | `node --test pipeline/lib/s09-danh-ba-can.test.mjs` | E3–E6 | false |
| T3 Bước dựng `buocS09DanhBa` gọi trong `dung()`; S16 tra bí danh S09 mới | `pipeline/lib/s09-dung.mjs`, `pipeline/danh-ba-vat-the.mjs`, `pipeline/lib/s16-dung.mjs` (xem G2) | `config:executors.script.s09_toa_db` | E3–E5, E8 | false |
| T4 Itest trên DB thử của lượt, fixture rút từ snapshot thật, mỗi ca có đột biến đỏ đúng tên | `pipeline/scripts/danh-ba-s09-toa.itest.mjs`, `pipeline/tests/fixtures/s09-danh-ba/` | `config:executors.script.s09_toa_db` | E1, E3–E6, E8, E9 | false |
| T5 Lệnh đếm và lượt đo thật trên DB thử chép máy thu: manifest, phép cộng phần, bốn ngưỡng, `timNutTrungNoi` | `pipeline/scripts/danh-ba-s09-toa-that.mjs` | `config:executors.script.s09_toa_that` | E2, E10, E12 | false |
| T6 Soát ranh giới: không tên thật, danh sách đẩy cloud, nút ứng viên 0 tin | trong T4 | như T4 | E9 | false |
| T7 Ảnh `/ops/registry` trên DB của E10 | `_acceptance/…/evidence/` | ui-check | E11 | false |

Mỗi task: viết test đỏ trước, rồi mã, rồi commit. S4 xin lượt `s4` của đợt.

## 4. Cần quyết trước khi viết mã

**Mạnh (Cổng 1.5)**

- **Q1 — Tín hiệu số tầng của AC-5.** Đo thật: 22 trong 137 toà khớp tên với S16 lệch quá 2 tầng, và cả 22 đều là S09 có
  NHIỀU tầng hơn số tầng đang có căn (3–8 tầng: tầng đế, tầng kỹ thuật không bán căn). Giữ luật «lệch quá 2» thì 22 toà đó ra
  thẻ (16% toà có S16), vượt trần chờ thẻ 10% của AC-10. **Khuyến nghị:** chỉ coi là lệch khi S09 ÍT hơn số tầng có căn của S16
  quá 2, hoặc có tầng có căn S16 không nằm trong danh sách tầng S09 sau khi chuẩn tên tầng. Đổi câu chữ AC-5 và E5 cho khớp.
- **Q2 — Mẫu số của ngưỡng «≥99% trong 175 toà mã cũ».** 65 trong 175 toà mang mã cũ là toà gom không có căn, không có S16 và
  không có trong danh sách toà gói 1 (thuộc phần thấp tầng). Đo thật: 109 trong 110 toà còn lại nhận mã mới (99,1%).
  **Khuyến nghị:** mẫu số là 110 toà mã cũ có căn hoặc có S16; 65 toà gom đếm riêng, chuyển DA50.

**Giám sát (không cần Mạnh)**

- **G1** — `_acceptance/config.yaml` chưa có hai khoá `script.s09_toa_db`, `script.s09_toa_that` mà evals đang trỏ. Tệp này
  ngoài vùng P1: xin anh thêm, hoặc cho phép P1 thêm đúng hai dòng.
- **G2** — T3 chạm `pipeline/lib/s16-dung.mjs` (tra bí danh S09 mới trước khi đúc toà S16, chiều đỏ của E8), ngoài vùng hàng đã
  ghi. Xin nới vùng.
- **G3** — S3 cần bộ nạp `pipeline/import-s09-danh-ba.mjs` của ZCode lên `main`. Có thể làm T1–T3 trước; E1 chờ bộ nạp.
