# Thiết kế — ty-le-listing-khu-vuc-gop

Căn cứ: Cổng Bằng chứng `hieu-chuan-mot-bo-so` (ON10) 25/10 — Mạnh chọn «Ngoài-13: mở hợp đồng mới» (sổ dòng
`d-20261025T012505Z-36`); câu giao của giám sát (P4-25): «số tự thu của cả khu vực chia cho số listing S02 của mọi
market thành phần, không chỉ market đại diện».

## Vấn đề

`getAirdnaComparison` (`app/src/lib/queries.ts`) chọn MỘT market S02 đại diện (ON10) và lấy mọi số S02 của thẻ từ market
ấy — kể cả `listing_count` của dòng «Listing». Tử số của dòng đó (`ourListings`) lại là số tự thu của CẢ cây khu vực.
`getTruthfulCoverage` chia cùng tử số cho TỔNG `listing_count` kỳ mới nhất của mọi market thành phần. Khu vực gộp
nhiều market → hai tỉ lệ khác nhau cho cùng khu vực, và tỉ lệ của thẻ bị thổi lên.

## Cách làm

1. Hàm thuần mới `tongListingS02(counts: (number | null)[]): number | null` trong `app/src/lib/calibration.ts`: cộng
   các số không null; mọi phần tử null (hoặc mảng rỗng) → null. Bảng Độ phủ và thẻ hiệu chuẩn cùng dùng hàm này —
   một định nghĩa mẫu số.
2. `getAirdnaComparison`: ô S02 của dòng «Listing» = `tongListingS02` trên `listing_count` kỳ mới nhất của mọi market
   S02 của khu vực (chính các dòng `xw` đã đọc để chọn market đại diện). Tỉ lệ = tự thu ÷ tổng ấy (cách tính tỉ lệ cũ
   giữ nguyên). ADR, công suất, điểm và số tiểu thị trường vẫn của market đại diện.
3. `getTruthfulCoverage`: `activeTotal` tính bằng `tongListingS02` (hành vi không đổi — đổi để hai chỗ không thể lệch).
4. Thẻ của khu vực gộp nhiều market thêm vào chú thích một câu nói dòng Listing cộng cả k thị trường, các số khác lấy
   thị trường đại diện. Khu vực một market không có câu này.

Hiển thị tổng (không phải số của market đại diện) ở ô S02: tỉ lệ đã chia cho tổng thì ô S02 phải là tổng, không thì số
trên một dòng không khớp nhau (tự thu ÷ ô S02 ≠ tỉ lệ).

## Phép đo

- `app/tests/ty-le-listing-gop.test.tsx`: ma trận hàm thuần; truy vấn chạy ĐÚNG `getAirdnaComparison` và
  `getTruthfulCoverage` trên fixture trong BEGIN…ROLLBACK (khoá 33033 như `hieu-chuan.test.tsx`), khu vực thử gộp hai
  market có listing (4 và 9) để tổng (13) khác số của market đại diện (9); vẽ thẻ trong jsdom.
- `scripts/hieu-chuan-do.mjs` (chỉ đọc, DB local): thêm phép so tỉ lệ «Listing» của thẻ với tỉ lệ Độ phủ cho mọi khu
  vực có cả hai; đối chứng: tỉ lệ kiểu cũ (chia cho market đại diện) lệch ở ít nhất một khu vực.

## Không làm

- Ngưỡng «Khớp/Lệch» 0,8–1,2× của dòng Listing (tự thu là mẫu discovery — dòng này gần như luôn «Lệch»; việc khác).
- Gộp ADR, công suất, điểm của nhiều market S02 (ON10 đã chốt: không cộng).
- Bảng S02 toàn quốc (không có cột tỉ lệ).
