# Kế hoạch thi công — s03-media-r2-allowlist (ZC15)

Cổng Phạm vi qua làn V (T2, phản biện 0 P0, sổ 0 câu hỏi) 25/11, cửa phủ quyết mở. Mọi task tuần tự (`independent: false`).

| # | Việc | Files | Lệnh kiểm | Phục vụ | Trạng thái |
|---|---|---|---|---|---|
| T1 | Gộp nhánh ZCode `zcode/s03-media-r2-allowlist` @573820d37 (r2.dev mặc định) | collector/src/core/media-fetch.ts, collector/src/test/media-fetch.test.ts | `node --test dist/test/media-fetch.test.js` | E1, E2 | xong |
| T2 | Hậu tố host thêm từ `<stateDir>/media-host-suffixes.txt` + `ONEINVEST_MEDIA_HOST_SUFFIXES`; Accept; JPEG XL đuôi `.jxl` | collector/src/core/media-fetch.ts, collector/src/api/server.ts, collector/src/test/media-fetch.test.ts | `cd collector && npm test` 85/85; ba đột biến đỏ | E3–E8 | xong |
| T3 | Chốt khuôn `meta.mediaFiles`, chốt không tên thật | _acceptance/s03-media-r2-allowlist/probes/** | `--tu-thu` của hai chốt | E9, E10 | xong |
| T4 | Hồ sơ áp máy thu, `kiem-sau.mjs`, round-trip collector API nhánh/main | _acceptance/s03-media-r2-allowlist/ap-may-thu/** | `bash …/ap-may-thu/kiem.sh` → AP-MAY-THU PASS | E11 | xong |
| T5 | Lượt chấm S4 (khi dãy ZT đổi sang worktree này và được cấp s4): gộp `origin/main`, sinh lại tệp máy sinh | — | evidence-report.md | mọi E | chờ s4 |
