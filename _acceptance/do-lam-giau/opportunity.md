---
schema_version: 1
slug: do-lam-giau
feature: "Người vận hành thấy mỗi ngày, theo từng đường làm giàu (số qua người đăng, diện tích suy ra, quy ước nhóm, danh mục CĐT): bao nhiêu giá trị được thêm, bao nhiêu bị người sửa hay rút, và kết quả kiểm ngược định kỳ (giấu giá trị có sẵn rồi so); mọi số xem được theo phường/xã, dự án, toà (và trục khi gắn tới trục), kèm một ô «chưa gắn» cho tin chưa gắn được mức đó"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DO3
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DO3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/bao-cao-so-lieu-ngay.md#ad93983b7bfbec8480269c1172d3158a784f2411` — chưa có trang: trang đợt mo-hinh-pipeline-0711
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Người vận hành thấy mỗi ngày, theo từng đường làm giàu (số qua người đăng, diện tích suy ra, quy ước nhóm, danh mục CĐT): bao nhiêu giá trị được thêm, bao nhiêu bị người sửa hay rút, và kết quả kiểm ngược định kỳ (giấu giá trị có sẵn rồi so); mọi số xem được theo phường/xã, dự án, toà (và trục khi gắn tới trục), kèm một ô «chưa gắn» cho tin chưa gắn được mức đó

Vì sao: Mạnh 07/11: đo làm giàu theo phường/xã, dự án, toà. C2b chỉ đo độ phủ (field-yield), PL31 đo chi phí, GC2 kiểm ngược một lần lúc dựng; chưa có độ đúng làm giàu đo đều (vd 758 tin vừa nhận số qua người đăng 07/11).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mỗi đường làm giàu đang chạy có số thêm/sửa/rút theo ngày và một lượt kiểm ngược mỗi tuần kèm cận dưới Wilson» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mỗi đường làm giàu đang chạy có số thêm/sửa/rút theo ngày và một lượt kiểm ngược mỗi tuần kèm cận dưới Wilson
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mỗi đường làm giàu đang chạy có số thêm/sửa/rút theo ngày và một lượt kiểm ngược mỗi tuần kèm cận dưới Wilson» khi hết timebox
- Timebox: [đề xuất] hai tuần sau khi bước đêm chạy thật — đủ 14 ngày số thêm/sửa/rút và hai lượt kiểm ngược tuần cho mỗi đường làm giàu đang chạy
