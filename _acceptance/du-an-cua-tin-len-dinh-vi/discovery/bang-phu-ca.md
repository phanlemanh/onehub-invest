# Bảng phủ ca — nguồn «dự án của tin» và ô Định vị (15/11/2026)

Số đếm trên DB máy thu `oneinvest`, chỉ đọc, lúc 23:45–23:55Z 14/11. Không có fixture viết tay: test của hàng dựng mẫu
từ chính các lớp dưới đây (lấy hình dạng từ DB, không chép giá trị tầng A).

## Ngữ cảnh

- Sản phẩm: onehub-invest — màn Ops «Chất lượng từng chặng» (`app/src/components/ops/data-flow/quality-grid.tsx`), số từ
  `data_flow_snapshot` do `pipeline/sql/600_data_flow.sql` tính. Chân sản phẩm: [SUY-TỪ-REPO: CONTEXT.md mục «Định vị»,
  `db/migrations/087_thang_bac_moi.sql`, `db/migrations/100_ma_du_an_s06_nut.sql`, research-local/dieu-tra-tien-do-cham-1511.md].
- Chân ngành: [NGÀNH: RESO Data Dictionary 2.1 — `SubdivisionName` (tên dự án của tin) là trường của Property, không
  phải của căn; một tin có một dự án]. Định vị cấp dự án = điền được trường này bằng một nút danh bạ có bằng chứng.

## Trục

Năm trục dữ liệu GS giao, gộp lại theo luật ≤ 4 trục cộng một lớp «người đọc phía sau» (cross-cutting).

- **A. Nguồn × đường chứng cứ:** S03 qua `field_assertions` theo bài · S05 qua `field_assertions` theo bài · S06 qua
  `s06_offer_project` (bí danh mã nguồn) · S06 qua `field_assertions` (chưa có). [thước CE: ba nguồn của `src` trong 600]
- **B. Tin × bài × dự án:** 0 bài · 1 bài, 0 dự án · 1 bài, 1 dự án · nhiều bài, 0 dự án · nhiều bài, một phần bài có dự án
  · nhiều bài, mọi bài cùng 1 dự án · nhiều bài, 2 dự án khác nhau · một bài mang 2 dự án · một bài 2 luật cùng nút.
- **C. Trạng thái chứng cứ:** phát biểu sống · đã rút (`retracted_at`) · nút là dự án gốc · nút là con (phân khu, toà) ·
  nút ứng viên (`catalog_tier = mot_loi_khai`).
- **D. Trạng thái tin:** đang rao · hết hạn (`offer_status`) · thôi (`retired_at`, view `sale_offers` đã lọc) · bị thay
  (`superseded_by`) · loại nhà khác căn hộ.

Lớp cross-cutting **E. Người đọc phía sau** áp mọi ô Core: màn chặng (600 → `data_flow_snapshot`) · bậc dữ liệu B2
(`offer_located()` của 087 → `data_level_snapshot`, `do-hang-ngay` báo tụt bậc) · CG9/CG10 xếp hạng giá + `/ops/deals`
(N1 đọc nguồn này) · cloud: `push-ops-facts` (chỉ số đếm) · `sync-cloud` + leak gate.

## Số đếm từng ô

### A × B — S03 (6.102 tin, mọi tin `active`, 0 tin bị thay)

| Ô | Số tin | Căn hộ | Ghi chú |
|---|---|---|---|
| 0 bài | 0 | 0 | không có trong DB; luật vẫn phải cho «không định vị» |
| 1 bài, 0 dự án | 494 | 383 | |
| 1 bài, 1 dự án | **1.189** | 1.038 | |
| nhiều bài, 0 dự án | 674 | 573 | |
| nhiều bài, ≥ 1 bài có 1 dự án | **3.745** | 3.566 | trong đó 1.484 tin chỉ một phần bài có dự án |
| nhiều bài, 2 dự án khác nhau | **0** | — | luật phải có dù hôm nay 0 (Core, xem dưới) |
| một bài mang 2 dự án khác nhau | 0 bài | — | |
| một bài, 2 luật cùng nút | 34 bài | — | `du-an-nhom-mot-du-an` + `du-an-ten-bai`; không được đếm đôi |

Tổng S03 định vị theo luật «có ít nhất một bài mang dự án, và mọi bài mang dự án cùng một dự án gốc» = 1.189 + 3.745 =
**4.934** (cửa sổ all). Cửa sổ 7 ngày: **754** tin.

### A × C — phát biểu `project_node_id`

