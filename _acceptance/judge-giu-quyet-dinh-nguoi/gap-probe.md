---
slug: judge-giu-quyet-dinh-nguoi
at: 2026-10-30T14:33:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ d-3 ghi `muc-tieu` cho lựa chọn so phường cùng khoá thẻ duyệt. Câu trích chỉ tả khoaPhuong làm gì, không quyết rằng luật máy phải kế thừa giới hạn phường số của nó. Lối khoá riêng vẫn sống. d-5 tựa lập luận vòng tròn vào d-3 | Mạnh ký Cổng 1 vì tưởng Ngoài-8 đã hết. Cặp «Phường 12» với «P.12» cùng căn vẫn ra `no` | Dòng `chi-nguoi` thay d-3, nêu hai lối kèm giá | human-gate1: dòng d-20261030T143242Z-6 (Hỏi-1) thay d-3; d-5 đi theo câu trả lời |
| P0 | design | Sổ d-4 ghi `mot-loi` cho lối chép hàm. Lối tách module trong app bị loại vì «ngoài vùng hàng», mà sổ chưa trỏ nguồn của ràng buộc ấy | Hai bản trôi lệch mà người ký tưởng đã chặn | Dòng thay d-4 nêu ràng buộc thật | fixed: dòng d-20261030T143242Z-7 thay d-4, trích ô cơ hội nêu vùng giám sát giao (hang-viec.json `ranh_gioi`) |
| P1 | evals | E4 không nói bước slug hoá của bản app lấy từ đâu | App đổi slug, E4 vẫn xanh | Ghim nguồn slug, đối chứng đỏ | rejected: thân khoaPhuong của app tự slug hoá ngay trong hàm (chuỗi normalize/replace), không gọi slugifyName — bản rút mang theo phần slug |
| P1 | evals | Ma trận AC-4 «≥ 16 cặp», không viết trước số cố định, thiếu ô «Phượng» | Ma trận không phủ trục Coverage mà vẫn xanh | Liệt đủ N cặp, assert = 2N | fixed: E4 liệt đúng 18 cặp kèm nhãn, có «Phượng Dực», 36 assert |
| P1 | contract | AC-2 chọn ghi lên thẻ anh em còn chờ khi người quyết một chiều, không dòng sổ nào ghi | Hai tín hiệu trái nhau trên một cặp | Dòng sổ cho hành vi thẻ anh em | fixed: AC-2 đổi sang không sửa thẻ nào của cặp, theo luật «người đã quyết cặp này — không sửa» của judge-run (dòng d-20261030T143242Z-8) |
