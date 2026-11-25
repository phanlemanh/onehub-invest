---
schema_version: 1
feature: Transform S06 không ghi ô chữ địa chỉ mang tên nguồn thật, nên bộ soát tầng A của sync-cloud không còn dừng cả lượt đồng bộ vì một ô
slug: street-raw-khong-mang-ten-nguon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T09:11:22Z
approved_by:
approved_at:
---

# Acceptance Contract: street-raw-khong-mang-ten-nguon

## Context

Hàng PL39, GS giao gấp 25/11. Đồng bộ cloud dừng từ 23:34Z 24/11: `assertNoSourceNames` của `pipeline/sync-cloud.mjs` trúng một ô
`sale_offers.street_raw` (tin `offer_ba52ee3409d223e3`, S06, cho thuê, đăng 17:06Z 24/11) mang định danh nguồn. Bộ chặn đúng
thiết kế, nhưng cloud đứng số. Ô đến từ phát biểu `payload.street_name` của transform S06; bước phân xử (`resolve_offer_fields`,
061) dựng cột từ phát biểu sống, nên đặt NULL tay ở cột thì lượt transform sau ghi lại.

Luật: ở transform S06, giá trị mà bộ dò tên nguồn trúng thì không ghi. Bộ dò là `findSourceNames` của
`pipeline/lib/mask-source-names.mjs`, sổ tên đọc bằng `docSourceNameEntries`: đúng lõi và đúng sổ mà bộ soát sync-cloud dùng
(`tier-a-guard.mjs`). Đường, toà: không ghi phát biểu; rồi rút MỌI phát biểu sống của S06 ở hai trường ấy mà giá trị trúng (mọi
phương pháp, kể cả `legacy`) với lý do `mang-ten-nguon`; bộ phân xử trả cột về phát biểu sạch còn lại hoặc NULL. Phường, quận
(ghi thẳng lúc tạo dòng): ghi NULL. Lượt in một dòng đếm giá trị bỏ ghi theo cột và số chủ thể đã rút. Trần một lượt 50: vượt thì
job dừng, không rút, không ghi (sổ nguồn có token chung chung thì không NULL hàng loạt lặng lẽ).

Ô của sự cố đã được GS gỡ tay 09:13Z 25/11 bằng đúng đường của luật (rút phát biểu lý do `mang-ten-nguon` rồi phân xử lại), có
lời Mạnh. Phép đo vì thế cấy tên nguồn vào bản chép, và soát thêm ô thật khi bản chép còn nó.

## Bảng phủ ca (DB máy thu 25/11, chỉ đọc, `probes/s1/quet.mjs`)

Đếm ô có chữ và ô trúng bộ soát, theo nguồn × cột chữ của các bảng lên cloud. Không in giá trị.

| Nguồn | Cột | Ô có chữ | Trúng | Ai ghi | Ai đọc phía sau | Xử lý |
|---|---|---|---|---|---|---|
| S06 | street_raw | 136.262 | 1 | transform S06 → phát biểu `payload.street_name` | sync-cloud; `app/src/lib/deals.ts`; `offers-public.ts` (đã che); `review-card.tsx:217`; `duong-can.mjs` → `properties.street`; agent enrich | luật PL39 |
| S06 | block_raw | 4.913 | 0 | transform S06 → phát biểu `payload.block` | sync-cloud; `deals.ts`; `offers-public.ts` (đã che); `review-card.tsx:218`; danh bạ vật thể | luật PL39 |
| S06 | district_raw | 139.449 | 0 | transform S06, ghi thẳng lúc tạo dòng | sync-cloud; `deals.ts` | luật PL39 (dòng mới) |
| S06 | phuong_raw | 136.835 | 0 | transform S06, ghi thẳng | sync-cloud; gắn khu vực | luật PL39 |
| S06 | floor_raw | 747 | 0 | không phải transform S06 | sync-cloud; `deals.ts` | ngoài phạm vi, vì transform S06 không ghi |
| S06 | seller_name | 139.449 | 3 | transform S06 | sync-cloud che lúc gửi (`MASKED_COLS`) | ngoài phạm vi, vì đã che, không chặn sync |
| S03 | block_raw, floor_raw, phuong_raw | 4.939 · 374 · 102 | 0 | bộ đọc tin S03 | sync-cloud; `deals.ts` | ngoài phạm vi, vì 0 trúng và không phải transform S06 |
| S05 | block_raw, phuong_raw | 1 · 13 | 0 | transform S05 | sync-cloud | ngoài phạm vi, vì 0 trúng |
| — | sellers (5 cột), properties (18 cột) | 13.847 · 120.371 dòng | 0 | resolve, duong-can | sync-cloud | ngoài phạm vi, vì 0 trúng; phép đo chạy duong-can sau lượt thật |

Lớp phát biểu sống (cùng ngày, sau khi ô sự cố đã gỡ, `probes/s1/phat-bieu.mjs`), nguồn × trường × phương pháp: sống / trúng.

| Nguồn | street_raw | block_raw | floor_raw | Xử lý |
|---|---|---|---|---|
| S06 | source_field 136.257 / 0 · legacy 8.218 / 0 | source_field 4.913 / 0 · legacy 546 / 0 | legacy 747 / 0 | luật rút đường, toà mọi phương pháp; tầng ngoài phạm vi, vì transform S06 không ghi và 0 trúng |
| S03 | — | parser 58.093 / 0 · e2_llm 110 / 0 · e1_rule 10 / 0 · hitl 1 / 0 | parser 2.953 / 0 | ngoài phạm vi, vì 0 trúng và không phải transform S06 |
| S05 | — | e1_rule 1 / 0 · legacy 1 / 0 | — | ngoài phạm vi, vì 0 trúng |

