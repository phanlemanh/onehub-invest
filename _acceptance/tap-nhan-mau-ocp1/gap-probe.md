---
slug: tap-nhan-mau-ocp1
at: 2026-10-30T05:20:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Không eval nào so tệp kiểm mau-kiem.jsonl đã commit với bản sinh lại; E1 không so hàm với lệnh | Sửa khuôn mà không sinh lại tệp kiểm, E9 chấm bản cũ | Assert tệp kiểm trùng byte bản sinh lại, sha của hàm trùng sha của lệnh; đối chứng 'TEP KIEM CU' | fixed: AC-1 + E1 thêm so tệp kiểm và so hàm với lệnh, đối chứng đỏ 'TEP KIEM CU' |
| P1 | evals | E6 chưa ghim luật khớp tên, không có đối chứng xanh, vùng quét thiếu bể giá trị và tệp kiểm | Tên người gửi «Ocean Park» làm E6 đỏ sai; giá trị bể không được chọn lọt lên kho công khai | Khớp nguyên tên NFC + chữ thường có ranh giới từ; đối chứng xanh chữ nghiệp vụ; quét chữ nguồn và tệp kiểm | fixed: AC-6 + E6 ghim luật khớp, thêm đối chứng xanh, mở vùng quét sang chữ nguồn bộ sinh và mau-kiem.jsonl |
| P1 | contract | AC-5 chỉ đo goc có trong lát, không đo quan hệ khuôn rút từ tin ấy | Khuôn viết tay gán băm thật bất kỳ vẫn qua | So đoạn chữ cố định theo thứ tự với chữ tin gốc, ngưỡng viết trước, goc không trùng | fixed: AC-5 + E5 đo phủ ≥ 80% đoạn cố định theo thứ tự, goc không trùng, ba đối chứng đỏ |
| P1 | design | Dòng sổ một-lối về cách lưu tập: lối bảng eval riêng qua migration vẫn sống | Cổng duyệt một lựa chọn có lối thay thế mà người ký không được hỏi | Dòng mới supersedes, hoặc chuyển thành câu hỏi | fixed: thêm Hỏi-3 (chỉ người, supersedes dòng cũ), design §1 nêu lối bảng riêng và giá |
| P2 | contract | Coverage tuyên trục chéo và dạng viết mà AC-4 không phủ đủ | Không có tin inquiry × rent_lt hay dạng «Vinhomes Ocean Park» mà E4 vẫn xanh | Ma trận toàn phần theo tên, số assert = số phần tử | fixed: AC-4 + E4 thành ma trận 37 ô theo tên × ba seed, đối chứng đỏ inquiry×rent_lt |
