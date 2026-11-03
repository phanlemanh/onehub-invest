---
schema_version: 1
feature: job nạp S03 liệt kê được bản thu khi số thư mục vượt giới hạn đối số, và lỗi liệt kê làm job đỏ thay vì im lặng
slug: s03-nap-argmax
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-11-03T04:37:02Z
approved_by:
approved_at:
---

# Acceptance Contract: s03-nap-argmax

## Context

`zalo-import-daily.sh` và `apify-facebook-daily.sh` liệt kê bản thu bằng `ls -1d` với glob. Khi đủ 11.082 thư mục, tổng độ dài đường dẫn 1.065.879 byte vượt ARG_MAX 1.048.576 của macOS: `ls` thoát 126, `2>/dev/null` nuốt lỗi, vòng lặp rỗng, job thoát 0. Đo 03/11: bản ghi mới nhất của S03 trong stg là 12:00 VN 02/11, con trỏ state đứng yên, hơn 1.000 bản thu chờ nạp, raw còn nguyên. ZCode sửa ở `zcode/s03-nap-argmax` @ `0fdc00b2`; liên làn thêm test chạy thật khối liệt kê.

Source input: GIAO claudedp-0311-8, XONG của ZCode lúc 04:24Z 03/11.

## Criteria

- AC-1: Given cây thư mục có tổng độ dài đường dẫn vượt ARG_MAX (khuôn `ls` cũ thoát 126 trên chính cây đó), When chạy khối liệt kê của mỗi script, Then thấy đủ mọi bản thu S03 đúng thứ tự mốc, không tính thư mục `.partial`, mốc sai khuôn, hay bản thu nguồn khác.
- AC-2: Given bước liệt kê lỗi, When chạy khối liệt kê, Then thoát 3 và tệp state giữ nguyên.
- AC-3: Given hai script, When so khối liệt kê, Then giống hệt nhau; không script nào còn khuôn `ls -1d` với glob bản thu.
- AC-4: Given các luật nạp cũ (định dạng mốc, khoá state chung, thư mục mồ côi thiếu manifest), When chạy bộ hồi quy, Then vẫn đạt.

## Out of scope

- Chạy nạp bù trên dữ liệu thật: là bước triển khai riêng sau khi gộp, GIAO cho ZCode.
- Hai mục đỏ có sẵn trên main ở `au3-nap-bao-loi` (`apify`, `chotot`, cùng dòng "lỗi thật được nhận là ECONNREFUSED"): đỏ y hệt trên `0d57687f`, không do bản này.
- Giảm số tiến trình con mỗi bản thu trong vòng lặp (khoảng 4 lần fork mỗi thư mục): cũ, không gây lỗi.
- Không đổi lịch launchd, không đụng OpenClaw hay cấu hình Zalo.

## Coverage

- Trục vượt giới hạn: AC-1, có đối chứng khuôn cũ gãy trên cùng cây.
- Trục lỗi im lặng: AC-2, chiều không ghi state.
- Trục hai bản lệch nhau: AC-3.
- Trục hồi quy luật nạp: AC-4.

## Notes

- Bỏ gap-probe: vòng hẹp một khối lệnh, trục rủi ro đã liệt kê thẳng trong tiêu chí.
