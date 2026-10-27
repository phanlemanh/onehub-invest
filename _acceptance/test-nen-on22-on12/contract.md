---
schema_version: 1
feature: test app thôi đỏ nền khi nhiều bộ test dùng chung DB :5433 — giới hạn song song, thử lại lỗi DB tạm thời; chứng CT-AC-1 không còn phụ thuộc nhịp chờ
slug: test-nen-on22-on12
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-10-27T04:27:46Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-27-test-nen-on22-on12-design.md
---

# Acceptance Contract: test-nen-on22-on12

## Context

Căn cứ: hàng `test-nen-on22-on12` của đợt dieu-phoi-dot0-cam-mau (P4, giám sát thêm 27/10 ~00:00Z; ON7-AC-2 gộp theo P4-53,
CT-AC-1 theo P4-59). Đo 27/10: ON7-AC-2 đỏ vì `53300 too many clients` — một lượt test app chiếm đỉnh 53/100 kết nối DB
local; ON22-AC-5 đọc payload của bên ghi mà không kiểm mã; CT-AC-1 đỏ trên CI PR #153 lúc 00:53Z khi route còn ghi nhật ký
NỀN — từ #155 (e627e4fe, 02:20Z) route ghi `ops_audit` trong giao dịch trước khi trả nên cơ chế đỏ ấy hết trên main. Việc: test tự
lập, không đổi hành vi app.

## Criteria

- AC-1: Given DB local `max_connections` 100 và nền (kết nối không thuộc phép đo) ≤ 10, When chạy `cd app && npm test` một
  mình, Then đỉnh kết nối RIÊNG (đỉnh − nền, lấy mẫu `pg_stat_activity` mỗi 100 ms) ≤ 40, bộ xanh và 0 dòng thử lại lỗi DB tạm;
  và 2 × đỉnh riêng app + đỉnh riêng của `cd pipeline && npm test` + 10 ≤ 100 (suy, KHÔNG chạy song song thật trên DB dùng chung). Nền > 10 suốt 2 phút
  → không kết luận. Script `test` của app khai `--test-concurrency=8`.
- AC-2: Given hàm `thuLaiDbTam`, When hàm bọc ném lỗi mã `53300`/`40P01`/`57P03` một lần rồi thành công, Then trả kết quả;
  When ném lỗi tạm 3 lần, Then ném lỗi cuối đúng mã; When ném lỗi khác, Then ném ngay không thử lại. Bản sao bỏ `53300` khỏi tập
  mã làm ca đỏ với thông điệp ghim «lỗi DB tạm thời phải được thử lại».
- AC-3: Given lỗi `53300` tiêm vào `pg.Client.connect` (bản pg của app) k lần, When chạy ON7-AC-2 và ON12-AC-7 (ca DB
  local) từ chính tệp test, Then k=1 → xanh và có dòng «# lỗi DB tạm thời 53300 — thử lại»; k=∞ → đỏ, thông điệp nêu 53300;
  đối chứng: một ca chạm DB không bọc (ON7-AC-6 (a)) với k=1 → đỏ. ON22-AC-5: bên ghi thử lại theo `laLoiBenGhiTam` và khẳng
  định mã thoát bằng 0 kèm stderr TRƯỚC khi trả payload (bên ghi là tiến trình con dùng bản pg của thư mục `pipeline/` — đo cấu trúc).
- AC-4: Given bản sao `cong-tac-nhom-go.test.tsx` (bản hiện tại, không sửa) chèn vào pg (Pool lẫn Client) cho mọi
  `INSERT INTO ops_audit`, When lệnh ghi bị trễ 400 ms nhưng lời gọi CHỜ nó xong, Then CT-AC-1 xanh và trễ trúng ≥ 3 lần; When
  lệnh ghi chạy NỀN sau 400 ms (lớp «ghi nền» trước #155), Then CT-AC-1 đỏ «một dòng nhật ký» — ca canh được lớp lỗi ấy.
- AC-5: Given cây sạch, When chạy trọn `cd app && npm test` 6 lần liên tiếp, Then cả 6 lần 0 ca đỏ, số ca bằng nhau, và 0
  dòng thử lại lỗi DB tạm (thử lại không che tín hiệu áp lực kết nối).
- AC-6: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then chỉ có tệp dưới `app/tests/`,
  `app/package.json` (chỉ dòng script test), hồ sơ này, `_acceptance/config.yaml`, tệp máy sinh, design/plan và dòng ghim lại
  hồ sơ bị chạm; không tệp nào dưới `app/src/`.

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — câu giao nêu đích danh bốn ca; trục: đỉnh kết nối (AC-1), thử lại lỗi tạm (AC-2, AC-3),
  CT-AC-1 không phụ thuộc nhịp (AC-4), lặp xanh (AC-5), không đổi app (AC-6).

## Out of scope

- Nâng `max_connections` của DB :5433 — cần khởi động lại container dùng chung; đề nghị gộp vào hàng `do-nen-hieu-nang`.
- Giảm `max` pool trong `app/src/lib/db.ts` — đổi mã app, không làm.
- Sửa tệp `cong-tac-nhom-go.test.tsx` (nhịp chờ 120 ms còn sót, nay vô hại) — cơ chế đỏ đã hết từ #155, không đổi tệp.
- Truy gốc deadlock ON12-AC-7 khi chưa có nhật ký (P4-60) — xếp cùng lớp lỗi DB tạm thời, chờ nhật ký để xác nhận.

## Notes
