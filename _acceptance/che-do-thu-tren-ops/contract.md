---
schema_version: 1
feature: "/ops/sources hiện và đổi chế độ thu (Chờ · Bùng · Duy trì) của từng điểm thu — bật Bùng chỉ admin và bắt buộc hạn ≤ 14 đêm; máy tự hạ bùng quá hạn về Duy trì; mọi lần đổi ghi ops_audit"
slug: che-do-thu-tren-ops
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api, script]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-25T09:15:02Z
design_doc: docs/superpowers/specs/2026-10-25-che-do-thu-tren-ops-design.md
approved_by:
approved_at:
---

# Acceptance Contract: che-do-thu-tren-ops

## Context

Kế hoạch vết dầu loang (`docs/plan/vet-dau-loang-thu-thap-2510.md`) chia mỗi điểm thu thành ba chế độ CHỜ / BÙNG / DUY TRÌ,
lưu ở `source_groups.params` (không migration). Luật đã chốt (§1.4, §6 Hỏi-3, Mạnh 25/10): bật BÙNG là tăng tải nên người
duyệt từng lần; BÙNG có hạn (trần 14 đêm); máy tự hạ về DUY TRÌ và ghi `ops_audit`. Hàng C7 đưa luật đó lên `/ops/sources`
(trang chỉ admin, chỉ ở máy thu). Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` xếp hàng vào P4 theo trả lời của Mạnh.

Hôm nay H tính theo giờ Việt Nam. Hạn bùng là ngày cuối còn bùng, tính cả hai đầu: hạn hợp lệ là H … H+13 (tối đa 14 đêm).
`burst_until` có mặt khi và chỉ khi `mode = bung`; `mode_since` là ngày vào chế độ hiện tại.

Source input: `_acceptance/che-do-thu-tren-ops/opportunity.md`.

## Criteria

- AC-1: Given phiên admin và một điểm thu S06 có `params` sẵn (`region_v2`, `cityCode`), When đặt chế độ Bùng với hạn H+13
  qua `set-mode`, Then `params` có `mode = bung`, `burst_until = H+13`, `mode_since = H`, khoá cũ giữ nguyên; đúng một dòng
  `ops_audit` mới với actor `user:<id>`, action `source-group:mode`, detail nêu id, mã nguồn, chế độ cũ → mới và hạn — không
  chứa `group_key` hay tên nhóm. «H» theo giờ VN kể cả lúc 23:30 UTC ngày H−1. Khi INSERT `ops_audit` hỏng thì lời gọi báo
  lỗi và `params` giữ nguyên (ghi và audit cùng giao dịch).
- AC-2: Given phiên admin, When gửi `set-mode` với Bùng thiếu hạn / hạn sai khuôn / ngày không có thật / hạn H−1 / hạn
  H+14 / chế độ lạ / id không có, Then trả 400 (id không có: 404) kèm lý do tiếng Việt (ca H+14 nêu hạn tối đa), `params`
  không đổi và không thêm dòng `ops_audit` nào.
- AC-3: Given không có phiên admin (Bearer máy không phiên, hoặc phiên quyền `ops`), When gửi `set-mode` bất kỳ, Then trả
  403, `params` không đổi, không thêm audit; route `source-groups` trao `set-mode` cho đúng hàm kiểm admin. Các action cũ
  (`add`, `toggle`) gửi kèm `mode`/`burstUntil`/`params` qua Bearer máy không ghi được khoá `mode`, `burst_until`,
  `mode_since` vào `params`.
- AC-4: Given điểm đang Bùng, When admin đổi sang Duy trì hoặc Chờ, Then `burst_until` bị gỡ và `mode_since = H`; When admin
  gia hạn Bùng (hạn mới hợp lệ), Then `mode_since` giữ nguyên và có một dòng audit nêu hạn cũ, hạn mới; When đặt lại đúng
  chế độ và hạn đang có, Then không ghi gì và không thêm audit.
- AC-5: Given các điểm Bùng hạn H−1, hạn H, thiếu hạn, và một điểm Duy trì, When máy chạy lượt hạ (`haBungHetHan`) lúc
  23:30 UTC ngày H−1 (06:30 sáng ngày H giờ VN), Then điểm hạn H−1 và điểm thiếu hạn về Duy trì (lý do `het-han` /
  `thieu-han`), điểm hạn H và điểm Duy trì giữ nguyên; mỗi điểm bị hạ có đúng một dòng audit actor
  `machine:ha-bung-het-han`, action `source-group:mode-auto`; chạy lần hai không đổi gì; `haVeDuyTri(id, "bao-hoa")` hạ một
  điểm Bùng kèm audit lý do đó, và trả `false`, không ghi gì, với điểm không ở Bùng; khi INSERT `ops_audit` hỏng thì lượt hạ
  ném lỗi và không điểm nào đổi; CLI chạy trên một điểm quá hạn mới in đúng một dòng mỗi điểm bị hạ, chỉ nêu mã nguồn và id.
- AC-6: Given `scripts/cloud-sync.sh` (chạy 15′ trên máy thu), When chạy trong hộp thử job-exit, Then lượt hạ là bước đầu
  `job_run cloud-sync ha-bung-het-han`, rồi `sync-cloud`, `push-ops-facts`; bước hạ hỏng thì hai bước sau vẫn chạy và mã thoát
  là mã của bước hỏng đầu.
- AC-7: Given trang `/ops/sources` có các điểm ở bốn trạng thái (Chờ, Bùng hạn 07/11, Duy trì, chưa đặt), When admin xem và
  mở hộp «Đổi chế độ thu», Then cột «Chế độ» hiện đúng «Chờ», «Bùng · đến 07/11», «Duy trì», «Chưa đặt»; chọn Bùng thì hiện ô
  «Hạn bùng» giới hạn H … H+13 (H do máy chủ tính theo giờ VN) và nút «Lưu» khoá khi chưa có hạn; hộp chỉ ghi mã nguồn và
  id điểm, không tên nhóm; lỗi máy chủ hiện trong hộp; bấm «Lưu» gửi `{action: "set-mode", id, mode, burstUntil}` (không
  `burstUntil` khi rời Bùng), lưu xong hộp đóng và Badge hàng đổi theo dữ liệu đã ghi (cross-layer); trang đọc được ở sáng,
  tối và bề rộng 390 px.
- AC-8: Given `CONTEXT.md`, When đọc mục thuật ngữ, Then có «Chế độ thu» (code `mode`, ba giá trị `cho`/`bung`/`duy_tri`) và
  «Hạn bùng» (`burst_until`); nhãn ba chế độ trên UI lấy từ một hằng khớp đúng chữ trong `CONTEXT.md`.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — ai đổi: admin · phiên ops · Bearer máy không phiên · máy hạ (lượt quét, một điểm) → AC-1, AC-3, AC-5
- Trục B — chuyển chế độ: chưa đặt→Bùng · Bùng→Duy trì/Chờ · Bùng→Bùng (gia hạn) · trùng (không ghi) → AC-1, AC-4
- Trục C — hạn: thiếu · sai khuôn · ngày không có · H−1 · H · H+13 · H+14 · biên giờ VN/UTC → AC-1, AC-2, AC-5
- Trục D — dấu vết: một dòng audit mỗi lần đổi, không lần nào thiếu, không mang tầng A → AC-1, AC-2, AC-4, AC-5
- Trục E — nơi hiện: bảng, hộp thoại, sáng/tối/390, từ vựng → AC-7, AC-8
- Trục F — lịch máy hạ → AC-6
- Later: collector đọc chế độ và ngân sách (ZCode V1); dòng S01; hạ theo đạt kho/bão hoà (gọi `haVeDuyTri` từ probe);
  nhãn chế độ trên `/ops/collections` (§3.3).
- Never: máy tự bật Bùng; Bùng không hạn.

## Đường đo

- Thước: «bật/hạ đúng luật, mọi lần đổi có đúng một dòng audit, bùng quá hạn về Duy trì ở lượt quét kế» (SỐNG của ô cơ hội)
  · số từ: `app/tests/che-do-thu.test.tsx` + `scripts/job-exit.test.mjs` · bảo đảm bởi: AC-1, AC-2, AC-3, AC-5, AC-6
- CHẾT = còn một lối bật Bùng không hạn hoặc không phải admin, hoặc một lần đổi chế độ không có audit, ở lượt chấm cuối.

## Out of scope

- Collector S05/S06 đọc `mode`, `burst_budget`, `maintain_budget` và chạy theo chế độ (V1, làn ZCode).
- Thêm dòng S01 vào `source_groups` (ZCode đề xuất ở V1).
- Sửa ngân sách bùng/duy trì trên UI.
- Hạ theo đạt kho, bão hoà, vấp rào: vòng này chỉ mở cửa `haVeDuyTri`, chưa ai gọi.
- Nhãn chế độ trên `/ops/collections` và chỉ số ⑧–⑩ (tiêu chí C2).
- Đổi quyền của các action cũ (`toggle`/`add`/`delete`) đang mở cho phiên ops.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-1: Chú thích cũ của scripts/cloud-sync.sh ngụ ý chế độ thu lên cloud; đã sửa ở lượt S4-r1, chế độ thu chỉ nằm ở máy thu.
  - Ngoài-2: Máy hạ chỉ coi hạn là hỏng khi sai khuôn ngày; một hạn ngày-không-có-thật hoặc quá 14 đêm ghi bằng đường khác trang Ops sẽ không bị hạ sớm.
  - Ngoài-3: Bước hạ trong cloud-sync chưa được thử bằng chính tệp thật khi DB mất kết nối — chỉ thử thứ tự và mã thoát bằng bước giả.
  - Ngoài-4: Việc token máy bị chặn ở set-mode được đo tại hàm datCheDo và bằng soát mã route, chưa có lời gọi POST thật bằng token máy.
