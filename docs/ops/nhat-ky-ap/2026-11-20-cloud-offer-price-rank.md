# Nhật ký áp lên cloud (Supabase) — bảng `offer_price_rank`, 20/11/2026

Đây là DDL trên cloud nên đi theo lời riêng của Mạnh, không theo chữ ký hồ sơ. Tệp áp:
`docs/ops/cloud-schema-catchup-2026-11-14-offer-price-rank.sql` (sha256 đầu `766a9b54863b`), chỉ đúng tệp này.

## Vì sao phải áp

Cloud thiếu bảng `offer_price_rank` từ 15/11: `cloud-sync.log` có 228 dòng «bỏ qua offer_price_rank», nên «Căn giá tốt»
trên cloud chạy thước cũ và `/ops/deals` cloud chỉ hiện «Tất cả 5». Phiên rà soát nguồn (20/11) tìm ra.

## Lời Mạnh

Phiên giám sát, 2026-11-20 ~01:55Z, mã câu hỏi `h-20261120T015346Z-243`, nguyên văn: «Cho áp».

## Trình tự

Người chạy: phiên giám sát đợt dot0-cam-mau. Đường chạy: hàm `mgmtExec` của `pipeline/sync-cloud.mjs` (Management API),
khoá đọc từ tệp cấu hình cloud ở máy thu, không in ra.

| Bước | Giờ (UTC, 20/11) | Kết quả |
|---|---|---|
| Đo trước | ~01:54 | bảng chưa có; quyền mặc định của schema `public` chỉ cho `postgres` và `service_role`; `anonReadable` rỗng |
| Áp | 01:55:57 | một giao dịch, `SET LOCAL lock_timeout = '5s'`, không thử lại; không lỗi |
| Đo sau | ~01:56 | 19 cột · 4 ràng buộc · 3 index · 0 dòng; `anon` không có quyền; bộ soát rò sạch |
| Lượt sync kế | 02:29:37 | chép 130.886 dòng; bộ soát rò PASS |
| Đếm trên cloud | ~02:40 | 25.173 dòng có nhãn: bán giá tốt 1.089 · bán rẻ trong phường 9.331 · thuê giá tốt 2.328 · thuê rẻ trong phường 12.425; 0 dòng mồ côi |
| Mắt nhìn `/ops/deals` cloud (chỉ đọc) | 02:31–02:38 | «Tất cả 5» thành Bán 7.636 căn (Đủ để gọi 3.758 · Cần xác minh 2.485 · Còn thiếu 1.393), Cho thuê 9.912 (4.308 · 3.297 · 2.307) |

Máy thu cùng điều kiện lúc đó: 7.637 / 9.915, lệch do trễ sync.

## Còn hở

- **RLS của bảng mới chưa bật** (41 trên 42 bảng `public` khác đã bật). Tệp bù không có câu `ENABLE ROW LEVEL SECURITY`,
  nên không thêm ngoài khối được duyệt. `anon` hiện không có quyền trên bảng, nên chưa lộ gì. Gom câu này vào lần xin áp
  tệp bù 5 cột cloud còn thiếu.
- `/ops/deals` trên cloud tải 60–100 giây. Đã cắt hàng `deals-cloud-tai-cham`; index trên cloud là DDL, cần lời riêng.

## Cách lùi

`DROP TABLE offer_price_rank` trên cloud, chỉ khi Mạnh bảo. Dữ liệu là bản chép từ máy thu, lượt sync kế tự chép lại.
