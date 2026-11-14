---
schema_version: 1
feature: Trần trang thu S06 mặc định 210, 403/429 dừng cả lượt không thử lại, kèm số đo chuỗi đêm khi nạp 55 nghìn tin
slug: s06-tran-trang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-14-s06-tran-trang-design.md
approved_by:
approved_at:
---

# Acceptance Contract: s06-tran-trang

## Context

**Gộp là bật thật.** Lượt S06 do launchd chạy `scripts/chotot-daily.sh`, gọi thẳng `collect-chotot.mjs` từ checkout
chính không kèm `--pages`, plist không đặt `CHOTOT_MAX_PAGES` — gộp PR này là trần 210 chạy ngay lượt kế (Hỏi-1).

Lượt thu S06 thường dừng ở 25 trang mỗi nguồn tin và bỏ sót khoảng 3,4 lần số tin có thể lấy (lượt thử của ZCode
14/11: 55.686 tin so với 16.189). ZCode nâng trần lên 210 và đổi cách xử lý khi bị chặn: 403/429 dừng cả lượt ngay,
không thử lại (Mạnh 14/11: có API thì thu hết nhanh, bị chặn thì dừng). Hồ sơ này đưa hai commit của nhánh
`zcode/s06-tran-trang` vào main và đo trước xem chuỗi đêm S06 với lượng tin mới có lấn cửa chạy S03 không.

## Criteria

- AC-1: Given bộ thu S06, When chạy không có cờ `--pages` và không có `CHOTOT_MAX_PAGES`, Then trần là 210 trang mỗi
  nguồn tin; `CHOTOT_MAX_PAGES=7` cho 7; `--pages 3` thắng biến môi trường.
- AC-2: Given máy chủ trả 429 ở trang 2 của vùng thứ hai sau khi vùng thứ nhất đã xong, When chạy bộ thu, Then máy
  chủ nhận đúng 10 lời gọi (không thử lại), tiến trình thoát 3 và in «DỪNG CẢ LƯỢT», có đúng một snapshot vùng đã xong
  (200 tin) và một snapshot phần đã có của vùng đang chạy (50 tin).
- AC-3: Given tệp test mới vừa vào `npm test`, When chạy bộ canh chia nửa, Then hợp hai nửa của `pipeline/test-nua.json`
  bằng đúng tập `npm test`, không thiếu, không trùng.
- AC-4 (judgment): Given lượt thử 55 nghìn tin của ZCode và một lượt 16 nghìn tin, When lấy thời gian bước thu từ
  manifest của hai lượt, nạp mỗi lượt vào DB thử chép từ DB máy thu rồi đo import, transform, reassign-areas, 300 + 400,
  và chạy resolve-properties trong hộp 20 phút để lấy tốc độ, Then tệp số đo ghi thời gian bước thu và từng bước nạp
  của hai lượt kèm tải máy và việc chạy cùng, ghi giờ bắt đầu chuỗi theo lịch hiện hành và giờ kết thúc dự kiến đặt
  cạnh 16:55Z, ghi rõ phần
  resolve-properties là ước lượng ngoại suy kèm mức sai, và kết luận: tổng thời gian chuỗi đêm S06 với trần mới, có
  lấn cửa S03 16:55Z–17:15Z không, đề xuất giữ giờ, dời giờ hay chia lượt.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — hai thay đổi rời nhau của bộ thu cộng một phép đo vận hành, liệt tay:

- Trục trần: mặc định · biến môi trường · cờ → AC-1
- Trục phản hồi máy chủ: 200 hết trang (vùng xong) · 429 giữa vùng → AC-2; 403 và 5xx/lỗi mạng KHÔNG đo ở hồ sơ này
  (403 đi chung nhánh mã với 429 theo đọc mã, chưa có ca chạy)
- Trục bộ test: tệp mới vào đúng một nửa → AC-3
- Trục vận hành: thời lượng chuỗi đêm theo lượng tin → AC-4

## Out of scope

- Đổi giờ chạy, chia lượt, nạp plist mới hay bật trần mới cho lượt đêm: làn ZCode, sau khi giám sát xem số đo; nạp
  plist cần lời Mạnh.
- Ca 403 riêng và ca 5xx/lỗi mạng không thêm phép đo ở hồ sơ này.
- Ba tệp test khác còn chặn DB kiểu danh sách cấm: hàng `test-pha-chi-chay-db-suite`.
- Mọi đổi logic thu khác của `collect-chotot.mjs`: làn ZCode.

## Đo

Số đo đầy đủ: `_acceptance/s06-tran-trang/do-nap-55k.md` (14/11 08:46Z–09:13Z). Tóm tắt: bước thu 10′35″ → 36′25″; nạp và
transform khoảng 3′ cả hai lượt; resolve-properties ước +8–15% (theo cỡ bảng, mức sai lớn); không lấn cửa S03, hai lượt
trong ngày không chồng. Phát hiện chặn: một tin thiếu `region_v2` làm nạp hỏng cả vùng binh-duong và dừng chuỗi trước
transform — làn ZCode.

## Notes

- Giới hạn có tên: trên CI tệp test mới tự bỏ qua (không có DATABASE_URL) — AC-2 chỉ đo ở lượt chấm trên máy.
