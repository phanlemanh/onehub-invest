---
schema_version: 1
feature: Thẻ ghép căn có một bên đã rời kho tự rút khỏi hàng duyệt kèm lý do «tin rời kho» và vết audit
slug: the-ghep-can-tin-roi-kho
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-the-ghep-can-tin-roi-kho-design.md
---

# Acceptance Contract: the-ghep-can-tin-roi-kho

## Context

Hàng HD3 (đợt `hang-duyet-3010`). Audit hàng duyệt 30/10 (`docs/research/audit-hang-duyet-3010.md` §2.2, H1): 12 thẻ
`entity_match` sinh 22/10 trỏ khoá tin S05 đã chết sau PL14. Người duyệt quyết trên dữ liệu không còn, quyết định không tới
ứng viên nào, còn `judge-run` gặp `queryPair` trả `null` thì chỉ đếm `loi` — thẻ treo, không ai được báo.

Source input: `opportunity.md` · hàng HD3 của `docs/plan/lo-trinh.json` · vùng: `agent/scripts/judge-run.ts`,
`agent/tests/judge-run.test.ts`.

## Criteria

- AC-1: Given một thẻ `entity_match` đang chờ mà Tin A, Tin B, hoặc cả hai không còn trong `sale_offers`, When chạy
  judge-run, Then thẻ rời trạng thái chờ: `status = 'deferred'`, `decided_by = 'machine:judge-run'`, `decided_at` có giá
  trị, `decision_note` mở bằng «tin rời kho» và nêu đúng khoá của (các) tin đã rời — đúng cả khi thẻ ghi cặp theo chiều
  ngược (`pair:<b>|<a>`).
- AC-2: Given thẻ vừa rút ở AC-1, When đọc `ops_audit`, Then có đúng một dòng cho mỗi thẻ rút: `actor =
  'machine:judge-run'`, `action = 'review-queue:rut-roi-kho'`, `detail` mang `review_id`, `item_id`, `ly_do = 'tin rời kho'`
  và `roi_kho` là danh sách khoá đã rời.
- AC-3: Given cặp có cả hai tin còn trong `sale_offers`, When chạy judge-run, Then không thẻ nào của cặp bị rút, không có
  dòng `ops_audit` nào, và cặp được chấm như trước vòng (thẻ đang chờ được cập nhật kết quả chấm; cặp `needs_llm` chưa thẻ
  được sinh thẻ).
- AC-4: Given thẻ của cặp đã được người quyết (`approved`, `rejected`, hay `deferred` bởi người — `decided_by` khác
  `machine:judge-run`) mà một bên rời kho, When chạy
  judge-run, Then thẻ ấy không đổi trạng thái, người quyết hay ghi chú, và không có dòng `ops_audit` nào.
- AC-5: Given lượt đầu đã rút thẻ, When chạy judge-run lần nữa, Then không thẻ nào bị rút thêm, số dòng `ops_audit` không
  đổi, và thẻ đã rút giữ nguyên.
- AC-6: Given cặp `needs_llm` có một bên rời kho mà chưa có thẻ, When chạy judge-run, Then không thẻ nào được sinh cho cặp,
  cặp không tính vào `loi`, và được đếm vào `roiKho`.
- AC-7: Given người quyết một thẻ của cặp rời kho giữa lúc judge-run đọc thẻ và lúc rút, When câu rút chạy, Then không thẻ
  nào của cặp bị rút và không có dòng `ops_audit` — quyết định của người đứng.
- AC-8: Given lượt chạy kết thúc, When judge-run in tổng kết, Then có dòng `cặp có tin rời kho <n> · thẻ rút <m> · thẻ trả
  lại <k>` với `n`, `m`, `k` bằng số cặp rời kho, số thẻ rút và số thẻ trả lại trong lượt.
- AC-9: Given bản chép lô thẻ `entity_match` thật của kho local (chép chỉ bằng SELECT) cùng tin sống của các khoá trên thẻ,
  When chạy judge-run, Then (a) trên bản chép giữ nguyên trạng thái gốc: sau lượt một không còn thẻ chờ nào có bên rời kho;
  (b) trên bản chép đặt lại mọi thẻ về chờ: mọi thẻ có bên rời kho được rút có lý do và vết audit ở lượt một, thẻ hai bên
  sống không bị rút, và lượt hai không rút thêm.
- AC-10: Given các ca đã ký của `judge-nguong-la-code`, `judge-giu-quyet-dinh-nguoi` và `judge-evidence-du-truong`, When
  chạy lại bộ test agent, Then tất cả vẫn xanh và mọi tên ca trong danh sách viết trước `ca-da-ky.txt` vẫn có mặt.
