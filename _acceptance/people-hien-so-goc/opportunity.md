---
schema_version: 1
slug: people-hien-so-goc
feature: Người vận hành mở danh bạ người trên Ops ở máy thu, thấy số gốc của từng người, gọi được bằng một chạm và tìm được người theo SĐT; vai Người xem không thấy số
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T00:00:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SD4
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Cổng 0

- **decision = build** Căn cứ: Mạnh 30/10 chốt Hỏi-B «số gốc mở cho cả vai Vận hành và `admin` ở máy thu. `/ops/deals` hạ cổng theo. Gánh bằng `people-hien-so-goc`» (`docs/research/audit-bang-nguoi-sdt-3010.md` dòng 291; `docs/ROADMAP.md` §3 mục 24) và nguyên văn «Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất»; giám sát trả lời U1-92 ngày 02/11, mở SD4 sau PR #272.
- **disposition = (không có bản mẫu)**

## Vấn đề & ai gặp

Mở từ hàng SD4 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md#829234f6062a7e911b8cf66d79cdddbf88551945` — chưa có trang: trang đợt nguoi-sdt-3010
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở danh bạ người trên Ops ở máy thu, thấy số gốc của từng người, gọi được bằng một chạm và tìm được người theo SĐT; vai Người xem không thấy số

Vì sao: Audit bảng Người theo trục SĐT 30/10 (docs/research/audit-bang-nguoi-sdt-3010.md §5, N8, N10; Hỏi-B): /ops/people chỉ hiện 8 ký tự băm và không tìm theo SĐT; /ops/deals hiện số gốc chỉ cho admin; Mạnh chốt mở cho cả vai Vận hành và admin.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Vai Vận hành ở máy thu có thấy, gọi và tìm được số gốc của mọi người có bí danh SĐT, trong khi vai Người xem không nhận được số nào?
- Kết quả nào là SỐNG: Từ «Bật khi» của audit dòng 267, số 165 đổi thành số đo hôm nay: 314/314 người có bí danh `sdt` hiện số với vai `ops` và `admin`; vai `ops` thấy liên hệ trên `/ops/deals`; HTML và JSON của vai `viewer` trên ba bề mặt ấy không chứa chuỗi SĐT nào; tìm một SĐT, gõ `09…` hay `+84…`, ra đúng người.
- Kết quả nào là CHẾT: Trên ba bề mặt của hàng (danh bạ, một người, `/ops/deals`), vai `viewer` nhận được dù một chuỗi SĐT; hoặc tìm theo SĐT ra người sai hay không ra người có số đó.
- Timebox: Theo dự báo hàng SD4, không quá 2,3 giờ máy.
