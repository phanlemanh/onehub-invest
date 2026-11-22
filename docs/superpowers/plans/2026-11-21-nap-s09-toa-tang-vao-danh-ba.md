# Kế hoạch — nap-s09-toa-tang-vao-danh-ba (DA42)

Hồ sơ `_acceptance/nap-s09-toa-tang-vao-danh-ba/` (T3, Cổng Phạm vi Mạnh duyệt 18/11, sửa phạm vi «Chỉ làm cao tầng» 19/11,
thêm AC-11 19/11). Thiết kế: `docs/superpowers/specs/2026-11-18-nap-s09-toa-tang-vao-danh-ba-design.md`. Kế hoạch này chờ
**Cổng 1.5** (Mạnh duyệt) trước khi viết mã.

## 0. Trạng thái trước cổng

- **T1–T3 đã viết trước cổng theo lời GS, chưa chạy itest, chưa gộp, chưa áp** (nhánh `feat/nap-s09-toa-tang-vao-danh-ba`
  @43b2fe114, chưa đẩy). Mạnh sửa kế hoạch thì phần đã viết làm lại theo kế hoạch mới.
- **Ghi dữ liệu hằng đêm lên DB máy thu:** sau khi áp 115 + 125, MỌI lượt dựng danh bạ, kể cả bước đêm `buocVatTheDem`, sẽ đúc
  nút ứng viên S09 và toà S09 trên DB máy thu. Hồ sơ áp ghi số chạy thử trên bản chép (bao nhiêu nút, toà, thẻ chờ), cách tắt và
  cách lùi (T8).
- **Không áp 115/125 lên DB máy thu trong ngày thứ Hai 23/11** (chuyển máy thu). DA42 áp ở máy mới sau khi kiểm chuyển máy xanh;
  số chạy thử dựng lại ngay trước khi áp, vì danh bạ đổi giữa chừng (DA51 đã áp 21/11; DA53 gộp nút Grand Park chờ áp sau PL20).

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
  bí danh `node:<id>` `ma_nguon` = `danh-ba-du-an/<du_an_id>`. Ca trùng tên một nút `mot_loi_khai` của S06 vẫn đi thẻ luật, không
  đúc nút thứ hai (AC-11).
- **Nút ứng viên không lên Invest**: không nối tin nên không có trang Invest nào đọc nó (giống 324 nút ứng viên S06). `asset_nodes`
  vẫn đồng bộ cloud, theo ROADMAP §3 mục 38 (thông tin dự án là công khai). E9 kiểm 0 tin trỏ nút ứng viên S09.
- **Toà**: so tên bằng `khoaTenS09` trong các toà của nút dự án (cùng câu với DA31). Bí danh mới `ma_nguon` =
  `danh-ba-toa/<toa_id>`, namespace riêng nên 0 mã trỏ hai toà. Mã cũ `<pid>/<block_id>` nối qua (dự án, tên toà). Toà mới gắn
  vào nút dự án (gói 1 không có phân khu), bậc `mot_loi_khai`. Số tầng của toà S09 = số dòng `tang`.
- **Thứ tự nguồn (AC-8)**: bước S09 gói 1 chạy sau bước S09 cũ và trước S16. Bước S16 tra bí danh `danh-ba-toa/…` trước khi gắn toà: lệch tầng thì thẻ mã chung, toà S16 đúc riêng.
- **Lệnh đếm** `pipeline/scripts/danh-ba-s09-toa-that.mjs --dem` chỉ đọc, không import `pipeline/lib/s09*`.
- **Thang nấc 0–4 (ROADMAP §3 mục 61) không áp**: bước đúc nút và toà của DA42 là luật xác định, không có LLM — đúng vế «luật
  xác định» của luật 7. Thang nấc nói về việc giao cho máy phán đoán của người (nhãn, duyệt) có model.
- **Thẻ luật ghi loại căn cứ** (19/11 mục 2, «duyệt theo loại căn cứ»): thẻ vẫn mở theo nguồn S09 (ngưỡng tự áp theo loại căn cứ
  còn là câu mở), nhưng ghi rõ loại căn cứ «trùng tên chuẩn hoá đúng một nút» để lần duyệt này tính là duyệt loại căn cứ ấy.
- **Gộp khác áp — lượt dựng đêm khi 115/125 chưa áp**: launchd chạy mã từ main, nên sau khi PR gộp mà DB máy thu chưa có view
  của 115/125 thì `buocS09DanhBa` **bỏ bước, ghi một dòng log, trả mã 0**; các bước khác của lượt dựng chạy như cũ. Có ca test:
  DB thiếu view → lượt dựng xong, 0 dòng S09, có dòng log; đột biến bỏ rào → ca đỏ (lượt dựng ném lỗi).