## Acceptance Criteria

- **AC-1** Given bản chép DB máy thu, tin A có sẵn được cấy đường và toà mang tên nguồn ở nguồn, tin B có sẵn chỉ còn đường từ một
  phát biểu `legacy` mang tên nguồn, When chạy transform S06 thật sau lượt bỏ luật, Then đúng các ô mang tên nguồn đổi (A đường,
  toà; B đường; ô thật `offer_ba52ee3409d223e3` khi bản chép còn nó) và không ô nào trong số đó còn trúng bộ dò (về NULL hoặc về
  phát biểu sạch còn lại); mọi ô đường, toà, phường, quận khác của tin S06 có sẵn giống hệt sau lượt bỏ luật; tin mới N cấy cả bốn
  cột về NULL; dòng log `ô chữ mang tên nguồn: bỏ ghi … · rút … chủ thể` bằng đếm độc lập trên `stg_chotot_ads` và trên phát biểu sống.
- **AC-2** Given cùng bản chép, When chạy bản transform bỏ luật, Then bộ soát của sync-cloud (đọc như lượt sync: `selectList`,
  `localReadSql`, `assertNoSourceNames`) dừng ở `sale_offers`; When chạy transform thật rồi bước chép đường sang căn (`dienDuongCan`),
  Then bộ soát qua trọn `sale_offers`, `sellers`, `properties`.
- **AC-3** Given cùng bản chép, When đo riêng chi phí của luật (bộ dò trên mọi giá trị chữ của lượt cộng câu đọc phát biểu sống
  để rút), Then chi phí ấy không quá 5% thời gian lượt transform thật. Tỉ lệ lượt thật so lượt bỏ luật in kèm, chỉ tham khảo (một
  mẫu, thứ tự cố định).
- **AC-4** Given sổ tên giả, When gọi luật với chữ cấy (có dấu, NFD, viết liền, tên miền) và chữ sạch, Then luật trúng đúng chỗ bộ
  soát sync-cloud trúng; sổ rỗng thì không lọc; dựng sẵn biến thể theo mảng sổ không đổi kết quả của bộ dò, sổ thêm mục tại chỗ
  thì bộ dò thấy tên mới; test hiện có của bộ che và bộ soát vẫn xanh.
- **AC-5** Given một lượt có hơn 50 giá trị chữ hay phát biểu sống mang tên nguồn, When transform S06 chạy, Then lượt dừng với
  thông điệp «vượt trần 50 — dừng, không rút, không ghi» TRƯỚC mọi lần ghi: số tin, phát biểu và phát biểu đã rút không đổi; đúng
  50 thì đi tiếp.

## Coverage

- Nguồn × cột: bảng phủ ca ở trên. Luật phủ bốn cột chữ mà transform S06 ghi; các cột còn lại ghi lý do ở cột Xử lý.
- Đường đi của giá trị: phát biểu (đường, toà) và ghi thẳng (phường, quận). Tin có sẵn và tin mới.
- Sổ tên: có mục và rỗng.

## Đường đo

- Đường găng: đồng bộ cloud đứng từ 23:34Z 24/11, số trên cổng cloud không đổi từ đó. Sau gộp, lượt `chotot-daily` kế tiếp chạy transform S06 thì ô
  về NULL, lượt sync kế tiếp qua bộ soát. Lệnh đo sau áp: `node _acceptance/street-raw-khong-mang-ten-nguon/probes/s1/quet.mjs`
  (`o_trung` chỉ còn ô seller_name đã che) và log lượt sync không còn dòng «giá trị mang định danh nguồn».

## Out of scope

- Đặt NULL tay ô hiện tại để cloud chạy lại ngay: GS xin Mạnh riêng, hàng này không sửa ô đó.
- Transform S03, S05 và bộ đọc tin: 0 ô trúng 25/11; không đổi.
- Dòng S06 cũ có quận, phường mang tên nguồn: câu upsert không ghi đè hai cột ấy; 25/11 có 0 ô như vậy.
- `properties.street` và `enrichment_log` đã chép tên nguồn trước khi luật áp: 25/11 có 0 ô; duong-can chỉ điền ô căn đang trống.
- Sửa bộ soát sync-cloud hay sổ nguồn: bộ soát đúng thiết kế.

## Notes

- S3 25/11, phép đo trên bản chép (`probes/ban-chep.sh`), lượt 4 xanh: ca phá dừng ở `sale_offers.street_raw`; 3 ô đổi giữa lượt bỏ
  luật và lượt thật (A đường, toà; B đường legacy), 2 về NULL, 1 về phát biểu sạch còn lại; tin mới N bốn cột NULL; log «bỏ ghi
  street_raw 2 · block_raw 2 · phuong_raw 1 · district_raw 1 · rút 2 chủ thể» bằng đếm độc lập; bộ soát qua ba bảng sau duong-can.
- Chi phí riêng của luật 1,4–2,0 s, tức 0,42–0,61% lượt transform (243–476 s) qua ba lượt. Tỉ lệ cả lượt thật so lượt bỏ luật
  dao động 0,873–1,372 qua ba lượt: nhiễu máy (dãy khác giữ s4) lớn hơn hẳn chi phí luật, nên AC-3 đo chi phí riêng.
- Lượt 1–3 đỏ ở phép đo, không ở luật: lượt 1 chứng legacy sạch thắng khi rút fact (dẫn tới sửa AC-1); lượt 2–3 phát biểu legacy
  cấy thiếu `evidence.offer_id` nên bộ phân xử bỏ qua.

