---
slug: eval-classify-theo-chu-ref
at: 2026-11-05T15:25:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Căn cứ dòng trùng cụm trích câu không quyết chuyện chấm; đại diện chưa nhãn thì «chấm một lần» sai | Nhãn lọt vào dòng trùng, cụm chấm 0 lần trong khi AC-3 hứa một lần | AC-3 «tối đa một lần», ca đại diện không nhãn | fixed: sửa AC-3, dòng sổ mới, thêm ca thuần và ca DB |
| P0 | contract | Hai dòng nguồn một-lối còn lối sống: gộp `mat_chu`, thêm khoá detail | Mạnh tưởng chỉ có một lối, 26/176 dòng rời `n` không lời giải thích ở /ops/quality | Đưa thành câu hỏi, ghi số vào design | human-gate1: thành Hỏi-1 |
| P1 | evals | E7 không đo «không có chữ bài thật», đọc chỉ ghim câu đầu | Fixture chép chữ thật mà E7 vẫn xanh | Đối chiếu đoạn chữ stg với dòng thêm, thứ tự câu | fixed: thêm hai phép đo và đối chứng |
| P1 | contract, evals | AC-2, AC-3 đi qua DB mà thiếu tag, dry không ghim số, khuôn detail so với chính lib đang sửa | SQL quên `ghep` mà ca thuần vẫn xanh | Tag cross-layer, E8, E9, ghim số, so mốc và regex thật của dq-labels | fixed: tag, E8, E9, khong_chu 2 khác trung 1, so `KHOA_DETAIL` mốc và regex thật |
| P1 | contract, design | Bỏ tách theo căn cứ không có dòng sổ và giá | Mạnh ký vì tưởng lần chấm đầu đã hết tụt giả | Dòng descope, Context nêu rõ | fixed: dòng descope, Context, design, sẽ nêu ở lời mời |