- **Kind liệt kê dương** (giám sát 22/11, sau khi Mạnh mở thu S09 ngoài Hà Nội và quỹ căn có giá — nạp chung `stg_s09_danh_ba`
  với kind mới): DA42 chỉ đọc ba kind gói 1 (`KIND_GOI_1` trong `s09-danh-ba-can.mjs`). View toà, tầng của 115 đã lọc bằng đẳng
  thức; 125 ghim thêm `source_id = 'danh-muc'` cho danh mục (đo 22/11: bản thu 19/11 có đúng một item danh-muc, source_id
  `danh-muc`); bước dựng chỉ đọc toà của dự án có trong danh mục gói 1. Ca test trong T4: chèn dòng kind lạ (và danh mục cùng
  kind khác source_id) → ba view và kết quả bước dựng không đổi, kèm chiều đỏ ngay trên cùng dữ liệu (lọc loại trừ, danh mục
  không ghim thì lọt). Dự án ngoài Hà Nội và căn quỹ căn là phạm vi hàng sau (DA43/DA50), không vào DA42.

## 3. Task (tuần tự, cùng giao dịch dựng)

| Task | Tệp | Lệnh kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|
| T1 Migration 115: bảng `stg_s09_danh_ba` (cột, PK, FK đúng bản GS), index `(snapshot_id, kind, source_id)`, view `v_s09_db_toa`, `v_s09_db_tang` (bản thu mới nhất mỗi `source_id`, trải `data[]`) | `db/migrations/115_stg_s09_danh_ba.sql` | áp hai lần trên DB thử, `\d` không đổi | E1, E6 | false |
| T1b Migration 125 sửa cột `ma_tinh` của `v_s09_db_du_an` (115 đọc `province.code`, bản thu thật ghi `province_code`; 115 đã commit nên không sửa) | `db/migrations/125_v_s09_db_du_an_ma_tinh.sql` | ca T1: `ma_tinh` khác rỗng trên gói 1 thật, đỏ khi chỉ áp 115 | E1, E10 | false |
| T2 Hàm thuần: đọc dự án, toà, tầng từ dòng view; xếp dự án bốn đường; xét toà (khớp một, hai, trùng tên, mã cũ, luật S16) | `pipeline/lib/s09-danh-ba-can.mjs` + `.test.mjs` | `node --test pipeline/lib/s09-danh-ba-can.test.mjs` | E3–E6 | false |
| T3 Bước dựng `buocS09DanhBa` gọi trong `dung()`; S16 tra bí danh S09 mới | `pipeline/lib/s09-dung.mjs`, `pipeline/danh-ba-vat-the.mjs`, `pipeline/lib/s16-dung.mjs` (xem G2) | `config:executors.script.s09_toa_db` | E3–E5, E8 | false |
| T3b Rào «view chưa có thì bỏ bước» trong `buocS09DanhBa`, kèm ca test hai chiều (§2) | `pipeline/lib/s09-dung.mjs` | trong T4 | gộp khác áp | false |
| T4 Itest trên DB thử của lượt, fixture rút từ snapshot thật, mỗi ca có đột biến đỏ đúng tên | `pipeline/scripts/danh-ba-s09-toa.itest.mjs`, `pipeline/tests/fixtures/s09-danh-ba/` | `config:executors.script.s09_toa_db` | E1, E3–E6, E8, E9 | false |
| T5 Lệnh đếm và lượt đo thật trên DB thử chép máy thu: manifest, phép cộng phần, bốn ngưỡng, `timNutTrungNoi` | `pipeline/scripts/danh-ba-s09-toa-that.mjs` | `config:executors.script.s09_toa_that` | E2, E10, E12 | false |
| T6 Soát ranh giới: không tên thật, danh sách đẩy cloud, nút ứng viên 0 tin | trong T4 | như T4 | E9 | false |
| T7 Ảnh `/ops/registry` trên DB của E10 | `_acceptance/…/evidence/` | ui-check | E11 | false |

| T8 Hồ sơ áp năm thứ (lệnh áp 115 + 125, số chạy thử trên bản chép, sao lưu trước, cách lùi, lệnh kiểm sau), kèm câu ghi dữ liệu hằng đêm ở §0 và cách tắt bước S09 gói 1. Thứ tự áp: áp 115 + 125 → làn thu nạp gói 1 vào `stg_s09_danh_ba` trên DB máy thu (ghi `stg_*` là việc ZCode, giao qua liên làn, `--may-thu`) → lượt dựng đầu → lệnh kiểm sau. Áp ở máy thu mới, không trong ngày 23/11; số chạy thử dựng lại ngay trước khi áp | `_acceptance/…/` | soát tay | Cổng Bằng chứng | false |

