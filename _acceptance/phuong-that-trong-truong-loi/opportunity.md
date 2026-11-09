---
schema_version: 1
slug: phuong-that-trong-truong-loi
feature: Kiểm «phường» và «trường lõi» trên đồng chảy và bậc dữ liệu chỉ nhận khu cấp phường; tin chỉ gắn tới tỉnh hay thành phố không còn được tính là có phường
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh duyệt 09/11 qua phiên DA «Truy kẹt S03: trường lõi + tin không ảnh» («Đồng ý»); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-08T23:40:36Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Đo 09/11: 4.825/5.103 tin S03 chỉ có khu cấp tỉnh/thành, phường thật 56 (1,1%), nhưng kiểm hiện chỉ xét area_id có giá trị nên đếm 1.673 tin đủ lõi; tính nghiêm chỉ 34.

Hàng DF5 trong `docs/plan/lo-trinh.json` (PR #379). Mạnh duyệt 09/11, biết trước tỉ lệ đủ lõi S03 sẽ tụt từ 32,8% về khoảng 1%. Làm ngay sau thang-bac-moi-b0-b5 (dãy N1, cùng 610 và data-level.ts). Gốc dữ liệu được gỡ dần ở DA9 phuong-tu-du-an.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Số tin S03 đủ lõi sau đổi khớp đếm SQL độc lập (đo 09/11 là 34); S06 không đổi số; nhãn trên /ops/data-flow ghi rõ lý do «chỉ tới tỉnh»?
- Kết quả nào là SỐNG: [đề xuất] kiểm phường và trường lõi chỉ nhận khu cấp phường; S03 đủ lõi khớp đếm nghiêm (đo 09/11: 34); S06 không đổi
- Kết quả nào là CHẾT: [đề xuất] tin chỉ tới tỉnh vẫn được tính có phường
- Timebox: một vòng
