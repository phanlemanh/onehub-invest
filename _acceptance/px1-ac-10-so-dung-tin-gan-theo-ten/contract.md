---
schema_version: 1
feature: Ca PX1-AC-10 so bộ gán PX1 trước 084 với giá trị nguồn ghi (G của migration 099) thay cho cột đã bị lớp phường kế thừa đè, in số tin đem so và mốc tin bị đè, có chiều đỏ
slug: px1-ac-10-so-dung-tin-gan-theo-ten
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: approved
veto_state: mo
veto_opened_at: 2026-11-22T08:45:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-22-px1-ac-10-so-dung-tin-gan-theo-ten-design.md
---

# Acceptance Contract: px1-ac-10-so-dung-tin-gan-theo-ten

## Context

Ca «PX1-AC-10 gán S06, S03 bằng code mới = area_id đang lưu» đỏ trên bản chép DB máy thu với 1.905–1.908 tin S03 lệch. P2 phân
loại 22/11: khu đang lưu của các tin đó do lớp phường kế thừa từ dự án (DA45, migration 099) đè lên cột; giá trị transform ghi theo
tên vẫn giữ ở `field_provenance.area_id.goc`. GS cắt HT4 sửa ca theo định nghĩa dương, có số đem so, mốc và chiều đỏ.

## Criteria

- AC-1: Given bản chép DB máy thu đưa về «chưa 084», When chạy ca so, Then tin S06 so với cột như cũ, tin S03 so với G (giá trị
  nguồn ghi của 099), lệch 0; ca in số tin đem so (S06, S03, S03 so với G), số tin trỏ xã danh bạ đã gỡ (không so) và số tin S03
  sống có cột bị đè theo nhãn; tập S03 đem so ≥ 1.500 và tập so với G ≥ 1.300 (≈ 70% số đo 22/11), dưới sàn thì đỏ nêu số; so với
  cột như cũ thì mọi tin lệch đều thuộc tập bị đè (đối soát: 22/11 lệch 1.900 = tập bị đè 1.900, ngoài 0); mọi tin có nhãn đè (cột bằng `v` của nhãn) phải còn khoá `goc` (giá trị NULL hợp lệ: cột rỗng trước
  khi nhận phường), thiếu khoá thì đỏ nêu số tin.
- AC-2: Given cùng bản chép, When phá ánh xạ tên → khu, gọi so với tập rỗng, hay so với cột như cũ, Then lần lượt: lệch > 0; ném
  «PX1-AC-10 tập so rỗng»; cắt tập S03 còn 10 tin thì ném «tập so S03 10 dưới sàn 1500»; so với cột (bỏ G) lệch > 0 với tập
  so với G đủ sàn; xoá khoá `goc` của một tin có nhãn thì bộ đọc nêu đúng tin đó.
- AC-3: Given DB dựng từ migration (thế CI, < 34 thị trường), When chạy tệp ca, Then mọi ca PX1-AC-10 bỏ qua với lý do «không có bản
  chép thật», 0 đạt, 0 đỏ.

## Coverage

- Dữ liệu thật: tin S06, tin S03 không bị đè, tin S03 bị đè, xã danh bạ đã gỡ → AC-1
- Chiều đỏ: ánh xạ hỏng, tập rỗng, bỏ G, nhãn đè thiếu goc → AC-2
- Thế CI → AC-3

## Out of scope

- Phép đo AC-9 của PX1 (`pipeline/scripts/nap-dvhc-do.mjs`) cũng so với cột: ngoài phạm vi, vì vùng hàng chỉ có tệp ca thử; ghi việc kế.
- 4 tin có phường dấu nhóm khác phường kế thừa: ngoài phạm vi, vì là hành vi phân xử của DA45, không thuộc ca này.

## Notes

- Vì sao lọt: ca đỏ ngầm từ 18–21/11 vì CI bỏ qua và bản mẫu DB thử của các dãy dựng trước khi TG2, DA45 ghi khu vào dữ liệu thật.
- Mốc 22/11 (bản chép 06:00Z): S03 đem so 2.177 (1.900 so với G), tin trỏ xã đã gỡ 233; cột bị đè toàn bộ S03 sống
  `registry_inherit/du-an` 7.835. Bản mẫu 05:42Z: 2.186 (1.905 so với G). Số 1.908 lúc chẩn đoán đo trên bản chép ~08:20Z.
