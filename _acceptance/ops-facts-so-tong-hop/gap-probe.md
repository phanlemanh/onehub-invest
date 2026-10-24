---
slug: ops-facts-so-tong-hop
at: 2026-10-24T10:40:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Không AC nào chạy vòng trọn bên ghi thật → route ingest thật → ops_heartbeat → readOpsFacts; AC-9 dùng dòng viết tay | Bên ghi phát khoá khác bên đọc chờ (vd measured_at) hoặc route gọt khoá blocks: E1, E2, E9 xanh nhưng trên prod mọi khối none/stale | Bản tin thật POST qua handler ingest thật trên lược đồ tạm rồi readOpsFacts; chiều đỏ đổi tên measured_at | fixed: AC-9 thành (cross-layer) — bản tin thật qua handler ingest thật, measuredAt khớp bên ghi, freshness bằng check-freshness, chiều đỏ đổi tên measured_at; Đường đo ghi lại theo AC-9 |
| P0 | evals | Fixture launchctl «bản chụp thật» có nhãn launchd mang tên nguồn thật lên kho công khai, sổ không ghi lựa chọn | Commit fixture đưa tên nguồn thật lên GitHub công khai | Fixture tên giả hoặc giữ chỗ gitignored, kèm dòng sổ chỉ-người | rejected: tệp scripts/fixtures/launchctl-list-2026-10-23.txt đã commit từ vòng audit-all (23/10, scripts/audit-all.test.mjs) và tên nhãn trùng tên tệp pipeline/cron/*.plist sẵn có trong kho — vòng chỉ đọc lại tệp, không đưa thêm tên nào ra ngoài; ranh giới tầng A của vòng là bản tin lên cloud (AC-6 che S0x, AC-8 bộ soát) |
| P1 | evals | E10 chạy trong npm test có thể bị skip mà vẫn exit 0 | CI hay DB tắt: ca SKIP, E10 đạt mà không đo gì | Ca không skip; thiếu DB/launchctl thì exit ≠ 0 | fixed: AC-10 và E10 ghi rõ ca không có nhánh skip — thiếu DB :5433 hay launchctl thì FAIL nêu thứ thiếu |
| P1 | contract | Ma trận lockdown thiếu ca watchdog báo sự cố (đáp án false) | Bản .mjs đọc dòng sự cố thành null; cloud hiện xám thay vì đỏ khi Zalo có sự cố | Thêm ca wd báo sự cố và gateway có lượt agent; chiều đỏ false→null | fixed: AC-5/E5 thêm ca watchdog báo sự cố, gateway có lượt agent, không gateway (7 ca viết trước) và chiều đỏ false→null nêu tên lớp |
| P2 | contract | AC-7 chỉ ba khối; records24h có thể ra 0 khi bảng vắng mà AC-3 vẫn xanh vì hàm app cũng trả 0 | airbnb_snapshots vắng → records24h n:0 mọi mã, không eval bắt | AC-7 thêm ca bảng snapshot vắng; loại ca lỗi khỏi đối chiếu AC-3 | fixed: AC-7 thêm ca airbnb_snapshots vắng → records24h error; AC-3 ghi rõ đối chiếu chỉ áp khi bảng đọc được; lockdown không có lỗi cả khối (null từng lớp, AC-5) |
