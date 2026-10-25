---
schema_version: 1
feature: bộ canh Zalo không còn tắt nhầm gateway vì quét lại lịch sử khi tệp log gateway bị coi là «tệp mới»
slug: watchdog-l4b-history
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: watchdog-l4b-history

## Context

Ở Cổng Bằng chứng của `watchdog-l4b-cuoi-ngay` (ZC3 nối tiếp, PR #63), Mạnh tách Ngoài-1 thành việc riêng. Lỗi: tệp log
gateway mang các dòng agent-turn của sự cố 20/10; khi bộ canh coi tệp đó là «tệp mới» (khác inode, số dòng trong marker lớn
hơn thật, đường dẫn khác, marker định dạng số cũ), nó quét lại từ dòng 1, gặp turn cũ và tắt gateway Zalo — tin ngừng chảy
tới khi có người bật lại. Lời giao `claudedp-2410-15`; ZCode XONG ở `zcode/watchdog-l4b-history` @ 71d1232: ở chế độ
history, mọi nhánh «quét lại» đều khởi tạo marker ở dòng hiện tại + WARN thay vì quét quá khứ; chỉ nhánh append quét phần mới.

Hạng T3 vì chạm `scripts/zalo-watchdog.sh` (an toàn Zalo).

## Criteria

- AC-1: Given tệp log gateway mang 2 turn cũ và marker định dạng số cũ (chỉ số dòng), When bộ canh chạy lượt kế, Then KHÔNG tắt gateway, có một dòng WARN, marker ghi lại đúng dạng `đường_dẫn:inode:số_dòng`; và một turn MỚI ghi sau đó bị bắt ở lượt kế (tắt).
- AC-2: Given như AC-1 nhưng marker trỏ đường dẫn khác, When lượt kế, Then cùng kết quả: không tắt, WARN, marker đúng dạng, turn mới sau đó bị bắt.
- AC-3: Given tệp log gateway được ghi lại cùng tên (inode mới, nội dung giữ nguyên), When lượt kế, Then cùng kết quả như AC-1.
- AC-4: Given marker ghi số dòng lớn hơn số dòng thật của tệp, When lượt kế, Then cùng kết quả như AC-1.
- AC-5: Given log gateway xoay thật (tệp mới), When một turn ghi SAU lượt quét đầu tiên sau xoay, Then turn đó bị bắt (tắt); turn ghi trước lượt quét đầu sau xoay thuộc cửa sổ bỏ sót đã khai (≤ một chu kỳ 5′), chỉ ghi nhận.
- AC-6: Given nhánh, When chạy lại các kiểm của `watchdog-l4b-cuoi-ngay` (quét log OpenClaw cuối ngày, xoay log, marker hỏng), Then tất cả vẫn đạt.
- AC-7: Given nhánh, When kiểm cú pháp bộ canh và các script liên quan, Then sạch.

## Coverage

- Bỏ coverage-scan: phạm vi là đúng Ngoài-1 của watchdog-l4b-cuoi-ngay. Trục: bốn cách tệp log gateway bị coi là «tệp mới»
  (P1 marker số cũ, P2 đường dẫn khác, P3 inode mới, P4 số dòng lớn hơn), xoay thật, hồi quy ZC3+, cú pháp.

## Out of scope

- Cửa sổ bỏ sót sau khi log gateway xoay thật: turn ghi trước lượt quét đầu tiên sau xoay (≤ 5′) không bị bắt — đánh đổi có ý
  thức để bộ canh không tự tắt gateway vì lịch sử. Lớp L4a (log OpenClaw theo ngày) và L1–L3 vẫn chạy.
- Triển khai bộ canh lên launchd — lời GIAO triển khai riêng sau merge.
- Dọn các dòng turn cũ khỏi log gateway thật — không sửa log runtime.

## Notes

- Hợp đồng dựng SAU khi ZCode code xong (`gate1_skipped: true`), từ lời giao 2410-15 có trước khi code.
- Harness `scripts/watchdog-l4b-history/acceptance.mjs`: bản chép bộ canh trong thư mục tạm (chỉ đổi 2 dòng: đường log /tmp và cổng
  DB), HOME giả, `launchctl/pkill/pgrep/osascript/curl/sleep` là stub đứng đầu PATH (kiểm stub thắng trước khi chạy). Không đọc/ghi
  `~/.openclaw`, `~/Library/Logs/openclaw` hay `/tmp/openclaw` thật.
- Kiểm harness biết đỏ (trước verify): trên bộ canh của main, P1–P4 đều đỏ (tắt nhầm vì turn cũ, không WARN); xoay-that xanh ở cả hai.
