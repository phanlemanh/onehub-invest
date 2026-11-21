# Bản chép DB thử chưa áp 122 — ba lời gọi `ap122NeuThieu` ngoài vùng (GS duyệt 21/11)

**Vì sao:** test của app và pipeline dựng lược đồ thử bằng cách chép sổ nguồn từ `public` của bản chép DB máy thu
(`db/db-thu.sh --chay`), hoặc đọc thẳng `public`. Trước khi 122 áp lên máy thu, bản chép thiếu cột, và mã mới ném lỗi «áp migration
122» — đúng như AC-2 đòi. Sau khi áp lên máy thu, hay trên CI (DB dựng từ migration), các ca này tự xanh mà không cần sửa.

**Cách chữa (GS duyệt lối khuyến nghị; bác hai lối «áp 122 trước gộp» và «sửa db/db-thu.sh» trong hàng này):**
`scripts/lib/so-nguon-122.mjs` có hàm `ap122NeuThieu(client)`:
- Sổ đã có cột → không làm gì, với mọi DB (DB chung sau khi áp: lời gọi thành phép không).
- Thiếu cột, DB là DB thử (`oneinvest_suite_*`, `oneinvest_dbv_*`) → áp CHÍNH tệp `db/migrations/122_*.sql` (đọc tệp, không chép
  SQL), idempotent, khoá cố vấn 122122.
- Thiếu cột, DB khác (`oneinvest`, tên lạ) → ném lỗi gọi tên DB.

Ca `NK ap122NeuThieu` + chiều đỏ «gỡ rào tên DB thì ca từ chối đỏ» ở `scripts/so-nguon-kho.test.mjs`. Mỗi tệp ngoài vùng đúng một
dòng gọi, không đổi phép so nào:
`pipeline/scripts/ops-facts-fixture.mjs` (makeOpsSchema), `app/tests/ops-nhan-theo-context.test.tsx` (ON12-AC-7),
`app/tests/ops-cloud-khong-bang-nap.test.tsx` (OP-AC-2).

## Trước / sau (bản chép DB máy thu chưa áp 122, 21/11)

| Tệp | Ca | Trước (b629bf0d2) | Sau |
|---|---|---|---|
| app/tests/collections-khong-so-s02.test.tsx | ON6-AC-6 | 2 đỏ | xanh |
| app/tests/coverage-cloud-got-tang-a.test.tsx | AU12-AC-1..4, AU12-AC-6 | 10 đỏ | xanh |
| app/tests/lockdown-cloud-theo-facts.test.tsx | ON23-AC-6 | 1 đỏ | xanh |
| app/tests/nhom-s03-tren-cloud.test.tsx | ON4-AC-6 | 5 đỏ | xanh |
| app/tests/o-kpi-chi-do-local.test.tsx | ON3-AC-2/3/4/7 | 5 đỏ | xanh |
| app/tests/ops-cloud-khong-bang-nap.test.tsx | OP-AC-2 | 1 đỏ | xanh |
| app/tests/ops-facts-so-tong-hop.test.tsx | ON22-AC-3, ON22-AC-9 | 3 đỏ | xanh |
| app/tests/ops-nhan-theo-context.test.tsx | ON12-AC-7 | 1 đỏ | xanh |
| app/tests/quyen-bon-vai.test.tsx | QV-AC-2, QV-AC-10 | 2 đỏ | QV-AC-10 xanh; **QV-AC-2 còn đỏ** |
| **9 tệp** | | **30 đỏ** | **29 xanh, 1 đỏ** |

Lượt «sau»: 10 tệp (9 tệp trên + slo-mot-nguon), 169 ca, 168 xanh. QV-AC-2 gọi route coverage trên lược đồ đọc xuyên xuống
`public` trước khi có tệp nào áp 122 vào bản chép: tệp chỉ gọi makeOpsSchema ở ca cuối, và các tệp chạy song song theo tiến trình
riêng nên thứ tự không chắc. Sau khi máy thu áp, ca này tự xanh.

Pipeline và scripts cùng bản chép (`ops-facts-so-tong-hop.test.mjs`, `bao-cao-ngay.test.mjs`, `check-freshness`, `freshness-parity`,
`s05-slo`, `so-nguon-kho`): 131/131 xanh.

## Known limits

- Ba lời gọi `ap122NeuThieu` thành phép không khi 122 đã áp lên máy thu. GS sẽ cắt một hàng hạ tầng riêng sau chuyển máy («bản
  chép DB thử tự nhận migration chưa áp», gỡ ba lời gọi). NK1 không làm việc đó.
- Executor chạy thẳng trên DB chung `oneinvest` (không qua `db-thu.sh`), như `s08l_do`, `tl_bao_cao`, `check_freshness`: từ lúc
  gộp tới lúc áp, lượt chấm của hàng khác đã gộp main mới sẽ đỏ «áp migration 122». Checkout chính không bị ảnh hưởng, vì
  `ap-may-thu.md` áp trước khi kéo; khoảng này chỉ vài phút.
