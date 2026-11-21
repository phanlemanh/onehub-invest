---
schema_version: 1
slug: noi-phan-khu-trung-s16
feature: Bảy phân khu do thẻ luật S16 đúc trùng nơi với phân khu đã có được nối về nút cũ, và bước khớp không đúc nút trùng nữa
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: Mạnh
decided_at: 2026-11-18T23:13:44Z
prototype:
  base_commit:
  disposition:
---

## Vấn đề & ai gặp

Thẻ luật phân khu S16 (DA37, áp 18/11, luật số 2) đúc 51 nút mới. Bảy nút trong đó là cùng nơi với phân khu đã có từ S09, nên 50 toà
rời nút cũ sang nút trùng. Người gắn nhãn chọn toà S1.05 còn tin nói «S1» rơi vào nút rỗng; hàng gắn toà PL20 và tập nhãn 220 bài
đang chờ việc này.

Lời ở Cổng Đáng: Mạnh gõ «Làm cả năm» ở phiên giám sát lúc 2026-11-18T23:13:44Z (giờ giám sát ghi sổ), trả lời câu gom năm hàng
GT8, GT5, GT6, DA45, DA46. Lời này cho làm hàng, chưa phải lời áp thẻ luật bổ sung.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: sau khi áp, mỗi phân khu trùng còn đúng một nút đang dùng và toà nằm ở nút cũ không?
- Kết quả nào là SỐNG: bảy cặp nối xong, 50 toà về nút cũ, nút cũ không rỗng, thẻ luật dựng lại không còn nút mới.
- Kết quả nào là CHẾT: còn toà S16 ở nút nghỉ, hoặc lượt dựng đêm đúc lại nút trùng.
- Timebox: một vòng, trước hàng DA42.
