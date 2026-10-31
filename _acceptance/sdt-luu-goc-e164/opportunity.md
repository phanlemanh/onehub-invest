---
schema_version: 1
slug: sdt-luu-goc-e164
feature: Tin và danh bạ Người lưu số gốc SĐT ở một dạng +84…, danh bạ có bí danh số gốc, và bảng người bán thành view trên danh bạ
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T00:00:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SD3
lo_trinh_tep: docs/plan/lo-trinh.json
---


## Cổng 0

- **decision = build** Căn cứ: Mạnh 30/10 nguyên văn «Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất» (nhật ký đợt dot0; giám sát trả lời P4-112, giao SD3 cho P4 thay ON17 ngày 31/10).
- **disposition = (không có bản mẫu)**
## Vấn đề & ai gặp

Mở từ hàng SD3 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945` — chưa có trang: trang đợt nguoi-sdt-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Tin và danh bạ Người lưu số gốc SĐT ở một dạng +84…, danh bạ có bí danh số gốc, và bảng người bán thành view trên danh bạ

Vì sao: Audit bảng Người theo trục SĐT 30/10 (docs/research/audit-bang-nguoi-sdt-3010.md §3.2, §5b, N7; Hỏi-A, Hỏi-C bước 2): danh bạ chỉ giữ SĐT băm sha256 không muối, đảo ngược được, là dư âm thời SĐT tầng A; Mạnh chốt lưu số gốc, một dạng +84….

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB thử: 0 giá trị SĐT nào ở sale_offers và registry_aliases kind sdt không khớp ^\+84[35789]\d{8}$; mọi người theo SĐT có bí danh sdt (hôm nay 165); bí danh sdt_bam cũ được nghỉ, không sửa tại chỗ; nạp lại lượt hai thêm 0 bí danh; sellers đọc từ view ra cùng số dòng và cột tổng hợp như bảng cũ; leak gate cloud xanh, seller_phone vẫn không lên cloud» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB thử: 0 giá trị SĐT nào ở sale_offers và registry_aliases kind sdt không khớp ^\+84[35789]\d{8}$; mọi người theo SĐT có bí danh sdt (hôm nay 165); bí danh sdt_bam cũ được nghỉ, không sửa tại chỗ; nạp lại lượt hai thêm 0 bí danh; sellers đọc từ view ra cùng số dòng và cột tổng hợp như bảng cũ; leak gate cloud xanh, seller_phone vẫn không lên cloud
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB thử: 0 giá trị SĐT nào ở sale_offers và registry_aliases kind sdt không khớp ^\+84[35789]\d{8}$; mọi người theo SĐT có bí danh sdt (hôm nay 165); bí danh sdt_bam cũ được nghỉ, không sửa tại chỗ; nạp lại lượt hai thêm 0 bí danh; sellers đọc từ view ra cùng số dòng và cột tổng hợp như bảng cũ; leak gate cloud xanh, seller_phone vẫn không lên cloud» khi hết timebox
- Timebox: …
