---
schema_version: 1
slug: lockdown-local-noi-that
feature: Lockdown tính ở máy local không báo «Ổn» cho lớp không kiểm được (L4b khi grep log thất bại) và «Dòng log cuối» của job là dòng có nghĩa, không phải cảnh báo Node
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: ON2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng ON2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Lockdown tính ở máy local không báo «Ổn» cho lớp không kiểm được (L4b khi grep log thất bại) và «Dòng log cuối» của job là dòng có nghĩa, không phải cảnh báo Node

Vì sao: OPS-3 (cao, an toàn Zalo): getLockdownStatus không có nhánh cloud — hạ tầng «Hỏng» giả, L4b «Ổn» giả có thể che một sự cố agent-turn thật; hai bảng cùng trang mâu thuẫn. OPS-19: tail log không lọc dòng cảnh báo Node. Gốc G1 + G2.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Làm grep log thất bại ở local: L4b ra «Không kiểm được», không «Ổn»; job sync in cảnh báo Node sau dòng kết quả: «Dòng log cuối» vẫn là dòng kết quả» chưa?
- Kết quả nào là SỐNG: [đề xuất] Làm grep log thất bại ở local: L4b ra «Không kiểm được», không «Ổn»; job sync in cảnh báo Node sau dòng kết quả: «Dòng log cuối» vẫn là dòng kết quả
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Làm grep log thất bại ở local: L4b ra «Không kiểm được», không «Ổn»; job sync in cảnh báo Node sau dòng kết quả: «Dòng log cuối» vẫn là dòng kết quả» khi hết timebox
- Timebox: …
