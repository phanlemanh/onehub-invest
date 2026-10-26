---
schema_version: 1
slug: quyen-bon-vai-mot-cho
feature: Mọi route ghi /api/v1/ops/** kiểm vai theo một bảng bốn vai (viewer, ops, admin, owner) ở một chỗ, và mỗi thao tác ghi đúng một dòng ops_audit mang id người thật trong cùng transaction
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TV1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng TV1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/tu-van-hanh-2510.md#184faf35bf93aff337c2bac27575ef6075040f52` — chưa có trang: mã TV1, mã TVN3
Mốc: Đội vận hành tạm dừng/bật nguồn và quản nhóm S05/S06 từ cloud, có nhật ký người thật — chưa có ngày.

Mọi route ghi /api/v1/ops/** kiểm vai theo một bảng bốn vai (viewer, ops, admin, owner) ở một chỗ, và mỗi thao tác ghi đúng một dòng ops_audit mang id người thật trong cùng transaction

Vì sao: Audit 25/10 (docs/research/ops-tu-van-hanh-nguon-saas.md §2.4 G3): API quản trị (zalo/**, source-groups) chỉ cần vai ops hoặc một bearer chung — trái portals.md; ops_audit.actor là hằng «ops-user»/«api:zalo-admin»; audit ghi ngoài transaction.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Route quản trị gọi bằng vai ops hoặc bearer chung: 403; thao tác thành công: đúng một dòng audit có user id và trước/sau; transaction hỏng: 0 dòng audit; GET source-groups kiểm bearer trên request thật» chưa?
- Kết quả nào là SỐNG: [đề xuất] Route quản trị gọi bằng vai ops hoặc bearer chung: 403; thao tác thành công: đúng một dòng audit có user id và trước/sau; transaction hỏng: 0 dòng audit; GET source-groups kiểm bearer trên request thật
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Route quản trị gọi bằng vai ops hoặc bearer chung: 403; thao tác thành công: đúng một dòng audit có user id và trước/sau; transaction hỏng: 0 dòng audit; GET source-groups kiểm bearer trên request thật» khi hết timebox
- Timebox: …
