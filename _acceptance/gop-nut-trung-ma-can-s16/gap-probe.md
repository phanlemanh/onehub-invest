---
slug: gop-nut-trung-ma-can-s16
at: 2026-11-21T11:05:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design, evals | Luật «mang tiền tố» bắt nhầm: toà «S1» khớp mã «S10.01». Ca «đúng một ứng viên», kể cả cha và con, không có lượt đo. | Bản dựng bỏ đòi «đúng một», hoặc tính S10.xx là mang tiền tố của S1, mà E1 vẫn xanh. | E1 cấy ca cha và con, ca S1 cạnh S10.01, kèm chiều đỏ. | fixed: AC-1 khai ranh giới tiền tố và ca hai ứng viên trở lên ra «cần người chọn»; E1 thêm hai ca cùng chiều đỏ; probe sửa theo ranh giới mới, số đo không đổi |
| P1 | evals | Không có ca nút qua cả S09 lẫn mã căn mà hai bằng chứng chỉ ra hai nút giữ khác nhau. | Bản dựng xét mã căn trước S09 mà vẫn qua mọi eval. | E1 thêm ca S09 chỉ A, mã căn chỉ B, kèm chiều đỏ đảo thứ tự. | fixed: AC-1 ghi rõ S09 thắng; E1 thêm ca và chiều đỏ |
| P1 | decisions | Không dòng sổ nào phủ đường cloud; d-2 và d-3 ghi kho_dao false. | Kết quả gộp lên cloud ban đêm mà chữ ký không phủ. | Thêm một dòng sổ cho đường cloud. | fixed: thêm dòng sổ cho đường cloud, trích Notes đã ký của DA51 (GS phán 20/11), và thêm Notes trong hợp đồng. Giữ kho_dao false vì đảo được: --dao-noi rồi lượt đêm kế đưa cloud về; asset_nodes là thông tin dự án công khai |
| P2 | decisions | d-5 ghi nguồn mot-loi nhưng lối chết là lời GS; d-7 (bỏ quét hình thái) ghi mot-loi. | Người duyệt hiểu sai nguồn quyết. | Đổi nguồn căn cứ. | fixed cho d-5: dòng mới thay d-5 với lối chết là ràng buộc của máy nối DA46. rejected cho d-7: đây là dòng bỏ quét theo khuôn AUTO-DRAFT của kit, hiện ở khối cắt/hoãn để người duyệt thấy |
| P2 | contract, evals | AC-8 đo bộ đọc PL20 «ở main nếu đã gộp, không thì nhánh», không ghim sha. | PL20 đổi bộ gắn thì E8 đỏ oan, hoặc xanh nhờ việc của hàng khác. | Ghim sha, đo trước và sau trên cùng sha. | fixed: AC-8, E8, Đường đo và hồ sơ áp ghim sha e27d1e690, đo trước và sau trên cùng sha |
