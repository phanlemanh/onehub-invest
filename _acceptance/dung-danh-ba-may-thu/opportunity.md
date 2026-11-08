---
schema_version: 1
slug: dung-danh-ba-may-thu
feature: Lệnh dựng danh bạ vật thể chạy được trên DB máy thu bằng cờ cho phép tường minh, kiểm slug khu, và có bước trong chạy đêm
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # giám sát duyệt hàng-mới P3-157 (08/11)
decided_by: giám sát (P3-157, 2026-11-07T23:09:50Z) — hàng mở theo lời Mạnh «Ngoài-9: mở hợp đồng mới» ở Cổng Bằng chứng DB1 07/11 (_acceptance/danh-ba-toa-truc-can/decisions.jsonl d-20261107T042453Z-49)
decided_at: 2026-11-07T23:09:50Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DB1b
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DB1b của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt danh-ba-2910, mã DB1b
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Lệnh dựng danh bạ vật thể chạy được trên DB máy thu bằng cờ cho phép tường minh, kiểm slug khu, và có bước trong chạy đêm

Vì sao: DB1 Ngoài-9 (Mạnh chọn «mở hợp đồng mới» 07/11) + Known limit Ngoài-7 (lệnh từ chối DB «oneinvest»). 082 đã áp máy thu 07/11.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Dựng lần đầu trên DB máy thu ra đúng số toà/trục/căn như bản chép chỉ đọc của DB1; chạy lại ra 0 mã mới» chưa?
- Kết quả nào là SỐNG: [đề xuất] Dựng lần đầu trên DB máy thu ra đúng số toà/trục/căn như bản chép chỉ đọc của DB1; chạy lại ra 0 mã mới
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Dựng lần đầu trên DB máy thu ra đúng số toà/trục/căn như bản chép chỉ đọc của DB1; chạy lại ra 0 mã mới» khi hết timebox
- Timebox: một vòng feature-loop (≤3 lượt chấm S4) cộng lần dựng đầu và lần đo trên máy thu ngay sau gộp (Hỏi-2)
