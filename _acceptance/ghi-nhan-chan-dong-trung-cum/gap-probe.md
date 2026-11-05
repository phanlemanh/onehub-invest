---
slug: ghi-nhan-chan-dong-trung-cum
at: 2026-11-05T22:40:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ «không sửa route, không sửa màn» ghi nguồn mục tiêu, nhưng câu trích ở label-form.tsx chỉ tả hành vi hiện có, không quyết lựa chọn | Người duyệt tưởng mã màn đã quyết đường 409 chung trong khi máy tự chọn | Thay căn cứ bằng lối chết nêu được, hoặc đưa thành câu hỏi | fixed: dòng sổ mới supersedes d-20261105T222446Z-4, nguồn một-lối: sửa route chạm đường T3 trong t3_paths mà route chỉ chuyển nguyên kq; nhánh riêng ở màn vẫn ra cùng câu toast nên chỉ thêm mã |
| P1 | evals | Fixture bốn loại dòng và trung_voi viết tay, không rút từ lệnh ghép thật; không đo quan hệ tập bị chặn bằng tập bị bỏ khỏi hàng | Lệnh ghép thật ghi khuôn khác fixture, đại diện cụm bị chặn mà E2 vẫn xanh | Sinh ghep bằng ghepLat thật trên lược đồ tạm; so tập item_id nhận TRUNG_CUM với tập tinKe, nhomCuaLat, tienDo loại ra | fixed: E1, E2, E5, E6 dùng ghepLat thật (pipeline/label-ghep.mjs) trên lược đồ tạm, E1 thêm phép so tập; rejected phần khe NULL: ghepLat ghi thẳng giá trị mới bằng một UPDATE mỗi dòng, không qua NULL, nên không có khe |
| P1 | evals | E8 đo public bằng số dòng, không thấy UPDATE hay cặp INSERT rồi DELETE, không đối chứng dương | Fixture rơi vào public, chèn rồi xoá, số dòng bằng nhau mà DB thật đã bị ghi | Bộ đếm n_tup_ins, n_tup_upd, n_tup_del của pg_stat_user_tables trước và sau, đối chứng dương trên lược đồ thử | fixed: E8 đổi sang bộ đếm pg_stat_user_tables của public, đối chứng dương: một UPDATE và một cặp INSERT, DELETE trên bảng lược đồ thử làm bộ đếm cùng loại tăng |
| P1 | evals | E8 chỉ cấm route và components/ops/labels, căn cứ bỏ đặc tả UX nói không tệp nào dưới app/src/app hay app/src/components đổi | Sửa trang /ops/labels mà E8 vẫn xanh | Danh sách được phép đổi, mọi tệp khác đổi thì đỏ | fixed: E8 đổi sang danh sách được phép, đối chứng: bản sao cây sửa một tệp dưới app/src/app/ops thì bị bắt |
| P2 | contract | Thuật ngữ «Dòng trùng cụm» trong CONTEXT.md không có AC hay eval | Ship câu báo mà CONTEXT.md thiếu thuật ngữ | Thêm dòng kiểm vào E8 | fixed: AC-6 thêm vế thuật ngữ, E8 thêm 'ok thuat ngu' cùng đối chứng gỡ mục |
