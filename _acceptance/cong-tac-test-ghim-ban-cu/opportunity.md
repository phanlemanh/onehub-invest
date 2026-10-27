---
schema_version: 1
slug: cong-tac-test-ghim-ban-cu
feature: Ca thử công tắc nhóm thu đối chứng với bản route trước sửa đã ghim cố định trong kho, nên vẫn xanh sau khi PR #142 gộp
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 26/10 — Mạnh chọn «mở hợp đồng mới» cho Ngoài-1/3/4 ở Cổng Bằng chứng cong-tac-khong-ha-nhom-go; trả lời P1-31
decided_at: 2026-10-26T15:10:07Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mọi dãy chạy `cd app && npm test`. `app/tests/cong-tac-nhom-go.test.tsx` lấy «route cũ» cho phép đối chứng bằng
`git show origin/main:app/src/app/api/v1/ops/source-groups/route.ts` lúc chạy; sau khi PR #142 gộp, `origin/main` là
route mới nên CT-AC-1 và CT-AC-2 đỏ mãi, kéo bộ test app của main đỏ. Nguồn: ba mục ngoài hợp đồng Ngoài-1/3/4 của
`_acceptance/cong-tac-khong-ha-nhom-go/review-findings.md`.

Phạm vi (giám sát, P1-31): nhánh riêng cắt từ nhánh #142, PR riêng; giám sát gộp #142 rồi PR này liền nhau.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: sau khi #142 gộp, ca thử công tắc còn xanh và đối chứng còn đỏ đúng chỗ không?
- Kết quả nào là SỐNG: chạy trên cây mô phỏng «origin/main = route mới» thì ca thử xanh, đối chứng vẫn bắt route cũ.
- Kết quả nào là CHẾT: ca thử còn đọc ref nhánh nào lúc chạy.
- Timebox: trong đợt dot0-cam-mau.
