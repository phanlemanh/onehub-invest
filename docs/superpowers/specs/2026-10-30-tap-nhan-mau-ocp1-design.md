# Tập nhãn mẫu OCP1 — thiết kế (PL8 `tap-nhan-mau-ocp1`)

Ngày 2026-10-30 · Hàng PL8 (T2, `docs/plan/lo-trinh.json`) · Cổng Đáng `build`: Mạnh 30/10 «P4 làm cả hai:
nhan-gia-va-luu-loi-mang trước, rồi PL8» (`_acceptance/tap-nhan-mau-ocp1/opportunity.md`).

## Bài toán

PL9 (`eval:classify`) chấm độ đúng của các cách đọc tin theo cận dưới Wilson, nhưng cần nhãn. Nhãn người của lát OCP1
(PL7) phải chờ đội gắn xong (việc vận hành, đường găng của đợt). PL8 cho PL9 một tập để chạy ngay: **tin mẫu sinh từ
khuôn của tin thật OCP1, đáp án biết sẵn vì chính bộ sinh bơm giá trị vào khuôn**. Bài học L19: dữ liệu giả từng lẫn
vào `sale_offers` (1.020 tin S03 giả) — tập mẫu tuyệt đối không được tới bảng canonical, kể cả qua `stg_*`.

## Thiết kế

1. **Hàm thuần, không ghi DB** (Hỏi-3, khuyến nghị). `pipeline/lib/tap-mau.mjs` xuất `sinhTapMau({ lat, n, seed })` → mảng tin mẫu, và
   `veJsonl(tap)` → chuỗi JSONL. Không import `pg`, không câu SQL. Tập không có bảng: sinh lại từ (seed, n, bản thư
   viện khuôn) là ra đúng tập. Lối khác chết: `eval_label_items.ref_id` là post_id ở stg nên không chứa được chữ tin
   mẫu nếu không có migration mới; ghi tin mẫu vào `stg_zalo_posts` là đúng con đường L19. Lối còn sống là một bảng
   eval riêng qua migration mới (ngoài canonical) — giá: hàng thành T3, thêm một đường ghi DB phải rào (Hỏi-3).
2. **Lệnh** `pipeline/label-mau.mjs --lat ocp1 --n 200 --seed <s> [--out <tệp.jsonl>]`: in tóm tắt (số tin theo ý
   định × loại tin, dev/test); `--out` ghi JSONL. Cờ lạ → lỗi.
3. **Thư viện khuôn** `pipeline/lib/khuon-mau-ocp1.mjs`: mỗi khuôn là khung câu rút từ một tin thật của lát, các ô
   (`{gia}`, `{dt}`, `{pn}`, `{toa}`, `{du_an}`, `{sdt}`…) thay chỗ giá trị. Mỗi khuôn khai `goc` = `text_hash` (băm
   nội dung đã chuẩn hoá, cùng hàm `textHash` của PL7) của tin thật nó rút ra — băm, không chép chữ — và các nhãn cố
   định của khuôn (`listing_intent`, `kind`, `property_type`). Khử định danh: không SĐT (chỉ dạng che `09xx xxx xxx`),
   không URL, không tên người, không tên nhóm, không tên nguồn thật. Mã toà là mã công khai của dự án (`PR5`, `ZR3`,
   `LD2`…) lấy từ chữ tin của lát.
4. **Ô và dạng bề mặt.** Mỗi ô có một bể giá trị và vài dạng viết; bộ sinh chọn tất định theo băm `seed:k:ô`:
   - giá bán: «3,15 tỷ», «3.15 tỷ», «3 tỷ 150», «3150 triệu», khoảng «3,1–3,3 tỷ»; giá thuê: «12 triệu», «12tr/tháng»,
     «12.000.000»; đơn giá «58tr/m²» chỉ là chữ nhiễu khi có, đáp án vẫn là tổng giá;
   - diện tích «64m2», «64,5 m²», «64.5m»; phòng ngủ «2PN», «2 ngủ», «2N»;
   - dự án theo cách tin viết («Ocean Park 1», «OCP1», «Vinhomes Ocean Park»), toà theo mã.
   Dạng có hai cách hiểu không sinh (Hỏi-2): giá che «5,5x tỷ», «1N+1», «Studio», giá không đơn vị «3380 thu về».
5. **Đáp án theo dựng.** Nhãn của tin mẫu là giá trị đã bơm, ở đúng khuôn chuẩn hoá của bộ ghi nhãn PL7
   (`app/src/lib/labels-normalize.ts`): giá VND nguyên, diện tích thập phân chuẩn («64.5»), dự án/toà chữ thường NFC
   **như tin viết** (bảng trường của PL7: «tên dự án như tin viết»), phòng ngủ số nguyên. Ô khuôn không có → «tin không
   nêu». Một giá → min = max.
6. **Dấu mẫu.** Mỗi tin: `id` `mau-<lat>-<seed>-<k>`, `mau: true`, `lat`, `khuon`, `split` (dev/test chia đôi theo
   băm), `text`, `nhan` (chín trường của PL7). Dòng đầu JSONL: `{"loai":"tap-nhan-mau","mau":true,"lat","seed","n",
   "khuon_ban"}` (`khuon_ban` = băm thư viện khuôn). PL9 đọc dấu này để báo số trên tập mẫu TÁCH khỏi số trên nhãn
   người — việc của PL9.
7. **Tệp kiểm** `_acceptance/tap-nhan-mau-ocp1/mau-kiem.jsonl` (n = 40, seed `kiem`) commit trong hồ sơ cho hội đồng
   đọc (AC-9); test so tệp với bản sinh lại (AC-1) để hội đồng đọc đúng đầu ra của bộ sinh.
8. **Khuôn rút từ tin gốc** (AC-5): các đoạn chữ cố định của khuôn phải xuất hiện theo thứ tự trong chữ tin gốc
   (≥ 80% độ dài), mỗi tin gốc một khuôn — khuôn không phải câu viết tay rồi gán băm.

## Giới hạn đã biết khi thiết kế

- Số đo trên tập mẫu đo khả năng đọc **dạng rõ**; tin thật có dạng mơ hồ (Hỏi-2) nên số trên tập mẫu sẽ cao hơn số
  trên nhãn người. Tập mẫu không thay nhãn người.
- Phân bố dạng trong tập mẫu do bộ sinh chọn, không theo tần suất của tin thật.

## Ngoài vòng

`eval:classify`, `dq_check_results`, hiển thị trên `/ops/quality` (PL9, C4); ghi tập mẫu vào DB; lát khác OCP1;
cặp ghép căn (G3); dạng mơ hồ (Hỏi-2).
