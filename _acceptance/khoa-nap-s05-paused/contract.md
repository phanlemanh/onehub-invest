---
schema_version: 1
feature: khoá nạp Zalo tự gỡ khi tiến trình giữ khoá đã chết hoặc khoá quá 2 giờ, và S05 tạm dừng thì bước thu không gọi Apify
slug: khoa-nap-s05-paused
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-25T09:24:28Z
approved_by:
approved_at:
---

# Acceptance Contract: khoa-nap-s05-paused

## Context

Hai lời giao làn ZCode cùng sửa `scripts/apify-facebook-daily.sh` nên gộp một nhánh (`zcode/khoa-nap-khong-ket` @ d60b8e6,
được phép ở BÁO 2510-11):
- **2510-9 khoá nạp không kẹt.** Khoá thư mục `apify-daily.state.lock` (AU3) dùng chung cho `apify-facebook-daily` và
  `zalo-import-daily`. Tiến trình bị kill -9 hay mất điện để lại khoá, mọi lượt nạp sau chờ 5 phút rồi bỏ cho tới khi gỡ tay.
- **2510-4 S05 tạm dừng.** S05 đang `paused` (credit hết, Mạnh chốt 24/10) nhưng bước thu vẫn gọi Apify mỗi lượt, nhận 402
  và đốt lượt. Đồng thời tệp bọc từng nuốt mã thoát của bước thu.

Source input: lời giao `claudedp-2510-9` và `claudedp-2510-4` (25/10), có trước khi code. Nhánh nghiệm thu = ZCode d60b8e6
gộp `origin/main` 08afadf.

## Criteria

- AC-1: Given khoá nạp tồn tại và ghi PID của một tiến trình đã chết, When một tác vụ nạp chạy, Then tác vụ gỡ khoá cũ (log nêu PID), lấy khoá và nạp bình thường.
- AC-2: Given khoá nạp ghi PID của một tiến trình đang sống và lấy chưa tới 2 giờ, When tác vụ nạp chạy, Then tác vụ chờ như cũ rồi thoát khác 0, KHÔNG nạp và KHÔNG đụng khoá của người khác.
- AC-3: Given khoá nạp lấy hơn 2 giờ trước dù PID còn sống, When tác vụ nạp chạy, Then tác vụ gỡ khoá và nạp.
- AC-4: Given `source_registry` ghi S05 `paused` (hoặc không có dòng S05), When bước thu S05 chạy, Then nó log `S05 paused — bỏ qua thu`, thoát 0 và không có lời gọi mạng nào.
- AC-5: Given S05 `active`, When bước thu chạy, Then nó đi qua cổng tới bước đọc token như trước; và khi DB không tới thì coi như active (log cảnh báo), không tự coi là paused.
- AC-6: Given bước thu S05 thoát lỗi, When `apify-facebook-daily` chạy, Then vẫn nạp snapshot sẵn có, chạy transform và refresh, rồi thoát bằng mã của bước thu ở cuối lượt.
- AC-7: Given nhánh, When chạy lại toàn bộ harness AU3 (ts-format, apify, chotot, lock) và bộ test `scripts/`, Then tất cả xanh.
- AC-8: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có tệp của hai lời giao (bước thu S05, hai tệp bọc nạp, test, harness AU3) cùng hồ sơ này — không tệp transform hay app nào; hai tệp bọc qua `bash -n`.

## Coverage

- Bỏ coverage-scan — hai lời giao hẹp; trục: trạng thái khoá (không có / PID chết / PID sống < 2 giờ / > 2 giờ), trạng thái S05
  (paused / active / thiếu dòng / DB không tới), mã thoát bước thu (0 / lỗi), hồi quy AU3, phạm vi tệp.

## Out of scope

- Hai job cùng gặp một khoá cũ đúng lúc: cả hai có thể cùng gỡ, job sau xoá khoá vừa lấy của job trước (kẽ hở đọc-rồi-xoá). Hai job chạy 00:00 và theo lịch S05 nên hiếm trùng; chấp nhận.
- Khoá cũ kiểu thư mục rỗng (từ trước vòng này, không có pid/luc) vẫn chờ như cũ — gỡ tay một lần.
- Bootout/cài lại plist, đổi lịch S05 (vòng G1 `claudedp-2510-14`), bật lại S05 (G2 ngày 7/11).
- Gọi Apify thật — mọi phép thử chặn mạng.

## Notes

- Probe `_acceptance/khoa-nap-s05-paused/probes/s05-gate.mjs` chạy collector THẬT trên DB tạm `acc_s05_<pid>` (pg_dump -s bảng
  `source_registry`), HOME giả, fetch bị thay bằng bản đếm lời gọi; xoá DB tạm khi xong. Không ghi DB oneinvest.
- Harness AU3 (`scripts/au3-nap-bao-loi/acceptance.mjs`) do ZCode mở rộng trong cùng nhánh (lock thêm 6 ca, apify thêm ca e);
  lượt chấm đối chứng chúng trên handler/tệp bọc của main để chắc chúng biết đỏ.
