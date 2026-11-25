# Kế hoạch thi công — s03-jpg-path-fallback (ZC16)

Cổng Phạm vi qua làn V (T2, phản biện 0 P0, sổ 0 câu hỏi) 25/11, cửa phủ quyết mở. Xếp chồng trên ZC15. Task tuần tự.

| # | Việc | Files | Lệnh kiểm | Phục vụ | Trạng thái |
|---|---|---|---|---|---|
| T1 | Gộp `zcode/s03-jpg-path-fallback` @f6dcdf3fe, gộp tay với ZC15 (đuôi theo byte, bỏ isJxl trùng) | collector/src/core/media-fetch.ts, collector/src/test/media-fetch.test.ts | `cd collector && npm test` | E1, E4 | xong |
| T2 | Bỏ `urlFetched` (phán GS), assert tên tệp băm URL đã tải; ca không thử lại sai chỗ, timeout, chuyển hướng ra ngoài | như trên | 88/88; `probes/tu-thu.sh` TU-THU PASS | E2, E3, E5–E7, E9 | xong |
| T3 | Hồ sơ áp chung ZC15, `kiem-sau.mjs` (≤5% ảnh /jpg/ lỗi 400, --ty-le), round-trip nhánh/ZC15 | _acceptance/s03-jpg-path-fallback/ap-may-thu/** | `kiem.sh` AP-MAY-THU PASS | E8 | xong |
| T4 | Lượt chấm S4 (khi dãy ZT đổi sang worktree này, được cấp s4): gộp nhánh ZC15 mới nhất + `origin/main`, sinh lại tệp máy sinh | — | evidence-report.md | mọi E | chờ s4 |
