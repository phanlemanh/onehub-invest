---
slug: m2-ac10-so-cap-co-dinh
at: 2026-10-29T07:40:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Hai dòng sổ máy quyết (ghim cặp 3b3a33e5, không sửa hồ sơ đã ký) ghi nguồn mục-tiêu nhưng câu trích lấy từ hợp đồng aer-ac2 — chỉ liên quan, không quyết lựa chọn của hàng này [dung-m2-song-song#F1]. | Cổng Phạm vi duyệt hai lựa chọn mà căn cứ không đứng; lối khác (bỏ ca, so tại commit gộp) chưa bị loại; E12 của hồ sơ đã ký có thể hoá cũ mà lời «hồ sơ riêng» chưa ai duyệt. | Đổi căn cứ sang một lối ra sống có ràng buộc nêu được; nói rõ lưới trước-merge xử E12 thế nào. | fixed: hai dòng mới mang supersedes, nguồn mot-loi (ref di động đỏ ở mọi nhánh sửa config, bỏ ca là hạ vế đã ký; đổi lời hồ sơ đã ký phải qua người) và nêu đường ghim lại bằng làn máy nếu lưới báo hoá cũ |
| P1 | evals | Cặp đỏ E2 chỉ ghim chuỗi tên ca trong đầu ra — node --test in tên cả ca pass. | Bản cũ đỏ vì lý do khác, ca M2-AC-10 diff vẫn ok, E2 vẫn xanh. | Ghim dòng TAP 'not ok' chứa tên ca và đúng một 'not ok'. | fixed: E2 expected đòi đúng một dòng 'not ok' và dòng đó chứa tên ca M2-AC-10 diff |
| P1 | evals | E4 gọi thẳng requireCommit, không đo hàm đọc blob mà ca dùng. | blobAt bỏ requireCommit → tải nông ra 'fatal: bad object' thô, E4 vẫn xanh. | Đo blobAt với sha 0 (ném hai chuỗi ghim) + đối chứng dương với sha thật. | fixed: AC-4 + E4 đo blobAt, kèm đối chứng dương trả blob có design_floor_gen |
| P1 | contract | AC-2 chỉ dựng origin/main = HEAD; thiếu trạng thái nhánh chưa gộp có sửa config và không có ref origin/main; AC-1 đo bằng quét chuỗi. | Bản sửa lai (so merge-base khi khác HEAD) qua E1, E2 nhưng vẫn đỏ ở nhánh chưa gộp sửa config. | Thêm hai trạng thái ref vào ca clone, bản sửa thoát 0 ở cả hai; bản cũ đỏ ở trạng thái nhánh chưa gộp. | fixed: AC-2/E2 ba trạng thái ref (a) sau gộp (b) origin/main = cha commit thêm khoá (c) không có origin/main; cặp đỏ ở (a) và (b); E1 ghi rõ quan hệ đo ở E2 |
| P2 | evals | E3 chỉ kiểm giá trị trả của hàm so, không xác nhận ca gọi hàm ấy và assert chặt. | Ca viết bằng includes/length ≥ 2 không qua hàm; đổi sha ghim sang cặp khác vẫn xanh. | Tách kiemCapM2(before, after) ném lỗi; đo trên hai bản đột biến; thân ca gọi nó. | fixed: AC-3/E3 đo kiemCapM2 (ném lỗi nêu dòng) và thân ca rút từ nguồn phải gọi kiemCapM2 |
