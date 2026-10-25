---
slug: soat-tang-a-moi-duong-len-cloud
at: 2026-10-24T08:11:21Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design · contract | Sổ ghi máy quyết phạm vi «cột PII» hẹp (bảng người bán) trong khi lối rộng (danh sách cột cho mọi bảng sync) vẫn sống; contract tự mâu thuẫn «bảng duy nhất mang dữ liệu người» | Cột định danh mới ở bảng sync khác lên cloud, gate xanh, người ký tưởng gate phủ toàn cloud | Đổi thành câu hỏi A/B cho người | human-gate1: thành Hỏi-2 (dòng sổ thay d-3), Đường đo ghi đúng ba bảng và PROXY, bỏ câu «bảng duy nhất» |
| P0 | contract · evals | Dòng sổ «không màn nào đổi» sai — Hỏi-1 = A đổi ô tên tài khoản ở /ops/sources trên cloud; không AC nào đo bản tin THẬT qua bộ soát đóng chặt | Ô hiện trống hoặc «null»; hoặc bản tin thật luôn bị chặn oan, /ops báo máy thu offline mãi | AC đo trang với name null; AC chạy khô trên log thật | fixed: thêm AC-9 (render /ops/sources cloud, name null → mã tài khoản) và AC-10 (bản tin thật chế độ khô → 0 chỗ trúng); dòng sổ mới thay d-6; thêm bề mặt ui + descope ui-observed/design-pass có tên |
| P1 | evals | AC-3 tuyên lớp «trường ngoài jobs» mà chỉ cấy một trường; biên miễn trừ không có chiều đỏ | Miễn theo tiền tố zaloGroups làm lọt zaloGroups[0].<khác>; bộ soát không đi sâu mảng lồng | Ma trận viết trước + đối chứng dương đường miễn | fixed: AC-3/E3 ma trận mỗi khoá cấp một + chuỗi lồng sâu + trường anh em cạnh đường miễn; đối chứng zaloGroups[0].name không bị chặn |
| P1 | evals | AC-7 cấy cột phía cloud, không ca nào cho cột đi qua bên ghi thật | Cột local mới được sync chép lên rồi tráo, gate chỉ đỏ ở lượt sau | Ca pii-cot-writer qua sync-cloud thật | fixed: AC-7(b) cột có ở local rồi sync-cloud thật chạy → gate đỏ, bảng cloud không mang cột, giữ số cũ |
| P1 | contract | Trục «trạng thái bộ soát» thiếu ô đường sync khi danh sách tên rỗng | sync-cloud đọc source_registry lỗi, token rỗng, không chặn | AC đóng chặt cho sync | fixed: AC-6 thêm vế sync-cloud danh sách rỗng → dừng trước khi đẩy bảng, kèm đối chứng dương |
