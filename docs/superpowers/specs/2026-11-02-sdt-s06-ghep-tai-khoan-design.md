# SĐT người bán S06 lên tin rao, ghép theo tài khoản — thiết kế (02/11/2026)

Hồ sơ: `_acceptance/sdt-s06-ghep-tai-khoan/`. Hạng T3 vì chạm `db/migrations/`.

## Vì sao

Bộ thu đã lấy số cho một phần tài khoản S06 và nạp vào `stg_chotot_ads.seller`, nhưng `sale_offer_records.seller_phone` của S06
vẫn trống 100%. Mạnh đã duyệt thu mỗi tài khoản một lần dựa trên mẫu 72/72 cặp tin cùng tài khoản trùng số, nên một số phải phủ được các
tin khác của tài khoản đó. Ra mắt 05/11 chất lượng chỉ đo không chặn, nên phải tách được số thu trực tiếp với số ghép.

Đo chỉ đọc 02/11 trên DB local:

| | Tin | Ẩn số | Có số trực tiếp | Sẽ ghép | Còn trống (không ẩn) |
|---|---|---|---|---|---|
| Bán | 20.873 | 2.645 | 217 | 4.181 | 13.830 |
| Thuê | 27.626 | 1.511 | 384 | 6.743 | 18.988 |
| Tổng | 48.499 | 4.156 | 601 | 10.924 | 32.818 |

521 tài khoản có đúng một số, 0 tài khoản có từ hai số, 0 số sai E.164. Tin thuê S06 nằm cùng bảng (`kind = 'rent_lt'`), nên không có bảng
canonical thứ hai. Các bảng khác có `seller_phone` chỉ là view `sale_offers`.

## Luật

Một tin nhận số khi chính nó có số, hoặc tài khoản của nó có đúng một số trong stg. Tin ẩn số không bao giờ nhận số ghép.

Bảng luật, đầy đủ cho mọi ô (hợp đồng AC-2 đo từng ô):

| Dòng | Số riêng của tin | Ẩn số | Tài khoản trong stg | Đang có ở tin | Kết quả |
|---|---|---|---|---|---|
| L1 | hợp lệ | bất kỳ | bất kỳ | trống, trực tiếp, ghép | ghi số riêng, xuất xứ trực tiếp |
| L2 | hợp lệ | bất kỳ | bất kỳ | không rõ gốc | giữ nguyên |
| L3 | không hoặc sai dạng | ẩn | bất kỳ | ghép | rút số ghép (Hỏi-1) |
| L4 | không hoặc sai dạng | ẩn | bất kỳ | trống, trực tiếp, không rõ gốc | giữ nguyên |
| L5 | không hoặc sai dạng | không | đúng 1 số | trống, ghép | ghi số của tài khoản, xuất xứ ghép |
| L6 | không hoặc sai dạng | không | đúng 1 số | trực tiếp, không rõ gốc | giữ nguyên |
| L7 | không hoặc sai dạng | không | từ 2 số | ghép | rút số ghép (Hỏi-1) |
| L8 | không hoặc sai dạng | không | từ 2 số | trống, trực tiếp, không rõ gốc | giữ nguyên |
| L9 | không hoặc sai dạng | không | 0 số hoặc trống mã | bất kỳ | giữ nguyên |

«Tài khoản» là `payload->>'account_id'`; mã trống không bao giờ gom thành một nhóm. «Không rõ gốc» là tin có số mà không có khoá xuất xứ, vd sửa tay.

Cờ ẩn số: `payload.phone_hidden` đến từ lượt thu danh sách, trước khi gọi số; bộ thu số loại tin mang cờ ngay trong câu chọn (`thu-so-s06.mjs`). Đo 02/11: 7.651 tin
`true` kiểu boolean, 44.343 tin không có khoá, không có giá trị `false`. Vì vậy vắng khoá nghĩa là nguồn không gắn cờ, không phải chưa biết. 672 tài khoản có tin ẩn, 7 tài khoản có cả tin ẩn lẫn tin không ẩn,
0 tài khoản có số đang có tin ẩn, nên ca ẩn số hiện chỉ có ở fixture và ở các lượt thu sau. Mã tài khoản trống: 0 dòng.

Hệ quả cần giữ: số trực tiếp không bao giờ bị rút; tài khoản về 0 số trong stg không xoá gì, vì importer hiện ở main ghi đè `seller` ở lượt
thu thường và làm mất số ở stg.

## Cách làm

- `pipeline/gan-sdt-s06.mjs` (mới): `ganSdtS06(client)` chạy một câu SQL gom theo tập trên `sale_offer_records` nối `stg_chotot_ads` qua
  `originating_system_key = list_id::text`, nguồn `S06`. Khoá băm cùng công thức 060 và bộ bóc: 32 ký tự đầu sha256 của số E.164. Trả số đếm,
  không trả số. Gọi cuối `runTransformChotot`, sau phân xử. Có đường chạy tay và `--thu` (BEGIN…ROLLBACK, in trước/sau theo bán và thuê).
