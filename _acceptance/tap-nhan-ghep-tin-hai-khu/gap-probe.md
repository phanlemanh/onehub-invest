---
slug: tap-nhan-ghep-tin-hai-khu
at: 2026-11-13T02:55:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Người duyệt dùng /ops/labels nhưng hợp đồng chỉ khai cli, data và không eval ui-check nào xem màn hiện ba ô cho lát mới | Màn chỉ hiện ô của lát cũ: E5 xanh qua nhapTuDraft nhưng Mạnh không lưu được ba trường, tập đóng băng rỗng | Eval ui-check mở /ops/labels lát hai-khu-ghep, ba ô điền sẵn, sửa rồi Lưu ra ba dòng eval_labels | fixed: thêm surface ui, AC-5 thêm vế trên màn, eval E5b ui-check layer ui-observed |
| P1 | evals | E8 dùng fixture nhãn viết tay theo khuôn bên đọc, không round-trip từ hàm lưu thật, không ca hai người gắn | Màn lưu theo khuôn khác: bộ đóng băng ra ô rỗng mà băm vẫn ổn định; bài hai người gắn ra hai dòng | Fixture sinh qua ghiNhan thật; ca hai người khớp và lệch | fixed: E8 chuyển sang DB thử, nhãn ghi qua ghiNhan, AC-8 thêm một dòng mỗi ref_id và loại bài lệch |
| P1 | design | Bảng mẫu tên nhóm quyết khu mà không thước nào đối chiếu với nhóm thật | Mẫu quá rộng xếp nhóm OCP2/3 vào op1; E3 xanh vì luật vẫn đúng | Bảng kỳ vọng nhóm thật → khu viết trước, một assert mỗi nhóm | fixed: AC-9 và E9 so bảng nhóm → khu với tệp kỳ vọng viết trước tap-nhan-hai-khu-nhom.json, nhóm lạ hay thiếu thì đỏ |
| P2 | evals | AC-9 có mệnh đề hoặc nên không fail được; E9 thiếu layer; không ghim điều kiện DA31 | Chấm trước DA31: tầng toà thiếu nặng mà E9 vẫn xanh | Kiểm danh bạ có toà S09, thoát 2 nếu chưa; tầng dưới 75 thì thoát 1 | fixed: E9 layer backend-effect, thoát 2 «chưa DA31», cả năm tầng đủ 75, tổng 300–450 |
| P2 | evals | Đối chứng DB của AC-4 không có eval; E7 chỉ thu quyền cho module nháp | label-sample truy vấn field_assertions trước khi phân tầng mà E4, E7b vẫn xanh | Thu quyền rồi chạy chọn mẫu; cấy phát biểu không đổi băm | fixed: E7 chạy cả chọn mẫu và nháp trên DB thu quyền, cấy field_assertions không đổi băm (also_covers AC-4); E7b quét cả label-sample.mjs |