**Soát tầng A sau NK1:** NK1 (migration 122) đưa tên thật của S09 vào sổ nguồn. Khi NK1 đã áp, chạy lại phép soát E9 trên nhánh
DA42 — lúc đó bộ soát mới biết tên S09, nên fixture rút từ bản thu và tên miền trong bản thu là chỗ dễ lộ nhất.

**Known limit đã biết trước:** 11 dự án gói 1 mang mã tỉnh cũ 74, 77 (trước sáp nhập) không có trong `iso_regions` nên toà của
chúng không đúc được; bước dựng đếm riêng `khong_iso`. Hồ sơ ghi danh sách mã dự án và số toà bị bỏ. Bảng đổi mã tỉnh cũ → mới là
một hàng riêng (P1 cắt), không làm trong DA42.

Mỗi task: viết test đỏ trước, rồi mã, rồi commit. S4 xin lượt `s4` của đợt.

### T8 — nháp hồ sơ áp năm thứ (22/11, giám sát bảo chép vào đây; DA56 tách phần nạp đã bị gỡ, phần nạp ở lại DA42)

1. **Lệnh áp**: 115 rồi 125, mỗi tệp hai lần (lần hai chứng idempotent), `psql -v ON_ERROR_STOP=1`. Áp ở máy thu mới sau khi lượt
   kiểm chuyển máy xanh, không trong ngày 23/11.
2. **Số chạy thử**: trên DB thử chép máy thu — `\d stg_s09_danh_ba` và định nghĩa bốn view giống nhau giữa lần áp một và hai; rồi
   nạp ba bản thu hợp lệ bằng bộ nạp, đếm như mục 5. Dựng lại ngay trước khi áp.
3. **Sao lưu trước**: không có dữ liệu cũ để sao lưu — bảng và view đều mới. Ghi bằng chứng trước áp:
   `SELECT to_regclass('public.stg_s09_danh_ba'), to_regclass('public.v_s09_db_item_moi'), to_regclass('public.v_s09_db_du_an'),
   to_regclass('public.v_s09_db_toa'), to_regclass('public.v_s09_db_tang')` trả toàn rỗng.
4. **Nạp**: ZCode nạp qua liên làn, `pipeline/import-s09-danh-ba.mjs <thư mục> --may-thu`, gọi ĐÍCH DANH ba bản:
   `vn__s09-danh-ba__2026-11-19T004959637`, `…2026-11-20T015947402`, `…2026-11-20T052953464`. KHÔNG nạp
   `2026-11-19T211829028`: ZCode khai đó là lượt hỏng «không nạp» (LL báo 22/11). Manifest của nó không ghi `error`, nên bộ nạp KHÔNG
   tự từ chối — đối chiếu 22/11 bằng chính hàm đọc của bộ nạp (`docSnapshot`, không DB): băm khớp, 4 item `can-thap-tang` mã 200,
   cùng một khu, trang 105 và 411 căn lặp hai lần. Lỡ nạp thì số căn không sai (transform hợp theo `data[].id`) và DA42 không đọc
   kind `can-thap-tang`, nhưng lệnh kiểm mục 5 sẽ lệch 4 dòng — dừng và báo, không sửa cho khớp.
5. **Lệnh kiểm sau** (đếm theo kind khớp manifest, `SELECT snapshot_id, kind, count(*) FROM stg_s09_danh_ba GROUP BY 1, 2`):

   | Bản thu | danh-muc | toa | khu-thap-tang | tang | can-thap-tang | Tổng = `counts.items` |
   |---|---|---|---|---|---|---|
   | 2026-11-19T004959637 | 1 | 221 | 221 | 928 | 91 | 1.462 |
   | 2026-11-19T211829028 — KHÔNG nạp | 0 | 0 | 0 | 0 | 0 | 0 (bản thu có 4) |
   | 2026-11-20T015947402 | 0 | 0 | 0 | 0 | 2.868 | 2.868 |
   | 2026-11-20T052953464 | 0 | 0 | 0 | 0 | 2.621 | 2.621 |

   Tổng 6.951 dòng (= 1.462 + 2.868 + 2.621). Chạy bộ nạp lần hai: 0 dòng mới.
   Thêm một dòng kiểm: `SELECT count(*) FROM stg_s09_danh_ba WHERE snapshot_id = 'vn__s09-danh-ba__2026-11-19T211829028'` phải
   bằng 0; khác 0 thì dừng, báo giám sát. Lượt dựng đêm sau áp + nạp nhưng TRƯỚC khi mã DA42 vào main: không đổi (chưa
   mã nào trên main đọc bảng này). Sau khi DA42 vào main: lượt dựng đầu theo lệnh kiểm của AC-10.
