---
schema_version: 1
feature: Bộ canh kênh S03 tắt gateway khi có lượt agent mới dù lượt đó chạy nhanh, nhờ đếm trên kho phiên thay vì dò chuỗi trong log
slug: bo-canh-dem-luot-agent
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config]
status: approved
approved_by: Mạnh
approved_at: 2026-11-06
---

# Acceptance Contract: bo-canh-dem-luot-agent

## Context

Luật 8: agent không bao giờ gửi tin vào nhóm xã hội, và bộ canh kênh S03 là chốt cuối khi các lớp khác hở. Lớp L4b chỉ dò chuỗi `auto-reply/agent-turn-timing` trong log, mà chuỗi này chỉ in khi lượt từ 10 giây hoặc có một giai đoạn từ 5 giây (`totalWarnMs = 1e4`, `stageWarnMs = 5e3`). Lượt nhanh không bị tắt.

Đo 05/11, chỉ đếm: agent `main` có 8 `transcript_events`, 1 phiên, 30/10 09:52–09:53; agent `watcher` là 0 từ 22/10. Bộ canh tắt gateway lúc 09:54 vì lượt đó kịp in dòng timing. Lượt chậm 30/10 không chứng minh lỗ đã từng xảy ra, chỉ chứng minh lớp này phụ thuộc vào tốc độ lượt.

Giám sát quyết 05/11: làm trước khi khởi động lại gateway cho mã album, hồ sơ T3 riêng. ZCode soạn L4d trên nhánh `zcode/l4d-agentdb-canhs03` (`caaa1fca`, `e41c4620`); làn Claude review và viết tài liệu. Việc đóng tin riêng kênh S03 là lời giao riêng (`claudedp-0511-17`), không thuộc hồ sơ này.

Source input: `claudedp-0511-16`, `zcode-0511-27`, `zcode-0511-29`, `claudedp-0511-18`; tin giám sát 05/11.

## Criteria

- AC-1: Given đã có mốc, When một agent có thêm `transcript_events` mà log không có dòng timing, Then bộ canh tắt gateway và ghi lý do nêu tên agent; Given số dòng không đổi mà `MAX(created_at)` tăng, Then cũng tắt; Given dòng timing xuất hiện, Then L4b vẫn tắt như trước và phép thử L4b cũ vẫn đạt.
- AC-2: Given lần chạy đầu của L4d với lịch sử có sẵn, When bộ canh chạy, Then ghi đúng một mốc cho mỗi kho phiên và không tắt; Given chạy lại mà kho phiên không đổi, Then không tắt; Given lần đầu bị tắt giữa vòng vì một kho đọc lỗi rồi được bật lại, When kho đã có mốc có dòng mới, Then tắt và mốc giữ nguyên.
- AC-3: Given một agent không liệt kê sẵn trong script, When agent đó có `transcript_events` mới, Then bộ canh tắt; Given sau lần chạy đầu xuất hiện kho phiên mới có dòng, Then tắt ngay, không ghi mốc; Given kho phiên mới rỗng, Then ghi mốc, không tắt.
- AC-4: Given số dòng giảm mà `MAX(created_at)` không tăng, When bộ canh chạy, Then ghi WARN, cập nhật mốc, không tắt; Given số dòng giảm mà `MAX(created_at)` tăng, Then tắt.
- AC-5: Given kho phiên hỏng, thiếu bảng, cột đổi tên hoặc đầu ra lệch khuôn `số|số`, When bộ canh chạy, Then tắt và nêu lý do, không coi là 0; Given kho chế độ rollback bị khoá EXCLUSIVE ngắn hơn tổng thời gian chờ, Then không tắt; Given khoá dài hơn, Then tắt; Given kho WAL không có kết nối nào và không có tệp `-wal`, `-shm`, Then đọc đúng số và không tắt; Given một tiến trình khác đang ghi WAL suốt lúc đọc, Then đọc được và không tắt.
- AC-6: Given bộ canh đã tắt vì L4d, When gateway được bật lại mà mốc chưa được xử, Then lượt kế tắt tiếp và mốc giữ nguyên; dòng cảnh báo nêu đường mốc cần xử; Given người đã xử mốc, Then L4d không tắt nữa nếu không có dòng mới; Given mốc rỗng hoặc sai khuôn `số|số`, Then tắt, nêu mốc hỏng và giữ nguyên tệp mốc; mốc được ghi nguyên tử.
- AC-7: Given mã L4d, When kiểm câu truy vấn, Then chỉ có `COUNT(*)`, `MAX(created_at)` với `mode=ro`, không đụng `event_json`, `event_zstd`, `navigation_json`; với kho có chuỗi canary trong cột nội dung, dòng cảnh báo và log không chứa chuỗi đó; băm kho chính không đổi sau khi đọc, và tệp mới duy nhất được phép sinh là `-shm` khi đã có `-wal`.
- AC-8: Given phép thử L4d, When chạy, Then `launchctl`, `pkill`, `pgrep`, `osascript`, `curl`, `sleep` đều là bản giả và kiểm trước khi chạy, sai thì thoát 2; launchd gateway thật, tiến trình gateway thật và tệp cảnh báo thật không đổi sau phép thử.
- AC-9: Given môi trường launchd (`env -i`, PATH tối thiểu, `/bin/bash` 3.2), When gọi đúng hàm đọc của script trên kho phiên thật và trên bản chép của kho đó đã đóng sạch `-wal`, `-shm`, Then mỗi lần in đúng `số|số`, thoát 0, không in gì khác; nếu đọc lỗi thì in không được gộp.
- AC-10: Given bản sửa xong, When đọc cả `runtime-map` và `runbook-openclaw-hook`, Then có: gộp là có hiệu lực vì launchd chạy script từ checkout chính, lần chạy đầu ghi mốc, kiểm gì sau khi gộp, ai xử mốc sau một lần tắt và xử thế nào, kiểm phiên dở trước khi bật lại, lùi gồm xoá thư mục mốc, các lượt L4d không thấy, các điều chưa đo. (judgment)
- AC-11: Given khối log mới lớn hơn bộ đệm pipe (400 KB) có dòng timing ở đầu, When L4b quét trên `/bin/bash` 3.2 với `pipefail`, Then vẫn khớp và tắt; Given khối log không có dòng timing, Then không tắt.

