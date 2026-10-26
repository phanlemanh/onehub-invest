---
slug: tin-rao-doi-phuong-noi-post-ids
at: 2026-10-26T10:25:00Z
verdict: findings
p0: 1
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng bỏ coverage-scan lý do tự vòng; sót cách nối «một tin nhiều bài» | Tin hai bài, một bài giữ phường một bài mất phường; hàm lấy tin đầu tiên chung bài, ra không lệch | Thêm trục số tin sau lượt chung bài với một tin trước, gắn ca vào AC-1 | fixed: so theo từng bài thay vì từng tin; AC-1 thêm ca (h)(i)(j), mười ca; dòng sổ coverage-scan thay bằng dòng mới |
| P1 | contract | Không có ca tin còn cùng mã nhưng một phần bài sang tin khác | Bài p1 sang tin mới phường NULL, p2 giữ mã cũ; nhánh cùng mã ra không lệch | Thêm ca (h)(i), assert số ca | fixed: luật so mọi bài của tin trước; ca (h)(i) trong AC-1 |
| P1 | contract | Thùng khongCon không có chặn; không có mồi S03 | Bên S03 đọc post_ids sai, mọi tin S03 đổi mã rơi vào khongCon mà dòng chính vẫn ok | Kiểm bài khongCon không còn trong stg; thêm mồi S03 | fixed: AC-3 chặn «nối hỏng» khi bài khongCon còn trong stg_zalo_posts; AC-2/AC-3 thêm bài mồi S03 qua transform-zalo |
| P1 | contract | AC-3 đo nhãn, không buộc dòng chính và đối chứng cùng một hàm trên cùng cặp chụp | Dòng chính vẫn gọi thước cũ, đối chứng gọi hàm mới; cả hai xanh | Mồi đi qua đúng đường đo chính | fixed: chụp 0 → lượt A → chụp 1 → lượt B → chụp 2; dòng chính và đối chứng đều là lechTheoBai, đối chứng phải bằng đúng hai bài mồi và 0 tin thật |
