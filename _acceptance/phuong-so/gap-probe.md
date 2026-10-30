---
slug: phuong-so
at: 2026-10-30T17:10:00Z
verdict: findings
p0: 0
p1: 2
p2: 3
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E2 chỉ trỏ 21 ô cũ sang hồ sơ trước, không liệt kê; ô lệch đầu tiên của đối chứng đỏ dựa vào thứ tự không thấy được | Người ký tưởng chỉ một ô đổi; đối chứng đỏ dừng ở ô khác, thông điệp ghim sai | Viết đủ 21 ô cũ theo thứ tự, đánh dấu ô đổi, nêu ô lệch đầu của từng đối chứng đỏ | fixed: E2 liệt kê 32 ô theo thứ tự, ô (21) là ô duy nhất đổi nhãn, cả hai đối chứng đỏ dừng ở (21); E1 ghi rõ 6 ô KP-AC-1 cũ nằm trong 14 ô và ô lệch đầu của đối chứng đỏ |
| P1 | design | Câu trích của dòng d-2 không quyết «12» trần phải Lệch; lối Thiếu hay khớp mọi cấp vẫn sống | Mạnh ký vì tưởng lời mình đã quyết, máy tự chọn | Trích câu giao hoặc đưa thành câu Hỏi | human-gate1: thành Hỏi-1 (dòng sổ chi-nguoi, yêu cầu can-nguoi gửi giám sát), máy khuyên Lệch |
| P2 | evals | E4/E5 ghim «không ô nào đổi» bằng bước soát diff, không phải đầu ra máy | Người làm sửa nhãn một ô TPL/AC-5 cho xanh, E4/E5 vẫn exit 0 | So mảng ô giữa nền và HEAD bằng máy | deferred: các ma trận giữ lại đã assert độ dài trong test; người chấm S4 soát diff hai tệp test trên vùng `paths` — một phép so máy là việc của kit |
| P2 | contract | Trục Coverage có ô xã/thị trấn × viết tắt («TT.12», «X.12») không AC nào | Ai đổi cách sinh khoá thì «TT.12» lật nhãn không eval nào đỏ | Thêm cặp hoặc ghi Out of scope | fixed: thêm vào Out of scope (contract) và Ngoài phạm vi (design §6) |
| P2 | design | Không nói mẫu chạy trên dạng chuẩn hoá nào; NFD chưa phủ | «Phường 12» dạng NFD rơi về đường cũ, Lệch với dạng NFC | Ghi bước chuẩn hoá, thêm cặp NFD | fixed: design §2 ghi NFC + trim + chữ thường trước khi so; E2 thêm ô (28) NFD/NFC khop |
