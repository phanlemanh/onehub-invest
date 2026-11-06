---
slug: the-hai-nguoi-xep-sau
at: 2026-11-06T04:45:00Z
verdict: findings
p0: 0
p1: 1
p2: 8
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract / evals | Không eval nào đo trên lát thật s03-theo-nhom, nơi 6/25 nhóm kẹt | Dữ liệu thật có tổ hợp lát thử không có, nhóm vẫn kẹt mà E1–E5 xanh | Đầu dò chỉ đọc trên DB máy thu, mọi người đã gắn và một người mới, từng nhóm | fixed: AC-4 và E6 probes/lat-that.mjs (giao dịch READ ONLY, tinKe thật): mới 0 nhóm kẹt, cũ 14; tin đơn người mới với tới 43 → 276 |
| P2 | THN-AC-1 | Câu «B nhận i1 trước» không phân biệt được khoá cặp-trước | Bỏ khoá cặp-trước vẫn xanh ở nhánh nhóm | B hỏi tin kế khi nhóm còn tin đơn trống, đột biến bỏ khoá | fixed: A gắn i3, B nhận i3 khi i2, i4 trống; đột biến bỏ khoá cặp-trước, thông điệp CAP TRUNG KHONG DUNG TRUOC |
| P2 | THN-AC-1 | Nhánh nhom = null không có lát thử tin trùng đứng trước | Bản chỉ áp khoá khi có nhóm vẫn xanh | Dãy không chọn nhóm | fixed: dãy cả lát [2, 4, 5, 6, 1, 3, null] |
| P2 | THN-AC-1 / Coverage | Chỉ một tin trùng, thứ tự giữa các tin trùng không đo | Tin trùng giảm dần vẫn xanh | Hai tin trùng i1, i3 | fixed: dãy nhóm [2, 4, 1, 3, null]; Coverage thêm «một hay nhiều», «chọn nhóm», «lát thật» |
| P2 | AC-1 tiến độ | nhomCuaLat không assert | Sửa nhẹ số còn của nhóm không bị đo | Assert U-A trước, sau | fixed: [4, 4, 0] → [4, 0, 2] |
| P2 | probes/pham-vi.sh | Lọc dòng mã theo tiền tố, không đối chứng | Thêm mã trên cùng dòng ORDER BY vẫn qua | Khớp nguyên dòng, ca đối chứng | fixed: khớp nguyên dòng cũ và mới (-x -F), đòi có dòng mới, ca đối chứng dòng WHERE giả và ORDER BY có thêm mã phải bị bắt |
| P2 | probes/pham-vi.sh | git diff dò đổi tên | Đổi tên tệp ngoài danh sách vào docs/ lọt | --no-renames | fixed: git diff --no-renames |
| P2 | probes/pham-vi.sh | Điểm rẽ lùi về main lặng lẽ khi nhánh nền có commit mới | Đỏ giả | In điểm rẽ và lý do; báo nhánh nền chưa cập nhật | fixed: in «diem re <sha> (<lý do>)»; nhánh nền có commit chưa nằm trong HEAD thì NHANH NEN CHUA CAP NHAT, thoát 2 |
| P2 | config thn_app | --test-name-pattern không khớp ca nào vẫn thoát 0 | Ca bị đổi tên, E1 xanh không chạy gì | Đòi «pass 1» | fixed: lệnh pipefail đòi dòng «pass 1» trong đầu ra |
