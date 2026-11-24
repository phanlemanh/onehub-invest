---
schema_version: 1
feature: Máy đóng theo luật xác định các thẻ «Bổ sung tin» không còn việc cho người (không còn đề xuất chờ, hoặc mọi đề xuất chờ trùng giá trị tin đang có), ghi lý do từng thẻ, có chạy thử, chạy thật trong một giao dịch và lệnh lùi — tin không đổi
slug: dong-the-bo-sung-tin-theo-luat
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: approved
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-11-24T02:19:31Z
---

# Acceptance Contract: dong-the-bo-sung-tin-theo-luat

## Context

Hàng NB9 (đợt dot0-cam-mau, dãy N1). Lời Mạnh 24/11 ở phiên PD: «Cho đóng 462 thẻ», «Đầu tiên dọn trước» — dọn thẻ tồn trước, giải
pháp chịu khối lượng lớn bàn sau (`research-local/phe-duyet-agent-2411.md`; audit `research-local/audit-phan-loai-enrich-2411.md` §6).
Hàng «Bổ sung tin» ở `/ops/review` máy thu: 1.047 thẻ chờ, tuổi TB 16 ngày, người quyết 6 thẻ trong 21 ngày. Đây là phần «đóng thẻ»
mà NB1 (`_acceptance/cham-bong-bo-sung-tin/`, Out of scope dòng 4) để ngoài phạm vi.

Hàng viết một lệnh máy đóng hai nhóm thẻ theo luật xác định, không gọi model:

- **Nhóm 1 `khong-con-de-xuat`**: thẻ chờ không còn đề xuất nào `status='queued'` trỏ `review_id` về nó.
- **Nhóm 2 `trung-gia-tri-tin`**: thẻ chờ có ít nhất một đề xuất chờ, và MỌI đề xuất chờ của nó là ô `property_type` hoặc `bedrooms`
  có giá trị trùng đúng giá trị `sale_offers` đang có của tin đó (so theo `value_key` với giá trị tin dạng chữ; tin vắng khỏi
  `sale_offers` hay ô tin trống thì KHÔNG tính là trùng). Các đề xuất chờ của thẻ chuyển `skipped` (không áp).

Hợp đồng ghi LUẬT, không ghi cứng số: số đếm 24/11 (230 + 232 = 462, còn 585) có thể lệch hôm chạy; lệnh chạy thử in số hôm đó.

## Criteria

- AC-1: Given DB có thẻ `agent_output` `enrich:<offer_id>` ở mọi trạng thái thẻ (chờ, đã duyệt, đã bác, «Để sau») và đề xuất ở mọi
  trạng thái (`queued`, `applied`, `skipped`, `rejected`, `superseded`, `reverted`) trên năm ô, When phân nhóm, Then một thẻ thuộc
  nhóm 1 khi và chỉ khi nó đang chờ và 0 đề xuất `queued` trỏ về nó; thuộc nhóm 2 khi và chỉ khi nó đang chờ, có ≥ 1 đề xuất `queued`
  và mọi đề xuất `queued` của nó là `property_type`/`bedrooms` trùng giá trị tin hiện có; mọi thẻ khác (gồm thẻ có một đề xuất lệch
  bên cạnh đề xuất trùng, thẻ có ô `bathrooms`/`block_raw`/`street_raw`, ô tin trống, tin không còn trong `sale_offers`, thẻ không
  ở trạng thái chờ, thẻ loại khác `agent_output`) không thuộc nhóm nào.
- AC-2: Given DB như AC-1, When chạy lệnh với `--thu`, Then in số thẻ và số đề xuất của từng nhóm, số thẻ chờ còn lại, và câu SQL
  đếm độc lập cho từng nhóm; mọi bảng sau lượt bằng trước lượt từng dòng (lệnh đọc trong giao dịch chỉ đọc).
