---
schema_version: 1
feature: job hằng ngày S06 không còn xoá số và tên người bán đã thu; bộ thu số gọi mỗi tài khoản một lần
slug: hop-dong-nguoi-ban-s06
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-03T03:35:38Z
approved_by:
approved_at:
---

# Acceptance Contract: hop-dong-nguoi-ban-s06

## Context

Bộ nạp S06 trên main ghi đè cột người bán ở mỗi lượt thu thường. Đo 03/11: số tin có SĐT trong stg giảm từ 678 xuống 414 sau job 05:30, ZCode phải bù lại từ state sau mỗi job. Nhánh `zcode/hop-dong-nguoi-ban` @ 24fa1889 mang hợp đồng dữ liệu v5, bản sửa bộ nạp và bộ thu số Chrome đã được Mạnh duyệt phương án (2 luồng, nghỉ 8-15s, mỗi tài khoản một lần, tin ẩn số không gọi). Review 03/11 thấy bộ thu sẽ gọi lại khoảng 542 tài khoản đã có số và bộ nạp làm mất `displayName`; ZCode đã sửa (`claudedp-0311-3`).

Source input: GIAO claudedp-0211-1, claudedp-3010-7, claudedp-0311-3; XONG của ZCode 03:19Z 03/11.

## Criteria

- AC-1: Given snapshot `schemaVersion` từ 1 tới 5, When nạp bằng hai bộ nạp, Then đều được nhận; Given `schemaVersion` 6, Then từ chối rõ ràng.
- AC-2: Given dòng stg đã có số và tên từ lượt thu số, When một lượt thu thường mới hơn nạp vào, Then `phone`, `phoneStatus`, `accountRef`, `seenAt`, `displayName` còn nguyên, còn phần mô tả và `captured_at` lấy bản mới.
- AC-3: Given lượt thu số (`coverage.methods.hienSo`), When nạp, Then chỉ cột người bán đổi; `captured_at` và `payload` giữ nguyên; item báo lỗi không xoá số đã có và không ghi null đè tên.
- AC-4: Given tài khoản đã có số ở bất kỳ tin nào, When dựng danh sách việc, Then tài khoản đó không vào việc; tài khoản chưa có số vào việc đúng một lần dù có nhiều tin.
- AC-5: Given tin `phone_hidden`, When dựng danh sách việc, Then tin đó không vào việc.
- AC-6: Given không truyền `--mau`, When dựng danh sách việc, Then không lấy mẫu; Given `--phase 2`, Then thoát khác 0 và không chạy.
- AC-7: Given thiếu `S06_WEB_BASE`, When chạy bộ thu, Then thoát khác 0; mã thu và tài liệu mới không chứa URL ngoài máy.
- AC-8: Given luật không lùi đã có, When nạp snapshot cũ hơn hoặc manifest thiếu `finishedAt`, Then hành vi cũ giữ nguyên.
- AC-9: Given nguồn trả 403 hoặc 429 (có hay không Retry-After), When đang thu, Then cả lượt dừng ngay từ lần đầu, thoát 2 và in số giây nếu có; captcha, `khong-ra-so`, timeout vẫn theo luật 5 lần liền.
- AC-10: Given một lượt kết thúc bằng bất kỳ đường nào (xong, 429, tín hiệu, lỗi), When thoát, Then không còn tiến trình Chrome mang profile của bộ thu và tệp PID trống; Given PID trong tệp không mang đúng profile của bộ thu, Then không đụng tới tiến trình đó.
- AC-11: Given tín hiệu dừng giữa lượt, When thoát, Then số đã thu nằm trong stg, không phải gọi lại nguồn.
- AC-12: Given `--threads` lớn hơn 2, When chạy, Then thoát 1; Given tin mới nhất của tài khoản chưa có số đã `het-han`, When dựng việc, Then chọn tin kế chưa hết hạn.

## Coverage

- Bỏ coverage-scan: vòng nhận bản sửa đã review; hai trục rủi ro là mất dữ liệu ở bộ nạp và gọi nguồn thừa ở bộ thu, đều có tiêu chí kèm đối chứng âm.

## Out of scope

- Chạy thật bộ thu trên nguồn: AC-1 tới AC-8 dừng trước khi mở trình duyệt, AC-9 tới AC-11 chạy Chrome thật ngoài màn hình trên máy chủ giả local, không gọi nguồn; lượt Chrome là việc vận hành của ZCode từ 17:35.
- `pipeline/bu-seller-v5.mjs` không có test tự động: công cụ bù tạm, ZCode đã chạy thật và đối chiếu lệch 0 sáng 03/11; hết cần sau khi nhánh vào main.
- Áp `068`, đưa số lên canonical: thuộc hồ sơ `sdt-s06-ghep-tai-khoan`.
- Miền nguồn có sẵn trong các tệp trên main: có từ trước, báo riêng cho giám sát.
