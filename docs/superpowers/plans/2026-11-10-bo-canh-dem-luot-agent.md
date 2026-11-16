# Kế hoạch còn lại — bo-canh-dem-luot-agent (T3, Cổng 1.5)

Hồ sơ `_acceptance/bo-canh-dem-luot-agent/` — Mạnh duyệt Cổng Phạm vi 06/11 (11 tiêu chí AC-1…AC-11, 14 eval). ZCode code trên
`zcode/bo-canh-l4d-v3` (@5955fe85, qua ba vòng MỞ LẠI 0511-16) rồi hết hạn mức tuần; liên làn làm thay từ 10/11 theo lời giám sát.
Đây là tiền đề của `ma-album-s03` (tiền kiểm AC-7 của album đòi bộ canh đã đếm lượt agent đang chạy). Nhánh làm:
`feat/bo-canh-dem-luot-agent`.

## Tóm tắt cho người duyệt

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Lượt agent chạy nhanh (như tin riêng 30/10) không còn lọt: bộ canh đếm dòng trên kho phiên của mọi agent, có dòng mới là tắt gateway, nêu tên agent | `scripts/zalo-watchdog.sh` khối L4d | AC-1…AC-4 |
| Đọc kho hỏng/khoá/sai khuôn thì tắt và nói lý do, không coi là 0; chỉ đếm, không đọc nội dung phiên | khối L4d | AC-5, AC-7 |
| Sau một lần tắt, bật lại mà chưa ai xử mốc thì tắt tiếp — người phải đọc trước khi bật lại | khối L4d, thư mục mốc | AC-6 |
| Phép thử không đụng gateway, tiến trình, tệp cảnh báo thật; đọc thật trong môi trường launchd | `scripts/watchdog-l4d-agentdb/` | AC-8, AC-9 |
| Tài liệu nói gộp là có hiệu lực, kiểm gì, ai xử mốc, xử thế nào, lùi ra sao, L4d không thấy gì | `runtime-map`, `runbook-openclaw-hook` | AC-10 |
| Dò chuỗi L4b cũ không hụt khi khối log lớn hơn bộ đệm pipe | khối L4b | AC-11 |

## Task

| # | Việc | Trạng thái | Tệp | Kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|---|---|
| T1 | Lấy code ZCode v3, gộp main mới (sau #403, #407) | XONG @3ce5d5d2, 0 xung đột | scripts/zalo-watchdog.sh | bcdl_tho PASS, l4b-scan PASS, watchdog-song 7/7 | E1–E10, E13–E14 | false |
| T2 | Đưa dấu duyệt Cổng Phạm vi (nằm ở nhánh `fix/s03-bo-canh-dem-luot` 8225574c) vào nhánh | XONG | contract, decisions | contract `approved` | — | false |
| T3 | Viết tài liệu AC-10 (ZCode chưa viết): runtime-map mục L4d + runbook mục «L4d tắt gateway» | XONG (bản này) | docs/ops/runtime-map.md, docs/ops/runbook-openclaw-hook.md | bcdl_tai_lieu exit 0 | E11, E12 | false |
| T4 | Chấm S4 khi tới lượt khoá s4 (giám sát xếp sau N1, P2, P3): mọi eval trên bản chép/giả, riêng E9 đọc chỉ-đọc kho phiên thật | chờ khoá | — | evidence-report | E1–E14 | false |
| T5 | Cổng Bằng chứng (T3 — Mạnh ký) → PR → làn merge gộp | chưa | — | pre-merge sạch | — | false |
| T6 | Sau gộp + pull checkout chính: kiểm 15′ theo runtime-map mục L4d (`.first-done`, mỗi agent một mốc đúng khuôn, «ok», không dòng L4d) rồi chạy tiền kiểm album để xác nhận kiểm 3 xanh | chưa | — | báo giám sát | — | false |

## Lựa chọn tải trọng

- Gộp nhánh ZCode bằng merge (giữ lịch sử ba vòng MỞ LẠI), không viết lại.
- Gộp = có hiệu lực ngay (launchd chạy script từ checkout chính): không có bước triển khai riêng, không đụng gateway. Vì thế T6
  là kiểm sau gộp, không phải cài.
- Không làm thêm ngoài 11 tiêu chí; lớp chặn TRƯỚC lượt agent (thay vì tắt sau) là việc khác.