6. **Cách lùi**: `DROP VIEW v_s09_db_tang, v_s09_db_toa, v_s09_db_du_an, v_s09_db_item_moi; DROP TABLE stg_s09_danh_ba;` — là XOÁ
   dữ liệu stg (nạp lại được từ raw bất biến), nên cần lời riêng của Mạnh khi dùng. Lùi riêng bước dựng S09 gói 1: xem cách tắt ở §0.

## 4. Cần quyết trước khi viết mã

**Mạnh (Cổng 1.5)**

- **Q1 — Tín hiệu số tầng của AC-5.** Đo thật 21–22/11 trên 137 toà khớp tên có S16:
  - Luật cũ «lệch quá 2 tầng» bắt 22 toà (16%), **cả 22 đều là S09 nhiều tầng hơn** (3–8 tầng đế, kỹ thuật không bán căn) —
    vượt trần thẻ chờ 10% của AC-10.
  - Vế một của khuyến nghị (S09 **ít** hơn số tầng có căn của S16 quá 2): **0 toà**.
  - Vế hai (S16 có căn ở tầng mà S09 không kê): 29 toà nếu so nguyên tên tầng. 24 trong 29 chỉ thiếu **tầng 1** — S09 kê từ
    tầng 2, S16 có căn tầng 1 (ki-ốt, shophouse). Không so tầng 1 thì còn 5 toà: 2 toà thiếu một tầng (tầng 2; tầng 27), 1 toà
    thiếu hai tầng (13, 14), 2 toà thiếu bốn tầng (4, 7, 13, 14 — S09 đặt tên tầng kiểu 5A, 8A, tránh số).

  | Lối | Toà ra thẻ / 137 |
  |---|---:|
  | Luật cũ (lệch quá 2, hai chiều) | 22 (16%) |
  | (i) Vế một ra thẻ; vế hai chỉ đếm, không thẻ | 0 |
  | (ii) Vế một + vế hai ra thẻ khi thiếu ≥ 1 tầng (không so tầng 1) | 5 (3,6%) |
  | (ii) … khi thiếu ≥ 2 tầng | 3 (2,2%) |
  | (ii) … khi thiếu ≥ 3 tầng | 2 (1,5%) |
  | (ii) … thiếu ≥ 1 tầng, so cả tầng 1 | 29 (21%) |

  **Khuyến nghị:** (ii) với N = 1, không so tầng 1 — 5 toà lên thẻ, dưới trần 10%, và 5 toà này là đúng những toà đáng người
  nhìn (tên tầng hai nguồn khác hẳn). Đổi câu chữ AC-5 và E5 cho khớp; vế hai chạy sau khi chuẩn tên tầng.
- **Q2 — Mẫu số của ngưỡng «≥99% trong 175 toà mã cũ».** 65 trong 175 toà mang mã cũ là toà gom không có căn, không có S16 và
  không có trong danh sách toà gói 1 (thuộc phần thấp tầng). Đo thật: 109 trong 110 toà còn lại nhận mã mới (99,1%).
  **Khuyến nghị:** mẫu số là 110 toà mã cũ có căn hoặc có S16; 65 toà gom là **một số đếm riêng** trong hồ sơ và lệnh đo
  (không rời mẫu số lặng lẽ), chuyển DA50.

**Giám sát (không cần Mạnh)**

- **G1 (đã xong)** — `_acceptance/config.yaml` chưa có hai khoá `script.s09_toa_db`, `script.s09_toa_that` mà evals đang trỏ. Tệp này
  ngoài vùng P1: xin anh thêm, hoặc cho phép P1 thêm đúng hai dòng.
- **G2 (GS duyệt)** — T3 chạm `pipeline/lib/s16-dung.mjs` (tra bí danh S09 mới trước khi đúc toà S16, chiều đỏ của E8), ngoài vùng hàng đã
  ghi. Xin nới vùng.
- **G3 (GS đã quyết 21/11)** — bộ nạp của làn thu ở `origin/zcode/nap-s09-danh-ba` @c6609cc9b (3 tệp, LL soát đạt, test 9/9). Sau Cổng 1.5,
  P1 `git merge` nhánh đó vào nhánh DA42 (không chép tệp, không sửa mã làn thu; lỗi logic thu thì báo GS trả ZCode), bộ nạp đi
  trong PR và hồ sơ DA42, E1 đo trên gói 1 thật. Hồ sơ ghi dòng xuất xứ: nhánh, sha, người soát (LL), lệnh kiểm.