- AC-3: Given DB như AC-1, When chạy thật, Then trong MỘT giao dịch: mỗi thẻ nhóm 1 và nhóm 2 chuyển `status='rejected'`,
  `decided_by` mang tiền tố máy `may:dong-the-theo-luat`, `decided_at=now()`, `decision_note` nêu mã nhóm và lý do một câu tiếng Việt;
  mỗi đề xuất `queued` của thẻ nhóm 2 chuyển `skipped`, `decided_by` cùng giá trị, `evidence.ly_do='trung-gia-tri-tin'` (khoá cũ
  giữ trong tệp lùi); KHÔNG dòng nào khác của `review_queue`/`enrichment_proposals` đổi, và `sale_offers`, `sale_offer_records`,
  `field_assertions` sau lượt bằng trước lượt từng dòng.
- AC-4: Given giữa lúc phân nhóm và lúc ghi có thẻ đổi (người quyết thẻ trên `/ops/review`, lượt enrich gắn đề xuất mới vào thẻ),
  When chạy thật, Then nhóm được tính lại trong chính giao dịch ghi với khoá dòng thẻ (`FOR UPDATE`), thẻ không còn ở trạng thái chờ
  hay không còn khớp luật thì không bị đóng, và số in ra là số thật đã ghi.
- AC-5: Given lượt chạy thật, When ghi xong, Then có một tệp lùi (ngoài git, dưới `.acceptance-runs/<slug>/`) ghi mỗi thẻ đã đóng
  (id, trạng thái, `decided_by`, `decided_at`, `decision_note` cũ) và mỗi đề xuất đã đổi (id, trạng thái, `decided_by`, `evidence` cũ);
  lỗi giữa chừng thì giao dịch lùi trọn, không còn tệp lùi nửa vời được coi là hợp lệ.
- AC-6: Given tệp lùi của một lượt, When chạy `--lui <tệp>`, Then trong một giao dịch mọi thẻ và đề xuất trong tệp về đúng giá trị
  cũ khi giá trị hiện tại còn bằng giá trị lượt đã ghi; dòng đã bị người hay lượt khác đổi sau đó thì KHÔNG ghi đè, in danh sách xung
  đột và thoát khác 0; sau lùi, băm hai bảng bằng băm trước lượt chạy thật (khi không có xung đột).
- AC-7: Given đã chạy thật một lần, When chạy thật lần hai trên cùng DB, Then 0 thẻ, 0 đề xuất đổi (lệnh lặp an toàn).
- AC-8: Given đề xuất nhóm 2 đã chuyển `skipped`, When chạy đường xử lại `skipped` của `agent/src/enrich/doc-toan-bo.ts` (lọc
  `evidence.ly_do='khong-tu-khoa'`), Then không đề xuất nào của lượt đóng thẻ bị đưa lại `queued` hay bị áp.
- AC-9: Given DB có thẻ người quyết (`decided_by` mã người dùng) và thẻ máy đóng theo luật (`decided_by LIKE 'may:%'`) cùng trong
  cửa sổ đếm, When tính số «Đã quyết hôm nay» trên đầu trang `/ops/review` (`DAU_TRANG_SQL`) và «công người — quyết 24 giờ» của báo
  cáo ngày (`CONG_NGUOI_SQL`), Then thẻ `decided_by LIKE 'may:%'` không được đếm; số «Chờ duyệt» vẫn giảm theo thẻ máy đóng; thẻ
  người quyết vẫn được đếm như trước.

## Coverage

Bảng phủ ca, số đếm từ DB máy thu 24/11 (truy vấn chỉ đọc; lệnh ở `bang-phu-ca.md`):