- AC-11: Given thẻ máy đã rút vì tin rời kho, When tin ấy có lại trong `sale_offers` và chạy judge-run, Then thẻ trở về
  chờ (`status = 'pending'`, `decided_by`, `decided_at`, `decision_note` rỗng), có đúng một dòng `ops_audit` `action =
  'review-queue:tra-lai-tin-ve-kho'` cho thẻ ấy, và thẻ được chấm lại như thẻ chờ.

## Coverage

Trục (quét hình thái, preset entity-feature trên thẻ × trạng thái tin):
- Bên rời kho: A · B · cả hai · không bên nào → AC-1, AC-3.
- Chiều thẻ: `pair:a|b` · `pair:b|a` → AC-1.
- Trạng thái thẻ: chờ · người đã quyết · máy đã rút · chưa có thẻ → AC-1, AC-4, AC-11, AC-6; lẫn (người quyết một chiều,
  chiều kia chờ) → OOS-7.
- Thời điểm: lượt đầu · chạy lại · người quyết giữa chừng · tin quay lại → AC-5, AC-7, AC-11.
- Vết: thẻ · `ops_audit` · dòng in → AC-1, AC-2, AC-11, AC-8.
- Dữ liệu: fixture · lô thật nguyên trạng · lô thật dựng trạng thái chờ → AC-1..AC-8, AC-11, AC-9.
- Thước CE: mọi ô của bảng trục trên có ít nhất một AC; ô «thẻ hai chiều cùng chờ cho một cặp» gộp vào AC-1 (câu rút theo
  cặp, rút mọi thẻ đang chờ của cặp).

## Out of scope

- OOS-1: Lịch chạy đêm của judge-run (TV13b) — vòng này đo trên một lượt chạy.
- OOS-2: Alert «Tin A không còn trong kho» trên thẻ — hàng U1 `the-so-doc-gia-tri-song`.
- OOS-3: Chuyển thẻ sang khoá mới khi tin được thay khoá (`superseded_by`) — việc của `nap_lai_khong_xoa` (044) lúc nạp.
- OOS-4: Sửa `property_candidates` của cặp rời kho — judge-run không ghi bảng này (luật 7).
- OOS-5: `CAU_DEM_THIEU_THE` vẫn đếm cặp `needs_llm` rời kho chưa từng có thẻ.
- OOS-6: Đo DQ hàng đêm số thẻ có bên rời kho — hàng P4 `do-the-duyet-du-du-lieu`.
- OOS-7: Cặp lẫn — người quyết thẻ một chiều, thẻ chiều ngược còn chờ, một bên rời kho — giữ nguyên theo luật đã ký «người
  đã quyết cặp này — không sửa» (`judge-giu-quyet-dinh-nguoi`); kho local 31/10 có 0 cặp mang thẻ hai chiều.

## Đường đo

Câu ngưỡng đã ký ở Cổng Đáng (`opportunity.md`): «Sau một lượt đêm: 0 thẻ chờ duyệt trỏ khoá tin không còn sống; mỗi thẻ
rút có lý do «tin rời kho» và vết audit; chạy lại không rút trùng». judge-run chưa có lịch đêm (TV13b) — vòng đo trên một
lượt judge-run. Mạnh chọn ở Cổng Phạm vi 31/10 (Hỏi-1 = đổi): ngưỡng của vòng là «Sau một lượt judge-run: 0 thẻ chờ duyệt
trỏ khoá tin không còn sống; mỗi thẻ rút có lý do «tin rời kho» và vết audit; chạy lại không rút trùng»; lịch đêm để TV13b.

- Ngưỡng «0 thẻ chờ duyệt trỏ khoá tin không còn sống» — số từ `review_queue` sau lượt chạy, đếm thẻ `pending` có bên
  không trong `sale_offers`; AC-1, AC-9 (a) bảo đảm (E9 in số này trên lô thật nguyên trạng).
- Ngưỡng «mỗi thẻ rút có lý do «tin rời kho» và vết audit» — `decision_note` + `ops_audit`; AC-1, AC-2.
- Ngưỡng «chạy lại không rút trùng» — số dòng `ops_audit` qua hai lượt; AC-5, AC-9 (b).

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-31:
  - Ngoài-1: Sau khi bộ chấm chạy thật và có tin quay lại kho, ca đo trên lô thật có thể báo đỏ nhầm vì coi thẻ máy đã rút là thẻ người quyết.
  - Ngoài-2: Dòng «cặp needs_llm chưa có thẻ» vẫn đếm cả cặp rời kho mà máy cố ý không sinh thẻ, nên con số có thể khác 0 dù không sót cặp nào.