- `db/migrations/068_giu_nguon_goc_sdt.sql`: `resolve_offer_fields` dựng lại `field_provenance` và hiện chỉ giữ `offer_status`, nên mọi lượt phân
  xử sẽ xoá dấu xuất xứ SĐT. Nhánh SV2 của dãy N1 (067, chưa vào main) cũng định nghĩa lại hàm này, nên 068 KHÔNG chép thân hàm: khối DO đọc định nghĩa đang chạy, chèn phần giữ `seller_phone` ngay
  cạnh hai mốc của `offer_status`, EXECUTE; không thấy mốc thì RAISE có tên; đã có thì bỏ qua. Áp 067 sau 068 thì phải áp lại 068 (bộ gán thấy mất phần giữ sẽ tự dừng, AC-6).
- Chưa áp 068 thì `ganSdtS06` bỏ qua, in một dòng có tên, không ghi và không làm đỏ job; ghi trước khi có 068 sẽ mất xuất xứ ở lượt phân xử kế.

Xuất xứ, khoá `field_provenance.seller_phone`:

| Loại | `tier` | `method` | `rule_id` | Thêm |
|---|---|---|---|---|
| Thu trực tiếp | `fact` | `source_field` | `s06-so-tren-tin` | `measured: false` |
| Ghép | `observed` | `e1_rule` | `s06-cung-tai-khoan` | `tu_tin`: `list_id` nhỏ nhất mang số, `measured: false` |

Không có `v`: `field_provenance` chỉ ở máy local nhưng không cần chép số lần hai. Các trục dùng mã có sẵn, không thêm từ vựng. `docCanCu` ở thẻ duyệt
đọc được khoá mới mà không đổi hiển thị, vì thẻ chỉ tra theo năm trường.

Trả lời ADR-0013: (1) lớp tin, ngữ nghĩa Member, không thuộc căn. (2) `seller_phone` đã có trong `mappings.yaml`, `dd: Member`, không field mới. (3) khoá
`OriginatingSystemKey`. (4) ghi thẳng cột, như S03 và S05: `field_assertions_resource_chk` chỉ nhận `Property` nên SĐT không đi đường phát biểu. (5) truy về tin nguồn qua `tu_tin`.
(6) không ghi `HistoryTransactional`: trigger 059 chỉ theo giá và trạng thái. (7) không đổi bậc căn; thước đổi là độ phủ SĐT theo bán và thuê. (8) chỉ mã S0x, số đo không mang SĐT.

## Hạ nguồn đã soát

- `sync-cloud`: `seller_phone` trong `PII_EXCLUDE`, `field_provenance` không có trong danh sách cho phép; `seller_phone_hash` CÓ trong danh sách, nên
  khoá băm S06 sẽ lên cloud ở lượt sync sau khi ghi thật (Hỏi-2).
- `sellers` là view trên bí danh `sdt`: số S06 chỉ hiện ở đó sau khi `dung-nguoi` chạy, và `dung-nguoi` đã đọc cả S06. Lệnh này chưa có trong lịch.
- `do-danh-ba-sdt` chỉ đo S03, S05: không đỏ vì S06.
- PR #274 mở SĐT lên Invest: khi vào main, số ghép sẽ hiện như số thường vì `field_provenance` không lên cloud. Nhãn «chưa xác minh» là việc của vòng đó.

**Đính chính 03/11** (hồ sơ `_acceptance/so-ghep-s06-nhan-danh-ba`, thiết kế `2026-11-03-so-ghep-s06-nhan-danh-ba-design.md`). Mục này và OOS-2 của hợp
đồng sai ba chỗ, đo lại trên mã: (1) `dungNguoi` đã chạy trong job qua `buocDem` của `refresh-bait-gap.mjs`, không phải «chưa có trong lịch», nên lượt S06 ghi thật
sẽ đưa mọi số S06, kể cả số ghép, vào danh bạ và `sellers` ngay. Nay danh bạ chỉ nhận số có dấu `s06-so-tren-tin`. (2) `seller_phone` không còn trong `PII_EXCLUDE`:
tên và số người bán lên cloud theo quyết định 02/11, nên số ghép lên cloud cùng cột. (3) Nhãn không phải việc của PR #274: nó nằm ở cột tính `seller_phone_inferred`
của view (070), là thứ duy nhất của xuất xứ lên cloud; `field_provenance` vẫn ở lại máy.

## Không làm

Lên cloud số gốc, hiển thị, nhãn chưa xác minh, chạy `dung-nguoi`, gọi nguồn S06, chạy bộ thu, sửa importer (làn ZCode).

## Trình tự thi công

1. Test `pipeline/scripts/gan-sdt-s06.test.mjs` trên lược đồ riêng, đỏ trước: ma trận AC-2, rồi AC-1, AC-3 đến AC-7.
2. `db/migrations/068_giu_nguon_goc_sdt.sql`, `pipeline/lib/nap-068.mjs`.
3. `pipeline/gan-sdt-s06.mjs`, nối `transform-chotot`, thuật ngữ trong `CONTEXT.md`.
4. `--thu` trên DB local cho AC-8, kiểm ranh giới AC-9, cập nhật ROADMAP §2 và §4.