| Trục | Giá trị (số 24/11) | AC / ngoài phạm vi | Ai đọc đầu ra phía sau |
|---|---|---|---|
| Trạng thái thẻ `agent_output` | chờ 1.047 · duyệt 1 · bác 4 · «Để sau» 4 | AC-1 (chỉ thẻ chờ) | `/ops/review` ô «Chờ duyệt» (lọc `pending`) |
| Đề xuất `queued` trên thẻ chờ | 0 đề xuất: 230 thẻ · ≥ 1: 817 thẻ / 1.121 đề xuất | AC-1 nhóm 1 | NB1 chấm bóng (`cham-bong/doc-db.ts` đọc thẻ chờ JOIN đề xuất `queued`) |
| Nhóm 1 theo đề xuất cùng tin | tin 0 đề xuất 142 · có `applied/corroborated` 60 · `skipped/review` 30 · `applied/direct` 1 | AC-1 (luật không xét đề xuất ngoài thẻ) | — |
| Ô × trùng/lệch (đề xuất chờ) | loại hình trùng 383 / lệch 235 · PN trùng 47 / lệch 12 / ô tin trống 8 · WC 237 · toà 181 · đường 18 | AC-1, AC-3 | NB5 lô WC; nhóm lệch loại hình (ngoài phạm vi) |
| Thẻ toàn trùng | 232 thẻ · còn lại 585 thẻ | AC-1 nhóm 2 | Đường găng: ô «Chờ duyệt» 1.047 → ~585 |
| Tin của đề xuất | còn trong `sale_offers` 100% đề xuất chờ (0 vắng) | AC-1 (vắng = không trùng) | — |
| `evidence.ly_do` đề xuất chờ | rỗng 1.121 | AC-3, AC-8 | `doc-toan-bo.ts` xử lại `skipped` lọc `ly_do='khong-tu-khoa'` |
| Đổi giữa phân nhóm và ghi | người quyết · enrich gắn đề xuất mới | AC-4 | `decide/route.ts` khoá `FOR UPDATE` cùng dòng thẻ |
| Chế độ | thử · thật · chạy lại · lùi · lùi có xung đột | AC-2, AC-3, AC-5, AC-6, AC-7 | Mạnh ký Cổng Bằng chứng kèm lời áp |
| Bảng khác | `sale_offers` · `sale_offer_records` · `field_assertions` | AC-3 (không đổi) | Invest, cloud sync |
| Cloud | `review_queue` là bảng tầng A, không sync (`pipeline/sync-cloud.mjs` `TIER_A_TABLES`) | ngoài phạm vi: không ghi cloud | — |
| `nap-lai-matrix` | đếm thẻ `approved/rejected` và đề xuất `skipped` là «đã quyết» | AC-3 (giữ khi nạp lại) | `pipeline/lib/nap-lai-matrix.mjs` |

### Ai đọc thẻ `rejected` phía sau (GS phán 24/11: không bên nào được coi thẻ máy đóng là «đề xuất sai» hay «người quyết»)

Quét mọi tệp đọc `review_queue` trong `app/src`, `agent/src`, `pipeline`, `scripts` (trừ test):

