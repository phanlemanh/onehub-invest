---
schema_version: 1
slug: thu-danh-muc-s07
feature: Phần danh mục dự án của S07 thu theo giải pháp ZCode, ưu tiên Hà Nội và HCM, và nạp vào stg_* không nhân dòng
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh chốt thu S07 ngày 11/11 (lời dẫn qua phiên giám sát dot0-cam-mau); ROADMAP §3 mục 44 Hỏi-4
decided_by: Mạnh
decided_at: 2026-11-10T23:30:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DAZ3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DAZ3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/danh-ba-du-an.md#cc5a831db25ee1071ba8fee913a250b558c97b07` — chưa có trang: trang đợt danh-ba-du-an-0811
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Phần danh mục dự án của S07 thu theo giải pháp ZCode, ưu tiên Hà Nội và HCM, và nạp vào stg_* không nhân dòng

Vì sao: S07 có danh mục dự án toàn quốc, cây dự án con, địa chỉ, chủ đầu tư, pháp lý. Điều khoản cấm thương mại; Mạnh chốt thông tin dự án là công khai (mục 38).

Lời Mạnh khi chốt thu S07 (11/11, phiên giám sát dẫn lại): «Nên thu vì đây là điều quan trọng và thông tin dự án là thông
tin cần được công bố cho người dân để giải quyết các vấn đề bất đối xứng thông tin cho người mua». Tiến độ 2–3 tháng là không
được; cách thu, trần, nhịp do làn thu chọn (ROADMAP §3 mục 39).

Phạm vi của vòng này trong hàng DAZ3: phần **nạp** (migration 093 cho ba bảng `stg_s07_*`, bộ nạp `import-s07-danh-muc`,
mục S07 của DATA-CONTRACT v9). Phần **thu** chạy bằng bộ chạy local (mang tên miền, không vào kho) song song với vòng;
tiến độ thu ghi ở `research-local/s07/BAN-GIAO.md` của worktree thu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: snapshot S07 đã thu có vào được `stg_s07_*` đủ, không nhân dòng, không mang tên miền nguồn chưa?
- Kết quả nào là SỐNG: nạp mọi snapshot S07 hiện có trên DB thử ra đủ thẻ, trang dự án, đường dẫn sitemap; nạp lần hai ghi 0
  dòng; không dòng `stg_s07_*` nào chứa tên miền nguồn; item thu trong phiên đăng nhập không vào stg.
- Kết quả nào là CHẾT: nạp lại nhân dòng, hoặc tên miền nguồn lọt vào stg, hoặc bộ nạp đánh dấu snapshot đã nạp khi DB chưa có bảng.
- Timebox: vòng nạp trong đợt dot0-cam-mau; phần thu 608 trang danh sách + chi tiết Hà Nội và HCM theo nhịp làn thu chọn
  (đích tham khảo 3–4 tuần cho toàn bộ danh mục).
