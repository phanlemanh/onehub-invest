---
schema_version: 1
feature: 2510-2 — collector API không còn treo cứng khi một lượt flush có hơn 5000 tin mới; bộ nhớ khử trùng giữ đúng 5000 id mới nhất; lô HTTP có trần
slug: collector-seen-cap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: collector-seen-cap

## Context

Ngoài-2 của hồ sơ `kev-nhan-cung-hoa` (Mạnh ký 25/10). Trong `flush()` của collector API (`collector/src/api/server.ts`), vòng `while (seen.size + newIds.length > 5000 && newIds.length > 0)` đếm trùng id mới (đã nằm trong `seen` từ lúc ingest), và thân vòng chỉ xoá `seen`. Một lượt flush có hơn 5000 id mới làm vòng xoá `seen` tới rỗng rồi lặp mãi: event loop bị chặn, SIGTERM không chạy, launchd không tự khởi động lại vì tiến trình vẫn sống.

ZCode thay bằng một mảng thứ tự duy nhất `seenOrder`, cắt ở flush mỗi vòng đúng một phần tử, giữ 5000 id mới nhất theo thứ tự ingest, và thêm trần 1000 tin mỗi lô ở tầng HTTP (413 kèm thông điệp). Source input: lời giao `claudedp-2510-2`. Nhánh `zcode/collector-seen-cap` @ 1670ed4, gộp vào nhánh nghiệm thu cùng `origin/main`.

## Criteria

- AC-1: Given một lượt flush có 6000 id mới, When flush, Then flush kết thúc dưới 5 giây, tệp state giữ đúng 5000 id không trùng, 5000 id mới nhất gửi lại đều bị khử trùng, và 1000 id cũ nhất được nhận lại.
- AC-2: Given hai lượt flush 4000 rồi 2000 id mới, When flush lần lượt, Then sau lượt 1 state giữ đủ 4000 id; sau lượt 2 state đúng 5000 id; id trong cửa sổ 5000 mới nhất vẫn bị khử trùng.
- AC-3: Given collector khởi động lại từ tệp state, When gửi lại các tin đã thấy, Then 5000 id mới nhất vẫn bị khử trùng; tin mới được nhận và state vẫn đúng 5000 id.
- AC-4: Given một lô HTTP POST `/agent-report`, When lô có 1001 tin, Then trả 413 kèm số tin và trần, không tin nào vào bộ đệm; lô đúng 1000 tin vẫn 202 và được nhận đủ.
- AC-5: Given nhánh đã gộp `origin/main`, When chạy toàn bộ test collector (build sạch), Then tất cả xanh.
- AC-6: Given tệp state do bản cũ để lại có id trùng, When collector nạp state rồi cắt về 5000 qua nhiều lượt flush, Then mỗi id chỉ còn một bản (số id trong bộ nhớ bằng độ dài danh sách thứ tự), và id từng bị trùng vẫn bị khử trùng khi gửi lại. (thêm ở vòng 2 — state thật có 5000 phần tử, 4991 id)
- AC-7: Given POST `/agent-report` với thân JSON `null` hay không phải object, When collector xử lý, Then trả 400 kèm thông điệp, không ném lỗi thành 500. (thêm ở vòng 2 — hồi quy của đoạn kiểm trần lô)

## Coverage

- Bỏ coverage-scan: phạm vi là đúng lỗi lặp vô hạn của Ngoài-2 cộng trần lô ZCode thêm. Các trục:
  - số id mới mỗi lượt: dưới / trên 5000;
  - số lượt: một / hai;
  - khởi động lại: có / không;
  - cỡ lô HTTP: 1000 / 1001.

## Out of scope

- Collector chạy không có `stateDir` (chỉ gặp trong test): bộ nhớ khử trùng không được cắt và lớn dần.
- Bên gửi lô lớn hơn 1000 tin (vd một nhóm Facebook trả hơn 1000 bài một lượt) nhận 413 và phải tự chia nhỏ; collector Facebook hiện chưa chia nhỏ.
- Triển khai bản collector mới lên :9210 — gói trong ZC4.

## Notes

- Hợp đồng dựng SAU khi ZCode code xong, nên `gate1_skipped: true`.
- Harness `scripts/collector-seen-cap/acceptance.mjs` chạy mỗi ca trong tiến trình con có timeout 60 giây, nên lỗi lặp vô hạn thành FAIL rõ ràng thay vì treo lượt chấm. Thư mục tạm, cổng ngẫu nhiên, không chạm :9210, không ghi DB.
- Kiểm harness biết đỏ: với `server.ts` của `origin/main`, `flush-6000` bị giết sau 60 giây (treo), `tran-lo` đỏ 2 mục.
- Nhánh nghiệm thu dựng từ `origin/main` rồi gộp nhánh zcode (chiều ngược bị hook git-secrets chặn nhầm vì hunk chứa URL DB local của daily script).
- Vòng 1 PASS 5/5 @ 253908e nhưng Mạnh chọn trả lại để sửa hai lỗi ngoài hợp đồng trong vòng này (MỞ LẠI claudedp-2510-2). Thêm AC-6, AC-7.
- Kiểm harness biết đỏ (vòng 2): trên 1670ed4, `state-trung` đỏ (5000 phần tử, 4990 id) và `body-null` đỏ (thân null → 500).