## Coverage

- Trục nguồn tín hiệu: kho phiên (AC-1) · log giữ song song (AC-1, AC-11).
- Trục trạng thái mốc: lần đầu, lần đầu bị ngắt (AC-2) · agent mới (AC-3) · số giảm (AC-4) · sau khi tắt, mốc hỏng (AC-6).
- Trục lỗi đọc: hỏng, thiếu bảng, lệch khuôn · khoá ngắn, khoá dài trên rollback · WAL nhàn rỗi, WAL đang ghi (AC-5).
- Trục an toàn: không đọc nội dung (AC-7) · phép thử không chạm máy thật (AC-8) · chạy được trong môi trường launchd (AC-9).
- Thước đối chiếu: đo 05/11 ở Context; nguồn runtime cho hai ngưỡng log [CE chưa kiểm chứng: thời gian giữ khoá lúc migration khởi động chưa đo].

## Out of scope

- Không khởi động lại gateway, launchd hay sửa `~/.openclaw` trong hồ sơ này.
- Không đóng tin riêng, không đổi danh sách ghép đôi: lời giao riêng `claudedp-0511-17`.
- Không đổi các lớp L1, L2, L3, L4a, L4c, L5 và cách tắt của `alert()`; L4b chỉ sửa đúng cách dò chuỗi (AC-11).
- Không chặn lượt trước khi chạy: L4d chỉ phát hiện sau, trễ tối đa một nhịp 5 phút, và có lượt không thấy được (Notes).
- Không đọc chữ tin hay nội dung phiên, không điều tra thêm lượt 30/10.

> Out of scope = scope-truth (Gate 1 duyệt mục này). Rationale từng mục ở `decisions.jsonl`.

## Notes

- Gộp là cài: launchd chạy script từ checkout chính qua symlink, nên `git pull` xong thì nhịp kế là lần chạy đầu của L4d. Không có bước khởi động lại nào. Xếp gộp sau `claudedp-0511-17`, ngoài khung 02:00–05:00 của việc đó.
- Sau gộp, trong 2 nhịp: log ok có dòng mới, có thư mục mốc, mỗi agent một mốc, tệp cảnh báo không có dòng L4d. Lùi: revert PR và xoá thư mục mốc; để mốc lại thì lần gộp sau sẽ tắt gateway vì dòng phát sinh giữa chừng.
- Điều kiện của `ma-album-s03` AC-7 («bộ canh đã vá đang chạy») do hồ sơ này gỡ.
- Đo 05/11 trên kho giả bằng `/usr/bin/sqlite3`: kho WAL đã đóng sạch tệp phụ đọc bằng `mode=ro` lỗi `unable to open database file`, đọc bằng `immutable=1` được và không sinh tệp. Kho thật lúc đo có `-wal` (0 byte), `-shm` nên đọc `mode=ro` được; trạng thái kia có thể xảy ra vì SQLite xoá hai tệp này khi kết nối cuối đóng sạch. Chưa đo trên kho thật sau một lần đóng sạch.
- Giới hạn đã biết: trên kho rollback, khoá giữ lâu hơn tổng chờ thì tắt gateway; chưa đo migration lúc khởi động giữ khoá bao lâu, nên lần khởi động lại đầu sau khi gộp phải có người canh. Mốc cố ý không tiến sau khi tắt, nên ai bật lại mà chưa xử mốc sẽ bị tắt sau tối đa 5 phút. Lượt bị `kill -9` giữa chừng có thể được khôi phục khi bật lại và ghi thêm dòng (đọc mã, chưa đo), nên phải kiểm phiên dở trước khi bật. Một lượt nhanh vẫn chạy xong trước khi bị tắt; bản vá này không ngăn được nó gửi tin.
- L4d không thấy: lượt `BOOT.md` (xoá phiên sau khi chạy, số về như cũ) và phiên incognito (kho trong bộ nhớ), theo mã `~/dev/openclaw`, chưa đối chiếu bản đang chạy. 05/11: hook đang bật chỉ có hook thu, 0 tệp `BOOT.md` trong 3 tầng thư mục OpenClaw.
- Agent mới xuất hiện đúng trước lần chạy đầu thì bị tính vào mốc; chấp nhận vì 14 ngày qua chỉ có 1 ngày có lượt.
- Việc còn phải làm sau Cổng Phạm vi: ZCode sửa mã và thêm ca theo `gap-probe.md`, phép đọc thật `doc-that.sh` (AC-9), gom tên thật về một hằng; làn Claude viết tài liệu (AC-10).
