---
slug: danh-ba-toa-theo-phan-khu-hieu-luc
at: 2026-11-17T12:13:29Z
verdict: findings
p0: 1
p1: 4
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals (E3) · contract AC-1, AC-3 | «Tổng toà không đổi» đo bằng `tong.toa` của dải số, mà số này đọc `SQL_TONG` (count buildings active), câu hàng không đụng tới — xanh rỗng. | Lớp đọc join view ra trùng dòng (toà hai bí danh S09) hoặc quên lọc status (view trả cả toà gộp/nghỉ) → soToa phình mà E3 xanh. | Tổng soToa trên dự án gốc = đếm toà active theo view; count(*) = count(DISTINCT) trên view; fixture có toà hai bí danh S09 và toà merged nối S09; chiều đỏ bỏ lọc status. | fixed: E3 thêm đẳng thức tổng cây theo view và count = count DISTINCT; E1 thêm T5 (hai bí danh S09) và T6 (merged, nối S09), bảng kỳ vọng D (5,1,5), K (3,0,4), và chiều đỏ thứ hai «bỏ lọc status» ghim «TTH-AC-1 nút K lệch bảng» |
| P1 | evals (E4) · contract AC-4 | Không chạy lại probe `registry-doi-chieu` (tdb_doi_chieu) — nó đếm tổng toà trên dự án gốc theo `b.region_node_id` (dòng 56–61) rồi so với lớp đọc. | Toà gốc ngoài cây mà có S09 → TDB-DC đỏ trên DB máy thu sau khi gộp, không ai chạy. | Eval chạy tdb_doi_chieu; sửa dòng 56–61 sang view. | fixed: thêm E5 = config:executors.test.tdb_doi_chieu; probe đổi phép đếm sang nút hiệu lực (trong ranh giới app/probes/registry*) |
| P1 | evals (E4) · design §2 | Chiều đỏ TDB-AC-2 thay đúng chuỗi CTE `toa` cũ; viết lại CTE thì `banChep` hỏng, sửa sai thì mất răng. Fixture TDB không có S09 nên không chạm đường mới. | Người làm sửa chuỗi đột biến làm mất phép đo trạng thái toà. | Ghi rõ chuỗi mới vẫn bỏ lọc status và vẫn đỏ với T3; dựng v_s09_toa, v_toa_nut_vung theo thứ tự phụ thuộc. | fixed: E4 và design §2 ghi đúng hai điều ấy; đường mới do E1/E2 phủ bằng fixture riêng có S09 |
| P1 | evals (E2) · contract AC-2 | E2 chỉ đòi cụm «S09 xếp lại, gốc: D», không đòi tên nút hiệu lực đứng trước. | hang-toa in tên gốc thay tên hiệu lực mà E2 vẫn xanh. | phu T1 bắt đầu bằng K, T2 bằng C, T3 không tên nút; chiều đỏ dùng nutIdGoc cho tên chính. | fixed: E2 và AC-2 đòi tên hiệu lực đứng đầu; thêm chiều đỏ «TTH-AC-2 T1 sai nút» |
| P1 | evals (E2) · contract AC-2 | Tên nút gốc trong cụm mới chưa thử qua bộ che tên nguồn. | Tên nguồn thật (tầng A) lọt vào HTML khi lấy tên gốc từ danh sách thô. | Tên D chứa chuỗi khớp source_registry.real_name; HTML không chứa chuỗi thật. | fixed: E1/E2 đặt tên D chứa tên nguồn thật thử, E2 đòi HTML chỉ có bản che; design ghi tên gốc qua bộ che. Không thêm chiều đỏ «bỏ che» riêng: TDB-AC-7 sẵn có đã đo bộ che trên cùng hàm che |
| P2 | contract (Coverage) · design | Hai ca biên (hiệu lực sang dự án khác; gốc ngoài cây con) chỉ ghi 0 dòng, không có thước giữ số 0; khúc pk của view không ràng cùng dự án. | sector_id gắn nhầm làm toà biến khỏi trang dự án gốc, tên gốc «undefined». | Probe đếm toà khác dự án gốc = 0; hang-toa tra tên gốc trên toàn danh bạ. | fixed: E3 đòi «khác dự án 0» và in số; Coverage chuyển ô ấy vào phạm vi AC-3; design: tên gốc tra trên toàn bộ nút |
| P2 | evals (E2) | «Căn đi theo toà» không phân biệt mã cũ/mới trong fixture; không chiều đỏ cho du-an.ts đọc cột gốc. | SQL_CAN giữ cột gốc mà E2 xanh. | Ghi đối chứng dương; thêm chiều đỏ du-an.ts. | fixed: E2 ghi «đối chứng dương»; thêm chiều đỏ bản chép du-an.ts đọc b.region_node_id → «TTH-AC-2 T1 sai nút» |
| P2 | contract · evals (E3) | Lộ trình khai tieu_chi: 6, hợp đồng 4 AC; bat_khi nói «trên /ops/registry» mà chưa có phép đo trên HTML trang danh sách; «mười bảng không đổi» trong READ ONLY xanh theo định nghĩa. | Cổng tưởng đã phủ màn hình. | Khớp số 6 hoặc ghi lý do; assert trên HTML RegistryContent. | fixed một phần: E2 thêm ô Toà của K trên DOM RegistryContent; bỏ câu «DB không đổi số dòng» khỏi AC-3. rejected số 6: tieu_chi của lộ trình là ước lượng lúc cắt hàng, hợp đồng là nguồn sự thật; bốn AC phủ đủ câu giao và bat_khi |