| Bên đọc | Đọc thẻ đã quyết thế nào | Lọc `decided_by` hôm nay | Xử lý |
|---|---|---|---|
| `app/src/lib/ops/review-dau-trang.ts` `DAU_TRANG_SQL` — ô «Đã quyết hôm nay» `/ops/review` | đếm mọi thẻ `decided_at` hôm nay | không lọc | AC-9: thêm `decided_by NOT LIKE 'may:%'` (một dòng) |
| `scripts/bao-cao-ngay.mjs` `CONG_NGUOI_SQL` — «công người» H1b quyết 24 giờ | đếm mọi thẻ `decided_at` 24 giờ | không lọc | AC-9: thêm `decided_by NOT LIKE 'may:%'` (một dòng) |
| `app/src/lib/ops/review-gan-day.ts` — «quyết gần đây» | đọc `ops_audit` do route decide ghi | — (lượt máy không ghi `ops_audit` decide) | không cần sửa |
| `app/src/lib/ops/review-hang-muc.ts`, `review-nap.ts` — lọc «Đã quyết» | liệt kê, nhãn «Đã bỏ»; không tính tỉ lệ | không lọc | hiển thị, không phải số đo — ngoài phạm vi |
| `agent/src/enrich/cham-bong/*` (NB1) | chỉ thẻ `pending` | — | không bị ảnh hưởng |
| `agent/src/enrich/run.ts` | thẻ `pending`/`deferred`; đề xuất `queued` không có thẻ chờ thì gắn thẻ mới | — | nhóm 2 đã `skipped` → không gắn lại (AC-3) |
| `pipeline/lib/nap-lai-matrix.mjs` | đếm hiện diện để giữ khi nạp lại, không tính tỉ lệ | — | không cần sửa |
| `pipeline/lib/the-duyet-nguoi.mjs`, `do-the-duyet.mjs`, `s09/s16-*` | chỉ thẻ `data_quality`/`entity_match` | — | không bị ảnh hưởng |
| `scripts/lib/ops-local.mjs`, `data-flow-queries.ts` | chỉ đếm `pending` | — | «Chờ duyệt» giảm đúng ý |
| Cloud (`sync-cloud.mjs`, `ops-cloud-proto.mjs`, ops facts) | `review_queue` tầng A, không lên cloud | — | không bị ảnh hưởng |
| `app/src/lib/ops/eval/**` | không đọc `review_queue` hay `enrichment_proposals` | — | không bị ảnh hưởng |

Hai bên đọc có sẵn cũng đang đếm thẻ máy đóng đời trước (`transform:S0x`, `may-da37`) là «quyết»: ngoài phạm vi, báo GS.

## Đường đo

Điểm xong (đường găng): ô «Chờ duyệt» của Bổ sung tin trên `/ops/review` máy thu từ 1.047 xuống bằng số thẻ còn lại mà lệnh `--thu`
in hôm áp (24/11 đếm ~585). Lệnh đo trước và sau áp:

```sql
SELECT status, count(*) FROM review_queue WHERE item_type='agent_output' GROUP BY 1;
```

Kèm: số dòng `sale_offers`/`field_assertions` và băm từng dòng trước = sau (AC-3); đếm đề xuất `skipped` có `decided_by` máy bằng số
lệnh in (AC-3).

## Hồ sơ áp (đủ năm thứ, cho chữ ký Cổng Bằng chứng)

Lệnh áp · số chạy thử (`--thu` hôm áp) · sao lưu trước (`scripts/db-sao-luu.sh` hoặc `pg_dump -t review_queue -t enrichment_proposals`)
· cách lùi (`--lui <tệp>`, AC-6) · lệnh kiểm sau (Đường đo). Áp sau khi PR gộp, từ `main`, chỉ khi Mạnh ký; số thật lệch số thử thì
dừng và báo, không tự sửa cho khớp.

## Out of scope

- 585 thẻ còn lại: lệch giá trị loại hình (Mạnh quyết theo nhóm), toà ô trống (PL20), WC (lô NB5) — Mạnh chưa chốt.
- Trợ lý model lớn chấm thẻ; đường tự áp `corroborated` (2.290 giá trị) — Mạnh chưa chốt.
- Đổi `sale_offers`, `field_assertions`, áp đề xuất.
- Thẻ loại khác (`data_quality`, `entity_match`, `source_decision`).
- Ghi lên cloud (Supabase); sửa route `/api/v1/ops/review/[id]/decide` (đường T3).
- Chạy thật trên DB máy thu trong vòng này — chỉ sau chữ ký Cổng Bằng chứng.

## Known limits

## Notes

- Trạng thái đóng chọn `rejected` (sổ quyết định d-…-2): `review_queue` không có trạng thái «đóng»; tiền lệ máy đóng thẻ enrich là
  `rejected` với `decided_by='transform:S0x'`; `deferred` nghĩa là «giữ đề xuất để lượt sau gắn lại» — trái ý đóng.
