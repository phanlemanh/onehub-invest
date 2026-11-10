---
schema_version: 1
feature: Bộ canh S03 thêm lớp L6 kiểm sống — cảnh báo khi S03 ngừng thu (không snapshot mới ban ngày, tự khởi động lại treo, not linked), không kill gateway
slug: canh-bao-s03-ngung-thu
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-10
---

# Acceptance Contract: canh-bao-s03-ngung-thu

## Context

Sự cố 09/11–10/11: S03 ngừng thu 23 giờ, từ 09/11 02:33Z tới 10/11 02:11Z. Trong suốt thời gian đó watchdog S03 vẫn báo «ok».

Diễn biến (liên làn đọc gateway.log):
- Listener đóng với mã 1000.
- Tự khởi động lại lần 1/10, provider lên được.
- 61 giây sau listener đóng lại.
- Lần 2/10 được hẹn «sau 10s» nhưng không bao giờ chạy: không có dòng provider khởi động nào cho tới lúc khôi phục bằng tay.

Các lớp L1–L5b của watchdog chỉ kiểm AN TOÀN (lockdown, agent-turn, Kev, Postgres), không kiểm S03 còn SỐNG hay không.

Hàng LT0 `canh-bao-s03-ngung-thu`, phần watchdog (làn ZCode). Báo cáo chạy liên tục 10/11 §5 đề xuất hàng này, chưa ghi vào `lo-trinh.json`.

ZCode viết lớp L6 trên nhánh `zcode/s03-song-watchdog` @32767b7b (claudedp-1011-5):
- lib `scripts/lib/s03-song.sh`;
- khối L6 trong watchdog S03;
- 7 ca test.

Liên làn đã review. Nhánh hồ sơ `feat/canh-bao-s03-ngung-thu` dựng trên nhánh đó, thêm:
- harness `scripts/canh-bao-s03-ngung-thu/acceptance.mjs`, chạy watchdog trọn vẹn trên bản chép;
- sửa hộp cát của hai harness watchdog cũ để chép `scripts/lib/*.sh` (thiếu lib thì lớp L6 in lỗi ra stderr và harness `gateway` cũ đỏ).

Ngưỡng dựa trên nhịp thu đo ngày 06–08/11 (n=2542):
- Ban ngày: khoảng cách giữa hai snapshot S03 có trung vị 60s, p95 120s, 44–63 snapshot/giờ.
- Ban đêm: khoảng 7 snapshot/giờ.

Source input: prompt — giám sát giao liên làn 10/11 («GẤP… kèm đề nghị thêm kiểm watchdog 0 snapshot S03 trong N giờ ban ngày»; «dựng _acceptance/canh-bao-s03-ngung-thu/… T3»).

## Criteria

- AC-1: Given giờ VN trong khung 7–21 và thư mục snapshot S03 mới nhất đã cũ ≥ 1800 giây, When bộ canh chạy một lượt, Then alerts log có đúng một dòng `WARN S03-SỐNG [a]` và một thông báo màn hình L6. Chiều không báo: tuổi 1799 giây thì không có dòng nào.
- AC-2: Given snapshot S03 cũ 1 giờ, When bộ canh chạy ở giờ 6, 22 hoặc 23, Then không có cảnh báo (a) và trạng thái không đánh dấu (a). Ở giờ 7 và 21 thì có báo.
- AC-3: Given gateway.log có dòng `auto-restart attempt k/10` cuối cùng cách ≥ 120 giây và sau dòng đó không có dòng `starting … provider`, When bộ canh chạy, Then có một `WARN S03-SỐNG [b]`. Các ca KHÔNG báo:
  - attempt mới cách 119 giây;
  - có `starting … provider` sau attempt;
  - gateway.log vắng (cũng không lỗi dưới `set -u`).
- AC-4: Given đầu ra `openclaw status` có `not linked` (không phân biệt hoa thường), When bộ canh chạy, Then có một `WARN S03-SỐNG [c]`. Đầu ra chỉ có `linked` thì không báo.
- AC-5: Given một điều kiện đã báo và vẫn đỏ, When bộ canh chạy lượt kế, Then không thêm dòng WARN, không thêm thông báo. Khi điều kiện hết đỏ thì cờ trạng thái của nó được xoá và không báo thêm. Nếu sau đó tái phát thì báo lại đúng một lần.
- AC-6: Given cả ba điều kiện cùng đỏ, When bộ canh chạy, Then bộ canh thoát 0 và không gọi `launchctl bootout` hay `pkill`, tức lớp L6 chỉ cảnh báo, không kill. Given máy khoẻ (snapshot 60 giây, restart cũ đã khởi động lại, liên kết bình thường), When chạy, Then có 0 dòng `S03-SỐNG`, và stderr không có lỗi của lib hay hàm L6.
- AC-7: Given tái hiện sự cố 09/11, When bộ canh chạy lúc 10 giờ, Then cả ba điều kiện (a), (b), (c) đều đỏ. Tái hiện gồm:
  - chuỗi gateway.log: listener closed → attempt 1/10 → starting → listener closed → attempt 2/10 «in 10s» và không có starting nào sau;
  - snapshot cũ 23 giờ;
  - status `not linked`.