| Ô | Số |
|---|---|
| sống, `e1_rule` `du-an-nhom-mot-du-an` | 42.551 bài |
| sống, `e2_llm` `du-an-ten-bai` | 53 bài |
| đã rút | **0** (luật vẫn phải lọc `retracted_at IS NULL`) |
| nút là dự án gốc, `xac_minh` | 5 nút, mọi phát biểu |
| nút con (phân khu 31, toà 3 trong danh bạ) | 0 phát biểu; `subzone_node_id` 0 |
| nút ứng viên | 0 hôm nay; sinh ra khi áp thẻ luật S06 |

### A × D — S05, S06

| Ô | Số |
|---|---|
| S05 tin | 30 (1 bài: 14 · nhiều bài: 16), 0 phát biểu dự án |
| S06 căn hộ sống | 31.985 tin, 14.967 có mã dự án nguồn, 1.256 mã khác nhau |
| S06 khác căn hộ sống | 72.661 tin, 2.625 có mã dự án nguồn (617 mã) |
| `s06_offer_project` | **0 dòng** (bí danh `ma_nguon` S06: 0; `project_links` 0) |
| S06 `offer_status` | mọi tin `active` |

## Core (làm trong lát này)

1. **S03/S05 theo bài, một dự án gốc → định vị.** Luật: tin có ít nhất một bài mang phát biểu sống, và mọi phát biểu
   sống của mọi bài trong tin quy về CÙNG một nút dự án gốc. 4.934 tin S03.
2. **Tin có bài mang hai dự án gốc khác nhau → không định vị, đánh dấu `xung_dot`.** Hôm nay 0 tin, nhưng là ô đắt
   nhất nếu sai: xếp hạng giá sẽ đặt tin vào sai dự án. Không chọn theo đa số.
3. **Nút con quy về dự án gốc** (đi `parent_id` tới `node_type = 'project'`). Hôm nay 0 phát biểu trỏ nút con, nhưng
   phân khu 31 nút đã có, và PL20 sẽ ghi toà. Đây là định vị CẤP DỰ ÁN; toà để «chờ khớp».
4. **Rút phát biểu thì tin rơi khỏi định vị ở lượt làm tươi kế** (lọc `retracted_at IS NULL`, không bảng chụp).
5. **Hai luật cùng nút trên một bài đếm một lần** (34 bài).
6. **S06 qua `s06_offer_project`**: hôm nay 0; mã tự lên số khi thẻ luật được áp, không cần PR. Nút ứng viên
   (`mot_loi_khai`) vẫn tính định vị, mang cột hạng tin cậy để người đọc phía sau lọc.
7. **Người đọc: màn chặng.** `dinh_vi_link` đọc nguồn; ô «chờ khớp» (`locatedPending`) giữ nghĩa cấp toà: tính trên
   `ghi_toa AND NOT <đã khớp toà>`, với khớp toà vẫn rỗng (nhịp 2). Màn ghi rõ «cấp dự án».
8. **Người đọc: bậc B2.** `offer_located()` (087) là chỗ cắm thứ hai, đọc cùng nguồn — nếu không, màn chặng nói 4.934
   tin định vị còn thang bậc nói 0 tin B2.

## Later

- S06 qua `field_assertions` (bài S06 chưa có phát biểu dự án) — khi có bộ rút dự án từ chữ tin S06.
- Định vị cấp toà, trục (`gan_can_link` và khớp toà) — PL20, nhịp 2–3.
- Gom tin S03 vào căn (`property_offers`) — GT5.
- S06 khác căn hộ có mã dự án (2.625 tin) — `s06_offer_project` của DA32 chỉ lấy căn hộ; mở khi DA3 đầy đủ.

## Never

- Chọn dự án theo đa số bài khi tin có hai dự án — tin rao một căn chỉ ở một dự án; hai dự án nghĩa là gom tin sai
  hoặc phát biểu sai, phải để người xem, không đoán.
- Lọc nguồn theo `offer_status` — nguồn trả mọi tin; người đọc (màn chặng đếm mọi tin, CG10 lọc tin đang rao) tự lọc.

## Cross-cutting áp mọi ô Core

- **Cloud:** nguồn chỉ ở máy thu (giống 087, 100). `push-ops-facts` chỉ đẩy số đếm qua `data_flow_snapshot`; không thêm
  bảng vào `sync-cloud`; leak gate không đổi. Nguồn chỉ mang mã nút và mã nguồn `S0x`, không tên nguồn thật.
- **`do-hang-ngay`:** tin chuyển B1 → B2 làm số B1 giảm. Phải kiểm luật báo tụt bậc không coi đó là tụt.
- **Mỗi tin một dòng** trong nguồn (khoá `offer_id`), để `EXISTS` của 600 và phép nối của CG10 không nhân dòng.
