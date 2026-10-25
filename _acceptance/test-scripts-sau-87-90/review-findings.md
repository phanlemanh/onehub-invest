# Review findings: test-scripts-sau-87-90 (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC — 7/7 eval đạt `expected`, kể cả các vế should-NOT-fire)

## Ngoài hợp đồng

không có

## Đã soát, không phải finding

Phạm vi soát: `git diff origin/main...HEAD -- scripts/` (hai tệp test).

- Test còn răng. Đột biến M1 (importer ghi `now()`) và M2 (tệp bọc bỏ import-airbnb) đều bị bắt (E2/E4). Phiên chấm còn đột biến `freshness.mjs` cho probe S06 đọc `max(c.captured_at)`. GT-AC-1 không còn tự phân biệt được ca này vì captured_at nay bằng finishedAt, nhưng GT-AC-4 và GT-AC-8 đỏ, nên trục «đo theo giờ thu» vẫn được canh.
- Không ẩn đỏ. Cả hai bộ có 0 ca bỏ qua. Sleep giả chỉ bỏ thời gian chờ, không bỏ lần thử lại, và ca «DB tắt hẳn» vẫn đòi mã thoát khác 0.
- Không làm chậm. Bỏ sleep giả trên bản chép thì job-exit chạy 103 giây (57/57 xanh), có sleep giả thì 3 giây.
- Không lộ mã nguồn mới. Literal `"chotot-ads"` vẫn đúng 1 dòng như trên main, nay nằm trong hằng `S06_PIPE`. Mọi chỗ dùng ở dòng 365–405 (helper và registry của GT-AC-1). IDS canh của AC-7 không đổi.
- Symlink mới `mut-root/scripts → <kho>/scripts` chỉ được đọc. Chạy xong cả hai bộ, `git status` không có tệp nào đổi.
