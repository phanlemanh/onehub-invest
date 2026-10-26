---
schema_version: 1
slug: cong-tac-khong-ha-nhom-go
feature: Công tắc bật/tắt nhóm thu ở /ops/sources không hạ nhóm đã gỡ hay đã xong về tạm dừng, không hồi sinh chúng qua tắt rồi bật, và không đổi nhóm nháp thành tạm dừng khi tắt
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo Mạnh 26/10 — Mạnh chọn «Ngoài-3: mở hợp đồng mới» (và Ngoài-1) ở Cổng Bằng chứng vong-doi-nguon (decisions d-20261026T090029Z-17, d-20261026T090029Z-19); trả lời P1-26
decided_at: 2026-10-26T13:48:04Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Người vận hành (quyền ops) ở lưới nhóm thu `/ops/sources`. Hôm nay công tắc tắt một nhóm `retired` hay `completed`
ghi nó thành `paused`; bấm bật tiếp thì nhóm sống lại — chặn 409 «nhóm đã gỡ — không bật lại» của TV2a bị lách bằng
hai lần bấm (kể cả bấm nhanh hai lần). Tắt nhóm `draft` cũng đổi nó thành `paused`. Nguồn: hai mục ngoài hợp đồng của
`_acceptance/vong-doi-nguon/review-findings.md` («Toggle tắt nhóm retired/completed chuyển sang paused…», «Toggle tắt hạ
nhóm retired/completed xuống paused…»), file `app/src/app/api/v1/ops/source-groups/route.ts`.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: còn đường nào qua công tắc làm một nhóm `retired`/`completed` đổi trạng thái hay `draft` thành `paused` không?
- Kết quả nào là SỐNG: 0 đường — ma trận năm trạng thái × tắt/bật trên route thật giữ đúng luật vòng đời.
- Kết quả nào là CHẾT: còn một ô ma trận đổi trạng thái trái luật.
- Timebox: trong đợt dot0-cam-mau.
