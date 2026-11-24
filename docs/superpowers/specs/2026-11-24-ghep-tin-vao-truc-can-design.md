# PL36 ghep-tin-vao-truc-can — gắn tin đã có toà vào trục hoặc căn của Danh bạ

Hàng PL36 (mỏ neo mo-neo-1411, QĐ6: PL20 gắn toà, PL36 gắn trục và căn). Đứng trên PL20 đã gộp (#534) và đã áp 117 lên DB máy
thu ngày 24/11. Hạng T3 vì có migration mới (131, số do GS cấp).

## 1. Đích và số trên màn

Hôm nay **0** tin S03 gắn trục hay căn. Đo chỉ đọc trên DB máy thu, 24/11 khoảng 12:45Z, sau khi áp 117:

| Đếm | OP1 | GP | Hai khu |
|---|---|---|---|
| Tin có bài gắn toà (`ghep-toa-*`, kể cả tin xung đột) | 1.178 | 1.668 | 2.846 |
| ↳ có bài ghi mã căn (`unit_number` của bộ đọc chữ) | — | — | 509 |
| ↳ mã dạng trục (`LD2XX03`, `BE3.xx13`) | 453 | 1 | 454 |
| ↳ ↳ số căn khớp một trục của toà đã gắn | — | — | 442 |
| ↳ mã dạng tầng + căn (`S2.091710`) | 28 | 3 | 31 |
| ↳ dạng khác | — | — | 24 |

Theo bài (tử số rộng hơn tin vì một tin gom nhiều bài): 37.131 bài có toà, 9.714 có mã căn, 9.049 dạng trục, 570 dạng tầng +
căn. Danh bạ: 39 toà mà các tin trên trỏ tới, 35 toà có trục; bí danh mã căn S16 114.600, S08 2.232.

**Số trên màn sau khi áp** (ước, đo lại ở chạy khô): khoảng **440 / 2.830 tin mức toà** (≈ 15,6%) xuống mức trục, gần như
toàn ở OP1 (≈ 37% tin mức toà của OP1); khoảng 30 tin xuống mức căn. GP gần như không có mã căn trong chữ bài: GP chỉ báo số.

## 2. Bảng phủ ca

| Chiều | Giá trị | Số (DB máy thu) | Ai đọc đầu ra phía sau |
|---|---|---|---|
| Mức của tin ở `offer_building` | toà · vùng · xung đột | 2.830 · 1.402 · 23 | PL36 chỉ đi tiếp từ mức toà |
| Dạng mã căn trong bài | trục · tầng+căn · khác · không có | 454 · 31 · 24 · 2.337 tin | luật §3 |
| Tiền tố toà trong mã | khớp toà đã gắn · toà khác cùng dự án · không có tiền tố | đo ở chạy khô | luật `toa-lech`, `ma-khong-toa` |
| Trục trong danh bạ | khớp đúng một · không khớp | 442 · 12 tin | gắn trục |
| Căn trong danh bạ (trục + tầng) | có · không | đo ở chạy khô | gắn căn |
| Tầng của bài | chữ bài (`floor_raw` bộ đọc chữ) · từ mã · cả hai, khớp · cả hai, lệch | 2.397 bài có tầng chữ bài | phát biểu tầng riêng, mâu thuẫn giữ trục |
| Khu | OP1 · GP | 453 · 1 tin dạng trục | ngưỡng theo khu (Hỏi-1) |
| Người đọc | view `offer_unit` · CG11 (giá tốt trong trục) · bộ lọc tầng (mục 42) | — | — |

Ô bỏ: tin mức vùng và tin xung đột không đi tiếp (ngoài phạm vi, vì PL36 chỉ đi sâu từ toà); dự án ngoài hai khu (theo
PL20, lời người 18/11).

## 3. Luật

Đầu vào là từng **bài** có phát biểu toà sống của PL20 (`universal_property_id`, rule `ghep-toa-*`). Hàm thuần, không đọc DB,
ở `pipeline/lib/ghep-tin-truc-can.mjs`.

1. **Đọc mã căn** (`unit_number` của bộ đọc chữ, nhiều giá trị thì xét từng cái; khác nhau sau chuẩn hoá → `ma-nhieu`):
   chuẩn hoá chữ hoa, bỏ dấu cách. Tách **tiền tố toà** bằng tên đã đăng ký của toà trong dự án (dùng `chuanHoaTenToa` của
   PL20). Tiền tố là toà khác toà đã gắn → `toa-lech`, không gắn. Không có tiền tố nhận ra được → `ma-khong-toa`, không gắn.
2. **Phần đuôi**: `X{1,2}<NN>` → trục số `NN`; `<T><NN>` 3–4 chữ số (tầng 1–2 chữ số + căn 2 chữ số, căn có thể kèm một chữ
   cái) → tầng `T`, căn `NN`; dạng khác → `ma-la`.
3. **Trục**: số căn `NN` khớp đúng một trục đang hoạt động của toà đã gắn (so đoạn cuối bí danh mã trục `.../<toà>/<NN>`,
   bỏ số 0 đầu) → trục. Không khớp → `truc-ngoai-danh-ba`, tin giữ mức toà.
4. **Tầng**: tầng từ chữ bài (`floor_raw`, bộ đọc chữ) và tầng từ mã. Có cả hai mà lệch → `tang-lech`, giữ mức trục. Chỉ có
   tầng từ mã → ghi phát biểu tầng riêng (rule `ghep-can-tang-tu-ma`, nguồn = mã căn), không đè tầng của chữ bài.
5. **Căn**: trục + tầng đã biết, có đúng một căn đang hoạt động ở (trục, tầng) → căn. Không có → giữ trục (`can-ngoai-danh-ba`).
6. **Bài rao nhiều căn** (luật `chuNhieuCan` của PL20, hoặc bản đọc `multi_unit = yes`) → không gắn trục hay căn.

Phát biểu (ADR-0016 §4–5): trường mới **`universal_property_sub_id`** trên resource `Property`. Mức căn ghi
`<stack_key>:<tầng>`, mức trục ghi `<stack_key>:*`. Ba `rule_id` theo nguồn, tắt riêng được như PL20:

| rule_id | Từ | Mức |
|---|---|---|
| `ghep-can-truc` | mã dạng trục, không biết tầng | trục |
| `ghep-can-ma` | mã dạng tầng + căn | căn (rơi về trục khi căn không có trong danh bạ) |
| `ghep-can-truc-tang` | mã dạng trục + tầng chữ bài | căn (rơi về trục như trên) |
| `ghep-can-tang-tu-ma` | tầng suy từ mã căn | phát biểu `floor_raw` riêng |

Lớp `inferred`, phương pháp `e1_rule`, căn cứ ghi mã căn nguyên văn, toà, trục và tầng đã dùng.

## 4. Gộp lên tin — view `offer_unit`

View mới, **không** đổi `offer_building` về hợp đồng đọc (CG11 và Ops đang đọc nó). Một tin mức toà ở `offer_building`:
mọi bài cùng một trục (và cùng căn, nếu có) → mức sâu nhất chung; hai trục khác nhau, hay trục không thuộc toà của tin →
`xung_dot`, **tin giữ mức toà** (không hạ). Tin chỉ biết toà ra `muc = 'toa'`. Cột: `offer_id`, `muc` (`toa|truc|can`),
`building_key`, `stack_key`, `floor`, `unit_key`, `status`.

## 5. Tốc độ `offer_building` (cờ của GS)

Đo 24/11: `SELECT count(*) FROM offer_building` mất **42–55 giây** trên máy thu; ghép thêm `offer_project` thì quá 120 giây.
`EXPLAIN ANALYZE`: view `v_toa_nut_vung` (đọc `stg_s09_item`, bí danh, toà) bị tính lại cho **từng tin có toà** (2.846 lần,
khoảng 19 ms mỗi lần), vì planner ước `gom` chỉ một dòng nên chọn vòng lồng. Đề xuất: migration 131 viết lại thân
`offer_building` với `v_toa_nut_vung` đặt trong CTE `MATERIALIZED` (tính một lần), **đầu ra giữ nguyên từng dòng** — test so
đầu ra cũ và mới trên bản chép phải bằng nhau. Lối khác: view vật hoá (thêm bước làm mới, thêm trạng thái), chỉ mục (không
chữa được vòng lồng) — bỏ.

## 6. Chạy định kỳ và bất biến

- Bước gắn chạy ngay sau bước gắn toà ở cuối mỗi lượt nạp S03 (`transform-zalo.mjs`), giao dịch riêng, khoá tư vấn riêng, trần
  60 giây; lỗi chỉ là một dòng `JOB WARN [ghep-can]`.
- Câu rút «thay bởi lượt» ở `pipeline/lib/assert.mjs` chừa thêm `ghep-can-%` (cùng lỗi E7 của PL20).
- Chạy lại: 0 chèn, 0 rút. Toà của bài đổi hay bị rút → dòng trục/căn của bài bị rút ở lượt kế.
- 0 tin gắn hai căn; tin chỉ biết toà giữ mức toà.

## 7. Migration 131

Một tệp: mở `field_assertions_field_chk` thêm `universal_property_sub_id`; trigger 082 thêm luật: trường này chỉ ở
`Property`, giá trị `stk_<ULID>:<tầng>` hoặc `stk_<ULID>:*` của trục đang hoạt động; `ref_lookup` thêm dòng
(`UniversalPropertySubId`, «Trục, căn của tin»); viết lại thân `offer_building` (§5); tạo `offer_unit`. Đầu tệp mang **dòng
đính chính** chú thích «Lùi» của 117 (cách lùi đúng của 117 ở `_acceptance/ghep-tin-vao-danh-muc/ho-so-ap.md` mục 4). Không
sync cloud.

## 8. Tập chấm và ngưỡng

Lộ trình ghi «tập test đóng băng của PL35». Đo 24/11: lát `hai-khu-ghep` có tầng `op1-truc` 75 bài (37 test, 38 dev) có nháp
nhưng **0 nhãn người**; lát `hai-khu-ghep-c` có 5 nhãn trục. Cận dưới Wilson 0,95 (nhóm A) cần khoảng 73 bài đúng liên tiếp
— 37 bài không bao giờ đạt. Cần một buổi gắn nhãn trục (Hỏi-2) và chốt ngưỡng theo khu (Hỏi-1).

## 9. Hỏi cho Cổng Phạm vi

- **Hỏi-1** Ngưỡng Wilson chấm theo khu hay gộp? Khuyến nghị: chấm trên OP1, GP chỉ báo số (GP có 1 tin mã dạng trục). Lối
  khác: gộp hai khu — GP gần như rỗng nên ngưỡng gộp chính là OP1 mang tên hai khu, đọc sai.
- **Hỏi-2** Tập chấm gắn trục? Khuyến nghị: lát mới 110 bài OP1 có mã dạng trục, rút như lát `-b` của PL20, người gắn nhãn
  trục trên `/ops/labels` (khoảng 5,5 giờ theo nhịp 3 phút mỗi bài của PL20). Lối khác: gắn nhãn 75 bài `op1-truc` của PL35 — đủ cỡ sát ngưỡng, một lỗi là hụt.
- Viết lại `offer_building` cho nhanh (§5) là máy quyết, không hỏi: đầu ra giữ nguyên từng dòng có test so (AC-7), các lối
  khác chết (vật hoá thêm trạng thái phải làm mới; chỉ mục không chữa vòng lồng; để chậm thì `offer_unit` đứng trên nó cũng
  quá 120 giây).

## 10. Ngoài phạm vi

- GP gắn trục bằng nguồn ngoài chữ bài (S16 tra theo giá, ảnh mặt bằng) — mục chờ GCH1.
- Hiện trục, căn trên Invest hay Ops; CG11 đổi sang so trong trục.
- Tin S05, S06; dự án ngoài hai khu.
- Bản đọc model (đọc gộp) làm nguồn mã căn — chỉ dùng mã của bộ đọc chữ.
