---
schema_version: 1
feature: Lượt làm giàu hằng đêm không tự áp đề xuất có căn cứ (LLM trùng luật E1, LLM trùng tên toà danh bạ) — chúng lên thẻ cho người, tới khi phiếu thứ hai độc lập (NB10); E1 áp thẳng và lượt đọc toàn bộ giữ nguyên
slug: luot-hang-dem-khong-tu-ap-truoc-doc-lap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: approved
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-11-24T03:39:24Z
---

# Acceptance Contract: luot-hang-dem-khong-tu-ap-truoc-doc-lap

## Context

Hàng NB11 (đợt dot0-cam-mau, dãy N1). Lời Mạnh «Chờ sửa xong» 03:35Z 24/11 ở phiên PD: lượt làm giàu hằng đêm không được tự áp
đường có căn cứ cho tới khi NB10 làm phiếu thứ hai độc lập. Lý do: lời nhắc của lượt đêm (`agent/src/enrich/enrich-text.ts:60-61`)
đưa sẵn đáp án luật E1 («Loại hình từ nhóm», «Mã tòa phát hiện»), rồi `agent/src/enrich/route.ts:148` coi LLM trùng E1 là có căn cứ
và áp — phiếu thứ hai không độc lập. Bộ làm giàu chạy lại đêm 24/11, lần đầu từ 21/11, nên hàng gấp.

Phạm vi hẹp: ở lượt hằng đêm (`agent/scripts/enrich-run.ts` → `runEnrich` trong `agent/src/enrich/run.ts`), mọi đề xuất mà
`routeFields` xếp `corroborated` — trùng E1 (`route.ts:148`) và trùng tên toà danh bạ `asset_nodes` (`route.ts:168`) — được ghi là
`review`: vào thẻ chờ duyệt, không gọi `apply_enrichment`. Đề xuất E1 `direct` giữ nguyên; lượt đọc toàn bộ (`doc-toan-bo.ts`, cũng
gọi `routeFields`) không đổi; `routeFields` không đổi.

## Criteria

- AC-1: Given một tin ở lượt hằng đêm mà LLM trả cùng giá trị luật E1 cho một ô (loại hình hoặc toà), When `runEnrich` chạy chế độ
  ghi, Then đề xuất LLM của ô đó được ghi `route='review'`, `status='queued'`, `corroborated_by` rỗng, `evidence.trung_luat='e1'`;
  không dòng `field_assertions` nào được ghi cho ô đó; tin có thẻ «Bổ sung tin» chờ liệt kê ô đó; giá trị ô trên `sale_offers` không
  đổi.
- AC-2: Given LLM trả tên/mã toà khớp một nút `asset_nodes` mà E1 không có toà, When chạy lượt hằng đêm, Then đề xuất toà ghi
  `route='review'` với giá trị tên chuẩn của nút, `evidence.trung_luat='asset_nodes:<slug>'`, không áp, lên thẻ.
- AC-3: Given E1 có giá trị mà LLM vắng (đường `direct`), When chạy lượt hằng đêm, Then đề xuất E1 vẫn `direct` và được áp như trước
  (ô tin đổi, có `field_assertions`).
- AC-4: Given các nhánh khác của `routeFields` (E1 trái LLM, ô đang giữ chờ người, LLM không căn cứ, ô suy ra), When chạy lượt hằng
  đêm, Then kết quả ghi giống hệt trước khi sửa.
- AC-5: Given lượt đọc toàn bộ (`doc-toan-bo.ts`) với cùng một ca LLM trùng E1, When chạy, Then đường áp của nó không đổi (hàng này
  không chạm `doc-toan-bo.ts` hay `routeFields`).
- AC-6: Given bản chép DB máy thu, When chạy một lượt hằng đêm ở chế độ ghi với model giả lập trả trùng E1 cho mọi tin, Then số dòng
  `enrichment_proposals` của lượt có `status='applied' AND corroborated_by IS NOT NULL` = 0; tổng kết lượt in số đề xuất «có căn cứ
  chờ phiếu độc lập» đã chuyển thẻ.

## Coverage

Số đếm DB máy thu 24/11 ~04:00Z (chỉ đọc):

| Trục | Giá trị | AC | Ai đọc phía sau |
|---|---|---|---|
| Lượt đêm đã chạy | 26 lượt `enrich-*` (30/10–21/11) · corroborated 297 · direct 23 · review 939 | — | NB10 (lô «trước độc lập») |
| Corroborated đêm theo căn cứ | loại hình × e1 187 · toà × e1 108 · toà × asset_nodes 2 — đều `applied` | AC-1, AC-2 | NB10 rút/đo bù |
| Direct đêm | loại hình 12 · toà 11 — `applied` | AC-3 | Invest (giá trị tin) |
| Lượt đọc toàn bộ | corroborated 1.993 (trích-dẫn 1.905, e1 88) · direct 25 | AC-5 (không đổi) | — |
| Nhánh routeFields khác | xung đột E1↔LLM · ô giữ · LLM không căn cứ · ô suy ra | AC-4 | thẻ /ops/review |
| Khối lượng thêm vào thẻ | ~11 đề xuất/lượt (297/26), trần ENRICH_LIMIT 50 tin/đêm | AC-1, AC-6 | ô «Chờ duyệt» Bổ sung tin tăng ~11/đêm |

Test có sẵn mang hành vi cũ, sửa cùng hàng: `agent/tests/enrich-db.test.ts` «AC-3 block LLM khớp asset_nodes được áp tên chuẩn»,
«AC-3 E1 thật + asset_nodes thật», «AC-7 đối chứng: LLM đồng ý luật thì áp như cũ».

## Đường đo

Điểm xong: lượt đêm đầu tiên sau khi gộp ghi 0 dòng `applied` có `corroborated_by`. Lệnh đo (DB máy thu, sau lượt đêm):

```sql
SELECT run_id, count(*) FILTER (WHERE status='applied' AND corroborated_by IS NOT NULL) tu_ap_can_cu,
       count(*) FILTER (WHERE evidence ? 'trung_luat') chuyen_the
  FROM enrichment_proposals WHERE run_id LIKE 'enrich-%' AND created_at > '<giờ gộp>' GROUP BY 1;
```

Trước sửa: trung bình 11,4 dòng tự áp có căn cứ mỗi lượt. Sau: 0.

## Out of scope

- Phiếu thứ hai độc lập, bỏ đáp án E1 khỏi lời nhắc, ghi tạm có hạn, rút lô 297 giá trị cũ (NB10).
- Lượt đọc toàn bộ `doc-toan-bo.ts` và đường xử lại `skipped` của nó.
- Đổi trần `ENRICH_LIMIT`, sửa `scripts/zalo-import-daily.sh` (làn ZCode).
- Migration, bảng mới.

## Known limits

## Notes
