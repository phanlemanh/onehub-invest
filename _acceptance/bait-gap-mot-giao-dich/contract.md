---
schema_version: 1
feature: Bước bait gap của refresh-bait-gap chạy trong một giao dịch có khoá advisory chung — lượt nạp S03, S06 không ghi chồng, đụng khoá hay lỗi giữa chừng không để bait_gap_pct của tin P1 về rỗng
slug: bait-gap-mot-giao-dich
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-10T09:53:27Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-10-bait-gap-mot-giao-dich-design.md
---

# Acceptance Contract: bait-gap-mot-giao-dich

## Context

Tách từ AC-7 của `s03-len-nhanh-nac-1` (yêu cầu N1-58, giám sát duyệt 10/11). `refreshBaitGap` tự-commit từng câu: đặt
`bait_gap_pct = NULL` cho mọi tin P1 rồi mới tính lại, nên giữa hai câu, lượt bị cắt, hay hai lượt chạy cùng lúc đều để
gap rỗng. Review PR #404 (lượt nạp S03 15′) nêu rủi ro lượt nhanh chạy song song job S06 14:00 cùng UPDATE `sale_offers`
mà không có khoá chung; giám sát giữ không bật plist lượt nhanh tới khi hàng này vào main.

## Criteria

- AC-1: (cross-layer) Given DB thử có tin P1 mang `bait_gap_pct` và một phiên khác đang giữ
  `pg_advisory_xact_lock(hashtext('refresh-bait-gap'))`, When tiến trình `refresh-bait-gap.mjs` thật chạy với
  `PGOPTIONS=-c lock_timeout=2s` và mọi tin P1 mang giá trị canh `bait_gap_pct = 999.9`, Then nó thoát ≠ 0 trong vòng
  30 giây với lỗi `lock timeout`, và sau khi phiên kia nhả khoá, mọi tin P1 vẫn mang giá trị canh và `ops_audit` không có
  dòng `bait-gap:*` mới của lượt ấy.
- AC-2: (cross-layer) Given cùng khoá đang giữ, When tiến trình chạy không có `lock_timeout`, Then sau 3 giây nó vẫn
  chưa xong (đang chờ khoá), và khi phiên kia nhả thì nó xong mã 0 trong 120 giây.
- AC-3: (cross-layer) Given DB thử, When hai tiến trình `refresh-bait-gap.mjs` chạy cùng lúc, Then trong lúc chạy có ít
  nhất một lần một phiên chờ khoá `hashtext('refresh-bait-gap')` (`pg_locks.granted = false`), cả hai thoát 0, stderr
  không có `deadlock`, và `bait_gap_pct` của mọi tin P1 sau cùng bằng kết quả của một lượt chạy đơn.
- AC-4: (cross-layer) Given một phiên đọc đếm số tin P1 có `bait_gap_pct` rỗng lặp mỗi 10 ms, When một lượt
  `refresh-bait-gap.mjs` chạy, Then số lớn nhất phiên đọc thấy không vượt số đếm trước lượt và số đếm sau lượt (không thấy
  trạng thái giữa).
- AC-5: Given `buocDem` chạy trong giao dịch của người gọi (`savepoint: true`), When gọi, Then không mở hay commit giao
  dịch riêng (ROLLBACK của người gọi lùi trọn bait gap lẫn danh bạ Người), vẫn lấy khoá chung; `refreshBaitGap` gọi trực
  tiếp giữ nguyên chữ ký và thân.
- AC-6: Given cây sau vòng, When chạy `cd pipeline && npm test` (gồm `bait-gap-sellers`, `danh-ba-nguoi`, các bộ gọi
  `refreshBaitGap`), Then xanh.
- AC-7: (cross-layer) Given mọi tin P1 mang giá trị canh `999.9`, When một bản chép của `refresh-bait-gap.mjs` thật,
  chỉ chèn một lỗi ném ngay sau câu đặt `bait_gap_pct = NULL`, chạy, Then nó thoát ≠ 0 và mọi tin P1 vẫn mang giá trị canh
  (lượt chết giữa chừng không để rỗng).
- AC-8: Given mã nguồn sau vòng, When quét mọi lời gọi `refreshBaitGap(` và `buocDem(` ngoài thư mục test (`pipeline/`,
  `scripts/`, `agent/`), Then mọi lời gọi `refreshBaitGap(` ngoài test hoặc nằm trong `buocDem`, hoặc đứng sau một
  `query("BEGIN")` của cùng tệp (thước chạy trong giao dịch của mình, như `scripts/deals-phi-ly-do.mjs`), và không lời gọi
  `buocDem(` nào ngoài test truyền `savepoint`; quét có đối chứng dương trên một tệp mẫu gọi thẳng `refreshBaitGap(` ngoài
  giao dịch và một tệp gọi sau `BEGIN`.

## Coverage

Trục (quét hình thái, preset risk — thực thể «một lượt bait gap»):
- Người gọi: tiến trình riêng (`savepoint: false`) · trong giao dịch người gọi (`savepoint: true`) · gọi thẳng
  `refreshBaitGap` → AC-1…AC-4 · AC-5 · AC-5, AC-6.
- Đồng thời: một mình · bị giữ khoá có `lock_timeout` · bị giữ khoá không timeout · hai lượt cùng lúc · người đọc song song
  → AC-6 · AC-1 · AC-2 · AC-3 · AC-4.
- Kết cục: xong · thoát vì khoá (P1 nguyên) · chết giữa hai câu → AC-2, AC-3 · AC-1 · AC-7.
- Người gọi tương lai: đường gọi mới ngoài giao dịch → AC-8.
Thước CE: số đo 10/11 trên DB thử (bước 6,1 s) ở design doc §2.

## Out of scope

- OOS-1: `lock_timeout` và bỏ lượt của lượt nạp nhanh S03 — hàng `s03-len-nhanh-nac-1`.
- OOS-2: Đổi cách tính bait gap (thước P2, ngưỡng tin phi lý).
- OOS-3: Giao dịch của `buocVatTheDem`, `resolve-properties`, `transform-*`.

## Notes
