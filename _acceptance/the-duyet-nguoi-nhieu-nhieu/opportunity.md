---
schema_version: 1
slug: the-duyet-nguoi-nhieu-nhieu
feature: "Thẻ duyệt Người cho ca nhiều–nhiều trên /ops/review: một SĐT nhiều người gửi, hay một người gửi nhiều SĐT, thành thẻ để người duyệt quyết gộp hay tách; quyết định áp qua luật xác định, có vết và đảo được"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-01T07:00:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: HD17
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng HD17 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt hang-duyet-3010, mã HD17
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.
Cổng Đáng: build — Mạnh «Duyệt hết» (01/11, giám sát chuyển lời cho mục «Cổng Đáng HD17: làm»).

Thẻ duyệt Người cho ca nhiều–nhiều trên /ops/review: một SĐT nhiều người gửi, hay một người gửi nhiều SĐT, thành thẻ để người duyệt quyết gộp hay tách; quyết định áp qua luật xác định, có vết và đảo được

Vì sao: Cổng Phạm vi HD13 (31/10): Mạnh trả lời Hỏi-1 = tách thẻ duyệt Người thành hàng riêng; HD13 đo khoảng 9 SĐT dùng chung và 5 người nhiều số vẫn tách người.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mọi ca nhiều–nhiều mà bộ dựng danh bạ đếm (SĐT nhiều người gửi, người gửi nhiều SĐT) có đúng một thẻ trên /ops/review; người duyệt chọn gộp thì hai Người về một, chọn tách thì giữ nguyên; tách lại một lần gộp không mất dữ liệu» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mọi ca nhiều–nhiều mà bộ dựng danh bạ đếm (SĐT nhiều người gửi, người gửi nhiều SĐT) có đúng một thẻ trên /ops/review; người duyệt chọn gộp thì hai Người về một, chọn tách thì giữ nguyên; tách lại một lần gộp không mất dữ liệu
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mọi ca nhiều–nhiều mà bộ dựng danh bạ đếm (SĐT nhiều người gửi, người gửi nhiều SĐT) có đúng một thẻ trên /ops/review; người duyệt chọn gộp thì hai Người về một, chọn tách thì giữ nguyên; tách lại một lần gộp không mất dữ liệu» khi hết timebox
- Timebox: …
