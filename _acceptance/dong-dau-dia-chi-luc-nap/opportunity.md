---
schema_version: 1
slug: dong-dau-dia-chi-luc-nap
feature: Transform S03 ghi dự án, phường, phân khu và bán hay thuê từ thẻ địa chỉ của nhóm lên mọi tin ngay ở lượt nạp, thành phát biểu có căn cứ là thẻ nhóm và phiên bản thẻ; chữ bài nêu rõ dự án khác thì chữ bài thắng; sửa thẻ thì tin cũ của nhóm được tính lại
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build   # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-16T23:10:00Z   # 17/11 ~06:10 giờ VN
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TG2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Chữ ký Cổng Đáng

Mạnh, 17/11 lúc ~06:10 giờ VN (2026-11-16T23:10Z), nguyên văn: «Cổng Đáng TG2: build».
Lời gõ ở phiên giám sát `local_4194042c`, chuyển sang phiên này qua tin của giám sát.

Đây là chữ ký **Cổng Đáng**, KHÔNG phải chữ ký Cổng Phạm vi — Mạnh nói sẽ ký Cổng Phạm vi sau, nên hợp đồng
vẫn ở `status: draft` với `approved_by` rỗng.

## Vấn đề & ai gặp

Mở từ hàng TG2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/dat-lai-lo-trinh-1511.md#b00cddc4283afe255830157060caff31141d3f18` — chưa có trang: mã R3
Mốc: Tin S03 có dự án ngay lúc nạp: ô «Định vị» của S03 trên /ops/data-flow đạt từ 90% tin đang rao, và mọi nhóm S03 có thẻ địa chỉ — chưa có ngày.

Transform S03 ghi dự án, phường, phân khu và bán hay thuê từ thẻ địa chỉ của nhóm lên mọi tin ngay ở lượt nạp, thành phát biểu có căn cứ là thẻ nhóm và phiên bản thẻ; chữ bài nêu rõ dự án khác thì chữ bài thắng; sửa thẻ thì tin cũ của nhóm được tính lại

Vì sao: ROADMAP §3 mục 51: bối cảnh nhóm là mặc định, đóng dấu ở bước nạp. Hôm nay dự án theo nhóm chỉ là một bước suy ra chạy sau, cho nhóm ghi đúng một dự án, và chưa tới phường, phân khu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Ô «Định vị» của S03 trên /ops/data-flow đạt ngưỡng chốt ở Cổng Phạm vi (đề xuất từ 90% tin đang rao), kèm phép đếm theo bài đầu của tin; mẫu nhãn người cho tỉ lệ bài lạc dự án trong nhóm chuyên một dự án, có cận Wilson; sửa một thẻ trên DB thử: mọi tin của nhóm đổi theo, chạy lại không nhân dòng; raw snapshot không đổi; bài nêu rõ dự án khác giữ dự án của chữ» chưa?
- Kết quả nào là SỐNG: [đề xuất] Ô «Định vị» của S03 trên /ops/data-flow đạt ngưỡng chốt ở Cổng Phạm vi (đề xuất từ 90% tin đang rao), kèm phép đếm theo bài đầu của tin; mẫu nhãn người cho tỉ lệ bài lạc dự án trong nhóm chuyên một dự án, có cận Wilson; sửa một thẻ trên DB thử: mọi tin của nhóm đổi theo, chạy lại không nhân dòng; raw snapshot không đổi; bài nêu rõ dự án khác giữ dự án của chữ
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Ô «Định vị» của S03 trên /ops/data-flow đạt ngưỡng chốt ở Cổng Phạm vi (đề xuất từ 90% tin đang rao), kèm phép đếm theo bài đầu của tin; mẫu nhãn người cho tỉ lệ bài lạc dự án trong nhóm chuyên một dự án, có cận Wilson; sửa một thẻ trên DB thử: mọi tin của nhóm đổi theo, chạy lại không nhân dòng; raw snapshot không đổi; bài nêu rõ dự án khác giữ dự án của chữ» khi hết timebox
- Timebox: …
