# Số chạy thử — DA45 phuong-tu-du-an-chay-that

Đo 19/11 trên DB thử do `db/db-thu.sh` chép (probe `tren-db-thu.sh thoi-gian`, `ma-tran`), lượt ghi đầu `--ghi` chạy thật trên bản chép.
Bản chép là ảnh DB mẫu của bộ chạy thử, cũ hơn DB máy thu một ít (7.289 tin S03 so với 7.524 trên máy thu lúc 08:29Z), nên số
trên máy thu sau khi áp sẽ cao hơn tương ứng. Lệnh đo: khối SQL ở mục Context của `contract.md`.

- Mốc đo: 2026-11-19T08:30Z (bản chép) · máy thu chỉ đọc 2026-11-19T08:29Z
- Tử số toàn kho: 72 → 7.060 tin S03 có phường thật sau lượt ghi đầu (bản chép)
- Mẫu số toàn kho: 7.289 tin S03 (bản chép) — 96,9%
- Cửa sổ 13–19/11: 15 → 1.190 trên 1.273 tin (bản chép)
- Giây lượt đầu: 80,3 giây; lượt lặp không có gì mới 1,4 giây

## Máy thu, chỉ đọc (trước khi áp)

- `kiem-sau.sql` lúc 08:29Z: 78 trên 7.524 tin S03 có phường thật; cửa sổ 13–19/11: 21 trên 1.508; phát biểu sống của luật: 0; tin mang
  nhãn `du-an`: 0.
- `node pipeline/scripts/phuong-tu-du-an.mjs --json` (chỉ đếm): 78.547 bài có dự án, 78.541 bài nhận phường, 0 dự án mâu thuẫn, 6 bài thuộc
  dự án không có phường.

## Ô của bảng phủ ca (probe `ma-tran`, 13/13 ô đạt)

| Ô | Số tin | Kết quả |
|---|---:|---|
| tỉnh · một phường · thẻ trùng | 6.776 | nhận phường dự án |
| tỉnh · một phường · thẻ khác | 19 | theo lối Hỏi-1: lấy theo dự án |
| trống · một phường · thẻ trùng | 452 | nhận phường dự án |
| trống · một phường · không thẻ | 107 | nhận phường dự án |
| phường · một phường · không thẻ | 75 | giữ nguyên cột |
| phường · không dự án · không thẻ | 3 | giữ nguyên cột |
| tỉnh · dự án không phường · có thẻ | 6 | giữ nguyên cột |
| tỉnh · không dự án · có thẻ | 72 | giữ nguyên cột |
| tỉnh · không dự án · không thẻ | 9 | giữ nguyên cột |
| trống · không dự án · không thẻ | 170 | giữ nguyên cột |
| trống · không dự án · có thẻ | 3 | giữ nguyên cột |
| tỉnh · nhiều dự án · có thẻ | 0 | giữ nguyên cột (chưa đo trên dữ liệu thật) |
| trống · nhiều dự án · có thẻ | 0 | giữ nguyên cột (chưa đo trên dữ liệu thật) |

Ô «thẻ khác» nay 19 tin (lúc soát Cổng Phạm vi là 20); dữ liệu đổi theo lượt nạp, lối xử lý không đổi.

## Tin đổi tỉnh khi nhận phường dự án (9 tin; lúc soát Cổng Phạm vi là 10)

Cột đang ghi tỉnh Hà Nội, dự án nằm ở phường thuộc Hưng Yên — lượt ghi đưa tin sang phường của dự án:

- offer_0bf1fc272f003f6a vn-hanoi → vn-hung-yen
- offer_53036c1b7bff7baf vn-hanoi → vn-hung-yen
- offer_56195f0162f2dd47 vn-hanoi → vn-hung-yen
- offer_725f0aef5c655696 vn-hanoi → vn-hung-yen
- offer_a54b8a45578ef8d5 vn-hanoi → vn-hung-yen
- offer_a67355b967e1789f vn-hanoi → vn-hung-yen
- offer_a89a46fe704683be vn-hanoi → vn-hung-yen
- offer_e4f10c5f16377036 vn-hanoi → vn-hung-yen
- offer_e6880ed7eb1a9279 vn-hanoi → vn-hung-yen

## Lùi qua chuỗi (E6) và phép đối chứng «chỉ gọi resolve»

Cách đo theo lời Mạnh 19/11 (AC-6 đổi lời, yêu cầu P3-209): `area_id` so nguyên văn với trước khi áp; `area_id` + `field_provenance` so với
bản trước khi áp đã phân xử lại một lượt (probe chép lại trạng thái trước khi áp rồi gọi `resolve_offer_fields` trên các tin có phát biểu
của luật).

Lượt `tren-db-thu.sh ap-lui` 19/11 ~16:55Z trên bản chép: sao lưu → áp → `lui.sql` → `transform-zalo` → `--ghi --noi-tiep`. Kết quả: phát
biểu sống của luật về 0; băm `area_id` của mọi tin S03 bằng trước khi áp; băm `area_id` + `field_provenance` bằng bản so (7.441 tin phân xử
lại). Lượt thử phá `ap-lui --bo-lui` (bỏ `lui.sql`) đỏ ở đúng hai chỗ: 80.279 phát biểu sống và băm `area_id` lệch.

Hai vết thừa mà lượt đo bắt được, đã sửa trong `lui.sql` trước khi xin chấm:

- 272 tin cột trống mất gợi ý `goi_y` của thẻ nhóm: lượt phân xử gỡ nhãn `du-an` bỏ cả khoá `field_provenance.area_id` (hàm 102). Sửa:
  phân xử lại thêm một lượt để dựng lại `goi_y`.
- 13 tin có phát biểu của luật mà không mang nhãn `du-an` (tin giữ nguyên cột): `goi_y` của chúng còn trỏ tới phát biểu đã rút vì lượt lùi
  không phân xử lại chúng. Sửa: tập phân xử lại gồm cả mọi tin có phát biểu sống của luật.

Đối chứng, không có luật phường: `bash _acceptance/phuong-tu-du-an-chay-that/probes/tren-db-thu.sh doi-chung-resolve` — trên bản chép chưa có
phát biểu nào của luật, chỉ gọi `resolve_offer_fields` một lượt trên tin S03 cột trống chưa có dấu:

- tin S03 cột trống chưa có dấu: 544 · đổi `field_provenance` sau một lượt resolve: 267 · đổi `area_id`: 0

Tức 267 tin mang dấu cũ chưa từng phân xử lại; lượt phân xử nào cũng làm mới `goi_y` của chúng, có hay không có luật phường. Vì thế bản so
của AC-6 là «trước khi áp, phân xử lại một lượt», không phải trạng thái trước khi áp nguyên văn.

## Ngay trước khi áp

Điền lúc áp thật trên máy thu (README bước 2): mốc, tử số, mẫu số, cửa sổ 13–19/11 từ `kiem-sau.sql`.