- AC-8: Given nhánh này, When chạy các harness bộ canh cũ (L4b scan, gateway, rotate, marker-hong) và kiểm cú pháp bash, Then tất cả xanh. Bộ canh source `lib/s03-song.sh` và gọi đủ ba hàm kiểm. Khối L6 không gọi `alert`.

## Coverage

Trục:
- điều kiện: (a) snapshot, (b) tự khởi động lại, (c) liên kết;
- chiều: đỏ, không báo;
- biên: giờ 6/7/21/22/23, tuổi 1799/1800 giây, attempt 119/120 giây;
- vòng đời: lần đầu, lặp, hồi, tái phát;
- tác dụng phụ: kill, stderr, thông báo;
- hồi quy: các lớp L1–L5b.

AC-1 đến AC-4 mỗi AC một điều kiện, kèm chiều không báo. AC-5 là vòng đời. AC-6 là ranh giới không kill. AC-7 là tái hiện sự cố. AC-8 là hồi quy.

## Out of scope

- Ô trên `/ops` và SLO độ tươi S03 (phần Claude của LT0): hàng sau.
- Sửa nguyên nhân bộ hẹn tự khởi động lại bị treo trong OpenClaw (thượng nguồn). L6 chỉ phát hiện.
- Tự khôi phục: L6 không khởi động lại, không chạy `doctor --fix`, không quét QR.
- Cảnh báo ra ngoài máy (tin nhắn, email). L6 chỉ ghi alerts log và hiện thông báo màn hình như L4c/L5b.
- Chạy watchdog thật lên OpenClaw, `~/.openclaw` thật, `launchctl` thật (luật 8). Mọi eval chạy trên bản chép với stub.

## Notes

- **Hạng và chữ ký:** T3 vì `scripts/zalo-watchdog.sh` ∈ `t3_paths` (an toàn S03). Mạnh ký cả ba cổng: Phạm vi, 1.5 và Bằng chứng.
- **Kế hoạch (Cổng 1.5):** code đã có từ ZCode @32767b7b, liên làn đã review và chạy thử trên máy thật lúc 02:59Z (không báo nhầm). Phần còn lại:
  - (1) harness hồ sơ + sửa hộp cát của hai harness cũ, đã làm trên nhánh này;
  - (2) chấm S4 bằng phiên sạch;
  - (3) mở PR, làn merge gộp. Watchdog chạy từ checkout chính nên gộp + pull là có hiệu lực, không cần lời giao triển khai riêng.
- **Harness biết đỏ (đột biến, liên làn chạy 10/11):** mỗi đột biến làm đỏ đúng mục tương ứng.
  - bỏ chặn lặp → T3, T4, T5 đỏ;
  - ngưỡng 1800 thành 3600 → biên 1800 đỏ;
  - khung `-lt 22` thành `-le 22` → biên 22 đỏ;
  - L6 gọi `alert` → T2 đỏ (exit 1, kill).
- **Tên nguồn thật:** harness không ghi tên nguồn thật; tên tệp watchdog, khuôn tên thư mục snapshot, tên extension và khoá kênh đều đọc từ chính watchdog. Riêng lệnh trong `config.yaml` dùng đường tệp hiện có của kho, như các lệnh watchdog cũ.
- **Known limits (dự kiến trình ở Cổng Bằng chứng):**
  - (b) chỉ so dòng attempt cuối với dòng starting cuối của toàn gateway.log. Log xoay kiểu đổi tên thì mất mốc cũ, và chỉ báo lại khi có attempt mới.
  - (c) khớp «not linked» ở bất kỳ dòng nào của status, kể cả kênh khác.
  - Thông báo màn hình chỉ thấy khi người ở máy.
  - L6 quét toàn bộ `collector/snapshots` mỗi lượt: đo 0,49 giây trên khoảng 17 nghìn thư mục.
  - Khung giờ tính theo `TZ=Asia/Ho_Chi_Minh` của máy thu.
