---
schema_version: 1
feature: "Câu rút «thay bởi lượt» của writeAssertions hết bậc hai ở mọi kế hoạch; ca đối chiếu SLT-DC nhả khoá 33033 khi hết trần, trần khớp thời gian thật — SLT-DC cả tệp dưới 6 phút, pipeline_b dưới 25 phút"
slug: slt-dc-cham-va-giu-khoa-33033
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-20T11:38:00Z
design_doc: docs/superpowers/specs/2026-11-20-slt-dc-cham-va-giu-khoa-33033-design.md
approved_by:
approved_at:
---

# Acceptance Contract: slt-dc-cham-va-giu-khoa-33033

## Context

Giám sát đợt `dot0-cam-mau` giao 20/11 10:45Z (dãy U2, uu_tien −305, mốc 15/11), phán hướng sửa 11:00Z và 11:08Z. Lượt chấm của
mọi dãy kẹt ở `pipeline_b`: SLT-DC-7/9 (`pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`) hết trần 1.200 s, SLT-DC-10
chờ khoá 33033 mà ca 7/9 đã hết trần vẫn giữ (node:test không huỷ promise khi hết trần).

Đo 20/11 (ghi chú `u2-do-cau-moi-slt-dc-2011.md` của đợt), trên DB chép của lượt (bản mẫu `db-thu.sh` đã VACUUM ANALYZE 05:31Z):
- Câu rút ở `pipeline/lib/assert.mjs:42` (main a60adccb8) với mảng 213.175 dòng (lượt transform suy loại TẮT): > 180 s, sau
  `ANALYZE` vẫn > 180 s; ép `enable_nestloop = off`: 1,3 s, cùng kết quả. Gốc: planner ước phép nối ra 1 dòng (thật 213.175) và
  chọn Nested Loop Anti Join quét lại bảng tạm `moi` cho mỗi dòng ngoài — bậc hai. Thống kê bảng không chữa được.
- Mảng 374.276 (suy loại BẬT — đường sản xuất): Hash Right Anti Join, 2,1 s. DB máy thu (EXPLAIN chỉ đọc): lật giữa 100k và 150k;
  bản chép thống kê tươi: lật giữa 213k và 374k. Sản xuất đang ở phía an toàn nhưng không có biên đo được.
- Câu viết lại (gom khoá mới thành mảng, lọc `<> ALL`, bỏ anti join): ≤ 1,7 s ở mọi kế hoạch, tập id rút trùng câu cũ ở 2k,
  100k, 213k, 374k.

Không migration, không DDL (GS 11:00Z). Không ANALYZE DB máy thu.

## Criteria

- AC-1 (tương đương, ca biên): Given phát biểu mồi `TRT:*` trên DB của lượt trong BEGIN … ROLLBACK, When gọi `writeAssertions(…,
  { replaceOwn: true })` với bảy ca biên — một bộ (chủ thể, trường, phương pháp) nhiều khoá; khác dạng chữ và số (' LÁNG ' với
  'Láng', '2' với '02'); `not_stated`; bộ chỉ có ở mảng; dòng đã rút từ trước cùng dòng khác phương pháp; trùng hệt trong mảng;
  bộ chỉ có ở bảng (TRT:c vắng khỏi mảng) — Then tập id bị rút trùng hệt tập id câu cũ rút trên cùng trạng thái (câu cũ ép
  `enable_nestloop = off`), 0 lệch; đối chứng dương: ca một rút đúng 1 dòng, ca «chỉ ở bảng» rút 0, ở cả câu cũ lẫn câu mới;
  mảng rỗng không chạy câu nào; hai bản phá (`<> ALL` → `= ANY`; bỏ điều kiện phương pháp) đều đỏ ghim «TR-AC-1 tập rút lệch câu cũ».
  Căn cứ `<> ALL` ≡ NOT EXISTS: cột `value` NOT NULL (045), nên `value_key` và mọi phần tử của mảng khoá không NULL.
- AC-2 (tương đương, lượt thật mọi nguồn): Given DB của lượt chép từ DB máy thu, When chạy trong một giao dịch ROLLBACK chuỗi
  transform của SLT-DC-7/9 (S03 suy loại tắt → bật → tắt), rồi một lượt S06 (transform-chotot) và một lượt S05 (transform-fb),
  Then ở mỗi lần gọi câu rút (≥ 5 lần) tập id câu cũ rút trùng tập id câu mới rút, lệch 0, với cả mảng thật lẫn mảng nhiễu (1/20
  giá trị đổi — tổng rút nhiễu > 0 là đối chứng dương); câu mới mỗi lần dưới 60 s (gồm mảng S06 cỡ ~800 nghìn) — in «TUONG DUONG OK».
- AC-3 (không bậc hai): Given n phát biểu sống `TRT:n` nạp trong giao dịch và mảng cùng cỡ đổi 5% giá trị, When EXPLAIN và chạy câu
  rút ở n = 10, 1.000, 200.000 dưới hai chế độ ép (tắt hash join + merge join; tắt nested loop + merge join), Then không kế hoạch nào
  có «Anti Join», mỗi lượt dưới 30 s và rút đúng n/20 dòng; câu cũ ép nested loop ở 200.000 đỏ ghim «TR-AC-3 kế hoạch có Anti Join».
- AC-4 (nhả khoá khi hết trần): Given một ca mở giao dịch giữ 33033 bằng `moGiaoDichGiuKhoa` (lib/nap-045.mjs) và đang chạy câu
  dài, When (a) `signal` của ca bị huỷ, và (b) node:test TỰ hết trần một ca thật trong tệp test tạm (trần 2 s, không abort tay),
  Then phiên DB của ca bị cắt và 33033 rảnh — (a) trong 5 s, (b) trong 8 s sau trần; bản không truyền `signal` (như trước hồ sơ)
  đỏ ở cả (a) «SLT-DC-KHOA 33033 vẫn bị giữ» lẫn (b); `SHOW transaction_timeout` trong giao dịch của ca 7/9 và ca 10 bằng đúng
  trần + 30 s (lưới phía máy chủ khi tiến trình test chết hẳn).
