---
schema_version: 1
feature: Phép đo danh bạ SĐT chặt — mỗi số một người đo mỗi đêm, đúng ảnh và tên đúng người khi chuyển 060, che số /ops/people qua loader thật
slug: sd3-lam-chat-do-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-31T12:42:00Z
design_doc: docs/superpowers/specs/2026-10-31-sd3-lam-chat-do-danh-ba-design.md
---

# Acceptance Contract: sd3-lam-chat-do-danh-ba

## Context

Hàng P4 do giám sát duyệt (P4-117, 31/10) từ ba mục «mở hợp đồng mới» Mạnh chọn ở Cổng Bằng chứng SD3 (PR #247):
Ngoài-14 (phép đo danh bạ chỉ kiểm tập con), Ngoài-15 (phép kiểm tên nới quan hệ), Ngoài-17 (quét che số yếu hơn lời
hứa, đối chứng không qua bộ quét thật). 060 chưa áp lên máy thu. Tri thức: «đo trục SĐT mỗi đêm»
(`wiki/chu-de/nguoi-va-sdt.md`).

## Criteria

- AC-1: Given tin, bí danh `sdt` còn hiệu lực và bản ghi tin của một nguồn, When bộ đo trục SĐT tính kiểm N6, Then nó
  đếm đúng `trung` (số thuộc ≥2 người cùng nguồn), `thua` (số không có trên bản ghi tin nào của nguồn), `thieu` (SĐT trên
  tin sống không người nào mang), `tong`; đạt khi cả ba bằng 0 — trên ma trận viết trước mỗi ô một lỗi.
- AC-2: Given một lượt đo, When ghi `dq_check_results`, Then có thêm đúng một dòng `danh-ba-sdt:n6` mỗi nguồn S03, S05
  (11 dòng một lượt), chi tiết chỉ là số đếm — không SĐT, không khoá băm, không tên.
- AC-3: Given dòng `danh-ba-sdt:n6` ở mọi trạng thái, When `/ops/quality` đọc, Then tên kiểm và chi tiết có nhãn tiếng
  Việt (không rơi về «chưa diễn giải»).
- AC-4 (cross-layer): Given DB thử chép máy thu sau 060 và một lượt dựng danh bạ thật, When bộ đo chạy thật, Then N6
  đạt ở cả hai nguồn; bản chép bộ dựng gán thêm một số cho người khác → N6 không đạt.
- AC-5: Given DB thử chép máy thu đã qua một lượt bước đêm đời trước (trước SD3), When so ánh xạ người → tập số trước 060
  (từ `sdt_bam` + số cũ trên tin) với sau 060 + dựng danh bạ (từ `sdt` còn hiệu lực), Then hai ánh xạ bằng nhau (cùng
  người, cùng tập), số người hai bên bằng nhau (so bằng lệnh, không chỉ in), và số `sdt_bam` mồ côi (không khớp tin nào)
  được đếm thẳng từ bảng bí danh và bằng 0 hoặc in kèm người mất; thêm một số lạ vào ánh xạ sau → bắt «LECH ANH».
- AC-6: Given bảng `sellers` cũ chụp trước 060, When so tên với danh bạ sau 060, Then với mỗi tên khác rỗng, mọi người
  ĐÃ CÓ trước 060 (mang `sdt_bam` khoá băm của số ấy) và nay mang bí danh `sdt` của số ấy có bí danh `ten` còn hiệu lực
  đúng tên ấy, và có ít nhất một người như vậy; người theo SĐT sinh sau 060 không có `ten` (bộ dựng không gắn tên — ngoài
  phạm vi) được đếm và in riêng, không tính là sai; bản chép 060 chép tên sang người khác, hoặc nghỉ bí danh tên → bắt
  «TEN SAI NGUOI».
- AC-7 (cross-layer): Given người có bí danh `sdt` trên DB thử chép máy thu (giao dịch ROLLBACK; test từ chối DB `oneinvest`), When loader thật của `/ops/people`
  (`danhSachNguoi`, `motNguoi`) dựng hàng với quyền xem từ `xemNoiDungTin` thật của vai viewer, ops, admin, Then không ô
  nào chứa chuỗi 3+ chữ số liên tiếp của số gốc; luật che đời trước (8 ký tự đầu) đi qua CÙNG bộ quét → bắt «LO SO GOC
  TREN PEOPLE».
- AC-8: Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ trong vùng của hàng (bộ đo trục SĐT và test, nhãn
  `/ops/quality` và test nhãn, test `/ops/people`, hồ sơ này, design, plan, tệp sinh); không probe hay test nào của hàng
  áp 060 hay chạy trên DB `oneinvest` hay Supabase.

## Coverage

- Trục **lỗi danh bạ** (số thuộc hai người · số lạ thừa · người thiếu · ánh xạ lệch · tên sai người · tên đã nghỉ · lộ
  số) — AC-1, AC-4, AC-5, AC-6, AC-7.
- Trục **thời điểm** (một lần khi chuyển 060 trên DB thử · mỗi đêm sau khi áp) — AC-4, AC-5, AC-6 / AC-1, AC-2.
- Trục **người đọc** (bảng kiểm `dq_check_results` · `/ops/quality` · `/ops/people`) — AC-2, AC-3, AC-7.
- Thước CE: findings Ngoài-14/15/17 của `_acceptance/sdt-luu-goc-e164/review-findings.md`; bản chép DB máy thu. Bản
  quét: `coverage-scan.md`.

## Out of scope

- Gắn tên trên tin vào người theo SĐT trong bộ dựng danh bạ (tên người bán đọc từ tin qua view `sellers`, Hỏi-3 SD3).
- Áp 060 lên máy thu hay Supabase; sửa `db/db-thu.sh` dùng chung; gộp người theo SĐT với người theo tài khoản.

## Notes

- Trước khi áp 060, N6 trên máy thu không đạt (`thieu` = mọi số trên tin) — đó là tín hiệu «chưa áp 060», không phải lỗi.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-31:
  - Ngoài-1: Phép kiểm «số người trước = khớp + mồ côi» ở lượt chuyển luôn đúng theo cách dựng tập, nên không bắt thêm người mất im lặng; số người mồ côi chỉ được in.
  - Ngoài-2: Cùng chỗ với Ngoài-1 — đẳng thức đếm mồ côi không bao giờ báo đỏ; các phép so ánh xạ chính vẫn chạy.
  - Ngoài-3: Đối chứng «trước 060 N6 không đạt» bị bỏ qua im lặng nếu bản chép thử không có nguồn nào mang SĐT.
