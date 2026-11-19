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

## Ngay trước khi áp

Điền lúc áp thật trên máy thu (README bước 2): mốc, tử số, mẫu số, cửa sổ 13–19/11 từ `kiem-sau.sql`.