- AC-5 (trần khớp thời gian thật): Given DB của lượt, When chạy cả tệp SLT-DC, Then mọi ca xanh, cả tệp dưới 360 s (6 phút), và
  trần ca đặt theo số đo ghi trong mã (20/11: ca 7/9 232 s → trần 480 s; ca 10 24 s → trần 60 s; cả tệp 278 s) — 33033 không bị
  một ca giữ quá trần của nó: N = 480 s (giám sát đồng ý 11:58Z; căn cứ ca 7/9 đo 232 s, trần ≈ 2 lần), lúc thường ≈ 232 s.
- AC-6 (nửa B): Given DB của lượt, When chạy `cd pipeline && npm run test:b` tuần tự, Then xanh và dưới 1.500 s (25 phút).
- AC-7 (sản xuất sau gộp): Given bản sửa đã vào main và checkout chính đã kéo, When lượt nạp 15′ chạy bốn lần liền và lượt S06
  đầu tiên chạy, Then bốn bước transform-zalo đều mã 0, trung vị ≤ 123 s, không bước nào > 300 s; bước transform-chotot đầu tiên
  mã 0 và ≤ 400 s (mốc trước gộp 201–276 s); số phát biểu rút «thay-boi-luot» mỗi nguồn trong 2 giờ sau lúc kéo main không vượt
  3 lần cùng nguồn trong 2 giờ trước đó cộng 100 — đo sau gộp từ log và DB máy thu, chỉ đọc.
- AC-8 (phạm vi): Given nhánh so với merge-base origin/main, When liệt kê tệp đổi, Then chỉ trong vùng của hàng (câu rút, test mới,
  tệp SLT-DC, `lib/nap-045.mjs`, `test-nua.json`, hồ sơ, `_acceptance/config.yaml`, design doc, tệp máy sinh; cộng tệp của nhánh
  U1 gộp vào theo ngoại lệ của giám sát: `app/tests/tin-rao-doi-chieu.test.tsx`, hồ sơ `ca-doi-chieu-tin-rao-nap-co-khop-cum`)
  — «PHAM-VI OK».

## Coverage

Trục (đếm trên DB máy thu 20/11, chỉ đọc): nguồn gọi `writeAssertions(replaceOwn)` × cỡ mảng mỗi lượt × kế hoạch × ai đọc phía sau.

| Nguồn gọi (mã) | Cỡ mảng mỗi lượt (đo) | Vùng lật 100k–300k? | Ai đọc đầu ra phía sau |
|---|---|---|---|
| `transform-zalo.mjs` → `writeOffers` (S03, suy loại bật) | 374.276 (probe trên DB chép) | không — trên vùng | phân xử năm cột → `sale_offers` S03 → app `/vn/**`, `/ops/**`, sync cloud |
| SLT-DC-7/9 (suy loại tắt, chỉ trong test) | 213.175 | **có** — đây là ca treo | chỉ thước SLT-DC |
| `transform-chotot.mjs` (S06) | ≈ 796.732 phát biểu sống `transform-chotot@045` | không — trên vùng | phân xử → `sale_offers` S06 |
| `transform-fb.mjs` → `writeOffers` (S05) | ≈ 32 | không — dưới vùng (bậc hai trên 32 dòng không đáng kể) | phân xử → tin S05 |
| `scripts/do3-dung-thu.mjs` (đo tay) | theo lượt đo | có thể | chỉ người đo |

Câu mới đo ở 10 · 1.000 · 200.000 dưới cả hai chế độ ép (AC-3) — phủ cả dưới, trong và trên vùng lật. Ca biên ngữ nghĩa (AC-1)
liệt kê đủ các nhánh của điều kiện rút: cùng bộ khoá trùng/khác dạng/khác hẳn, bộ chỉ ở bảng, bộ chỉ ở mảng, dòng đã rút, khác
phương pháp, trùng trong mảng, mảng rỗng.

## Đường đo

Không có `opportunity.md` (hàng phát sinh từ giám sát). Điểm xong trên số thật: AC-5 (SLT-DC cả tệp < 6′), AC-6 (`pipeline_b`
< 25′), AC-7 (bước transform-zalo sản xuất bốn lượt liền sau gộp).

## Out of scope

- ANALYZE hay đổi thống kê, autovacuum của `field_assertions` trên DB máy thu (GS 11:00Z: không ai đụng tới khi bản sửa vào main).
- Đổi câu INSERT của `writeAssertions`, `retractRule`, `resolveOffers` — không nằm trên đường chậm đã đo.
- Chia lại hai nửa `pipeline_a`/`pipeline_b` theo thời lượng mới — chỉ thêm tệp test mới vào nửa A.
- Lịch thu, nhịp nạp S03 (làn thu).

## Notes

- Áp: không có bước áp DB — mã chạy từ checkout chính sau khi điều phối làn merge kéo main. AC-7 đo sau đó (`ap-may-thu.md`).
- Lùi được: phát biểu rút nhầm không cần khôi phục tay — S03 (transform-zalo toàn bộ bài) và S06 (mọi tin của lượt) ghi lại TRỌN
  phát biểu mỗi lượt; sau revert, lượt kế chèn lại dòng sống cho giá trị đã rút nhầm (chỉ mục sống không chặn vì dòng cũ đã rút).
  Đếm rút theo nguồn trước/sau gộp (AC-7) là dấu phát hiện.
