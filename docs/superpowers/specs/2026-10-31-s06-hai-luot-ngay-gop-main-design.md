# S06 hai lượt mỗi ngày — tích hợp plist chotot vào main

Hồ sơ: `_acceptance/s06-hai-luot-ngay-gop-main/`. Hàng ưu tiên 1 của dãy P2, đợt `dot0-cam-mau`.

## Vì sao

Mạnh duyệt «Giao gói khuyến nghị» (31/10): S06 lên 2 lượt/ngày để kịp mục tiêu dữ liệu ra mắt 05/11. ZCode sửa plist ở
`zcode/s06-2-luat-ngay` @db2cfbcd và đã cài lên máy thu trước khi gộp. Kho phải khớp máy.

## Làm gì

- Cherry-pick nguyên commit db2cfbcd (một tệp, `pipeline/cron/com.oneinvest.chotot.plist`): `StartCalendarInterval` thành
  mảng hai mốc 05:30 và 14:00.
- 14:00 cách mọi mốc job khác trên máy thu ≥ 60 phút (gần nhất: zalo-import 00:00, apify 06:00 thứ Ba/thứ Sáu, airdna 19:05).
- Răng `rang/lich-chotot.mjs` đo ba vế: plist kho (lint + lịch), va chạm lịch, bản cài + launchd.

## Không làm

- Không sửa nội dung plist, `chotot-daily.sh` hay bước thu (làn ZCode).
- Không cài lại plist (đã cài).
- ROADMAP §2.4 «Chạy đêm» vẫn ghi 05:30 — mục của ZCode, báo liên làn.
- SLO độ tươi S06 (36 giờ) chưa siết theo nhịp mới.
