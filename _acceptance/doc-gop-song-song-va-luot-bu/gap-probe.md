---
slug: doc-gop-song-song-va-luot-bu
at: 2026-11-23T23:27:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

# Phản biện context sạch

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Hỏi-1 và lệnh áp xin ~4,3 USD cho khoảng 22–24/11 nhưng chỉ tính 22–23/11; không ngưỡng xin lại lời khi chạy thử lệch | Áp sau 00:00 25/11 thì 24/11 còn ~2.600–2.900 lời; lượt bù ~8 USD, gấp đôi số đã duyệt, dưới trần 20 nên máy không chặn | Lệnh áp chỉ 22–23/11 hoặc trần USD cho lượt áp; ngưỡng dừng khi ước theo giá thật vượt | fixed: lệnh áp chỉ 22–23/11 kèm `--tran-luot-usd 6`; ngưỡng xin lại lời (ước × 1,42 mUSD > 6 USD thì dừng); Hỏi-1 thay bằng d-…-13; 24/11 để lượt đêm 26/11 đọc trong cửa sổ hôm kia, PR gộp sau 00:00 26/11 thì xin lời mới |
| P1 | design | Bỏ bước hôm kia khi hết giờ không nêu ngày và số; sau 429 nhịp chỉ giảm, không tăng lại | 429 sớm kéo nhịp về 1, hôm qua hết giờ, hôm kia bị bỏ im lặng, ~3.000 bài rơi khỏi cửa sổ không ai biết | Dòng bỏ mang ngày và số còn lại kèm chiều đỏ; ca tăng lại nhịp | fixed: dòng `het-gio: bo buoc hom-kia <ngày> con lai <n>` (n từ chạy thử) vào AC-6/E6 có chiều đỏ; nhịp tăng lại sau 60 s không 429 vào thiết kế, AC-4/E4; sổ d-…-14, d-…-15 |
| P1 | contract | Không AC nào đo hai lượt thật chạy chồng nhau (bù và đêm) | Hai tiến trình cùng đọc một ngày, gọi đôi cùng bài, mỗi bên giữ chỗ tiền riêng nên cùng vượt trần ngày chi | AC + ca test hai tiến trình, lượt sau thoát có mã ghim, 0 lời model; đối chứng tuần tự | fixed: AC-9 + E9 (khoá phiên DB `pg_try_advisory_lock`, mã 6 «dang-co-luot-khac»; `--thu` không giữ khoá); sổ d-…-16 |
| P2 | contract | Dòng sổ song song 4 trích câu audit nêu hai lối nối bằng «hoặc» | Người duyệt tưởng con số 4 đã có lời chốt | Dòng mới nguồn mot-loi | fixed: trước phản biện đã thay bằng d-…-11 (mot-loi, nêu sức chứa 1–2 lời dưới một ngày); lối «tách enrich chạy trước» là sửa `zalo-import-daily.sh`, ngoài làn — ZCode nay làm lưới chia trần theo GS |
| P2 | evals | AC-8 hứa suite `scripts/` của chuỗi đêm xanh nhưng không eval nào chạy nó | Sửa `doc-gop-hang-ngay.sh` gãy ca job-step mà E8 vẫn xanh | Eval chạy bộ test chuỗi đêm | fixed: E8b `config:executors.test.jst_regress` (năm bộ test job, có enrich-buoc-job) |
