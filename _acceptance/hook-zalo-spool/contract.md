---
schema_version: 1
feature: ZC6 — hook Zalo giữ tin trong hàng đợi cục bộ khi collector chết rồi gửi lại, không làm treo gateway
slug: hook-zalo-spool
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: hook-zalo-spool

## Context

Hook OpenClaw `oneinvest-zalo-pipe` (`collector/openclaw/handler.js`) chạy trong tiến trình gateway Zalo, nhận mọi tin của nhóm thu rồi đẩy sang collector :9210. Trước ZC6, hook không gửi lại: collector chết hay khởi động lại (ZC4 sắp chuyển nó sang launchd) thì tin mất ở nguồn. ZC6 thêm hàng đợi cục bộ (spool) một-tin-một-tệp và xả lại ở lượt sau. Vòng 2 làm handler tự chứa (không import bản build collector). Vòng 3 giữ khuôn log cũ, dừng xả ở lần hỏng đầu, có trần 50 tệp mỗi lượt và chuyển lỗi 4xx sang `rejected/`. ZC6 chặn ZC4.

Hạng T3 vì chạm `collector/openclaw/**` (an toàn Zalo). Source input: lời giao `claudedp-2310-5` cùng hai lần MỞ LẠI (23–24/10). Nhánh `zcode/hook-zalo-spool-gui-lai` @ 203fbac, gộp vào nhánh nghiệm thu cùng `origin/main` @ 85d2218.

## Criteria

- AC-1: Given collector không nhận kết nối, When hook nhận tin (kể cả cùng một tin hai lần), Then mỗi tin khác nhau thành đúng một tệp spool, log ghi `spool +1`, không có dòng ` post 202`, hook thoát bình thường.
- AC-2: Given spool có tin và collector sống lại, When lượt hook kế chạy, Then mọi tin trong spool tới collector đúng một lần, tin mới cũng tới, spool rỗng.
- AC-3: Given tin mới gửi thành công, When hook ghi log, Then dòng log giữ khuôn cũ ` post 202 {"accepted":N…} group=…` mà Ops và `audit-all.sh` đọc.
- AC-4: Given collector trả 4xx (trừ 408/429) cho một tệp spool, When xả, Then tệp đó sang `rejected/` kèm log `spool-rejected <status>`, các tệp sau vẫn được gửi, tệp bị từ chối không gửi lại; còn 5xx/429 thì giữ lại trong spool.
- AC-5: Given collector treo không trả lời, When lượt hook chạy với spool có nhiều tệp, Then xả dừng ở tệp đầu, lượt hook kết thúc trong 25 giây, tin mới vào spool.
- AC-6: Given spool có hơn 50 tệp, When một lượt xả, Then gửi đúng 50 tệp, phần còn lại xả ở lượt sau.
- AC-7: Given Kev :8009 treo, When hook xử lý tin, Then sau khoảng 5 giây tin vẫn được gửi với `kev.p = null` và log ghi `kev null`.
- AC-8: Given handler được chép ra thư mục ngoài kho (như khi cài vào `~/.openclaw/hooks/`), When chạy, Then nó chỉ import module `node:` và logic spool vẫn hoạt động.
- AC-9: Given lớp L1 của bộ canh Zalo grep handler tìm API gửi tin, When chạy biểu thức L1 trên handler, Then không khớp dòng nào, và bộ canh vẫn trỏ đúng tệp handler duy nhất.
- AC-10: Given nhánh đã gộp `origin/main`, When chạy toàn bộ test collector, Then tất cả xanh.

## Coverage

- Bỏ coverage-scan: phạm vi là đúng lời giao ZC6 cộng ba điểm của hai lần MỞ LẠI. Các trục:
  - trạng thái collector: chết / sống / treo / 4xx / 5xx;
  - kích thước spool: 0 / vài tệp / hơn 50;
  - Kev: sống / treo;
  - nơi chạy: trong kho / bản chép ngoài kho;
  - an toàn Zalo: L1.

## Out of scope

- Cài bản này vào `~/.openclaw` và restart gateway — lời GIAO triển khai riêng theo `docs/ops/runbook-openclaw-hook.md`, sau merge.
- ZC4 (collector :9210 chạy bằng launchd) — vòng riêng, chờ ZC6 merge.
- Tin gửi lại từ spool không ghi dòng ` post 202` riêng, nên phễu Ops đếm thiếu đúng số tin đã qua spool.
- Tệp spool hỏng định dạng JSON nằm lại spool mãi (bị bỏ qua, không chặn hàng) và vẫn tính vào trần 50 tệp.

## Notes

- Hợp đồng dựng SAU khi ZCode code xong, nên `gate1_skipped: true`. Phiên điều phối liên làn dựng hồ sơ, không viết code sản phẩm.
- Harness `scripts/hook-zalo-spool/acceptance.mjs`: chép handler ra thư mục tạm, HOME giả, collector và Kev giả trên cổng ngẫu nhiên. Không chạm `~/.openclaw`, :9210, :8009, gateway hay launchctl.
- Kiểm harness biết đỏ (trước verify): trên bd51084 (vòng 2) đỏ ở spool-replay (khuôn log), reject-4xx, hang-stop, cap-50; trên handler của `origin/main` đỏ ở cả 6 chế độ chạy handler.
- Vòng 1 BLOCKED: E10 vớt phải `collector/dist/test/kev-nhan-cung-hoa.test.js` do lượt build ZC1 trước đó để lại trong worktree (tsc không xoá test cũ). Vòng 2: E10 đổi sang `executors.script.collector_test_clean` (xoá dist trước khi build).
- Vòng 2 BLOCKED: E10 khai sai khoá (`executors.test.…` thay vì `executors.script.collector_test_clean`); lệnh thật xanh 41/41. Vòng 3 sửa khoá.
