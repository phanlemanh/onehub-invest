---
schema_version: 1
feature: Tin S06 mất khoá xuất xứ SĐT được dựng lại từ stg sau khi áp lại 068, để tin ẩn số không còn giữ số ghép khi số còn ở stg
slug: sdt-s06-khoi-phuc-xuat-xu
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/, không khớp t3_paths; không migration
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-03
design_doc: docs/superpowers/specs/2026-11-03-sdt-s06-khoi-phuc-xuat-xu-design.md
---

# Acceptance Contract: sdt-s06-khoi-phuc-xuat-xu

## Context

Mục Ngoài-5 của `_acceptance/sdt-s06-ghep-tai-khoan`. Một migration sau ghi đè `resolve_offer_fields` thì lượt phân xử xoá khoá `field_provenance.seller_phone`; áp lại 068 không đem khoá về; số trên tin thành «không rõ gốc»
và không bao giờ bị rút, nên tin ẩn số giữ số ghép mà bất biến vẫn báo 0. Chưa có dữ liệu nào mất: DB local có 0 tin S06 mang số. Thiết kế và so sánh hai hướng ở `design_doc`.

Source input: prompt từ phiên giám sát 03/11, quyết định Ngoài-5 ở `_acceptance/sdt-s06-ghep-tai-khoan/decisions.jsonl`.

## Quyết định chờ Mạnh

- **Hỏi-1. Khôi phục từ stg, hay kiểm trước trong transform?** Máy khuyên khôi phục từ stg: phủ mọi đường làm mất khoá (ba lệnh `resolve_offer_fields(NULL)`, hai hàm enrich, transform), cứu được khoá đã mất, job không đổi. Giá là bốn giới hạn ở mục dưới; nặng nhất là G1: số đã trôi khỏi stg thì tin ẩn số vẫn giữ.
  Lối khác: kiểm trước trong transform, job S06 đỏ có tên khi hàm mất phần giữ. Không dính G1, G2, G3 trên đường transform, nhưng các đường còn lại vẫn xoá im lặng, không cứu được khoá đã mất, và phải sửa AC-6 đã ký. Hợp đồng đang soạn theo lối khuyên; chọn lối kia thì máy soạn lại hợp đồng và evals rồi trình lại.
- **Hỏi-2. Cột xuất xứ riêng: làm ngay hay để sau?** Máy khuyên để sau, xem lại khi có migration đầu tiên chép cả hàm, hoặc khi `khong_ro` khác 0. Lối khác: làm ngay. Hàm phân xử không chạm được cột nên hết cả bốn giới hạn, và đây là lúc rẻ nhất vì chưa tin nào có số; giá là migration T3 chạm view mà #294 đang sửa, đổi mọi bên đọc khoá, chậm hơn trước mốc 05/11.

## Giới hạn đã biết nếu chọn khôi phục từ stg

- G1. Số đã trôi khỏi stg trong lúc hàm bị ghi đè (tin nguồn đổi số hoặc rời tài khoản): tin ở `khong_ro`, được đếm, nhưng tin ẩn số **vẫn giữ số ghép**. AC-10 đo đúng ca này và gọi tên nó, không coi là đạt luật.
- G2. Số trực tiếp mất khoá, stg mất số riêng nhưng số đó còn ở tin khác cùng tài khoản: bị dựng thành số ghép, về sau ẩn số thì bị rút dù gốc là trực tiếp.
- G3. Số không rõ gốc thật mà trùng số tài khoản bị xếp là số ghép, nên câu «số không rõ gốc không bị rút» của AC-3 hồ sơ gốc hẹp lại. Hôm nay không có tin nào: ngoài bộ gán không ai ghi số cho tin S06.
- G4. Trong lúc hàm còn bị ghi đè, tin ẩn số vẫn giữ số tới khi áp lại 068. Tín hiệu duy nhất là dòng `CHUA-AP-068` mỗi lượt.

## Acceptance criteria

- AC-1: Given tin S06 có số ghép do `ganSdtS06` ghi trên lược đồ tạm, When chạy đúng thứ tự 068 → phần `resolve_offer_fields` trích từ tệp migration 061 đã commit, đóng vai migration chép cả hàm → `runTransformChotot` → áp lại 068 từ tệp migration thật → tin chuyển sang ẩn số → `runTransformChotot`, Then `seller_phone` và `seller_phone_hash` của tin đó về NULL, không còn khoá; đọc thẳng cột, không qua khoá. Trước bước áp lại, khoá đã mất thật. (cross-layer)
- AC-2: Given cùng chuỗi nhưng tin chuyển sang ẩn số ngay trong lúc hàm bị ghi đè, When áp lại 068 rồi transform, Then tin cũng về NULL; tin ghép không ẩn và tin có số trực tiếp vẫn giữ số. (cross-layer)
- AC-3: Given stg không đổi trong suốt chuỗi, When khôi phục xong, Then xuất xứ của tin ghép và tin trực tiếp giống hệt trước khi mất, kể cả `tu_tin`; số và băm không đổi; lượt kế `doi = 0`, `khoi_phuc = 0`. (cross-layer)
- AC-4: Given ma trận 26 ô của tin không còn khoá (bảng dưới), mỗi ô một tin, When `ganSdtS06` chạy, Then số, băm, khoá từng tin đúng dòng K1–K7; ô K4 có `tu_tin` là tin cùng tài khoản đang mang đúng số đó, kiểm bằng truy vấn trên stg; cả 26 ô cộng lại `khoi_phuc = 12`, `khong_ro = 14`. (cross-layer)
- AC-5: Given tin có khoá mà `rule_id` lạ, và tin không khoá mà số không khớp stg, When tin chuyển ẩn số, rồi When tài khoản có thêm số thứ hai, Then ở cả hai bước số giữ nguyên, không sinh khoá, không bị rút; cả hai tin nằm trong `khong_ro`. (cross-layer)
- AC-6: Given khoá bị xoá bằng `resolve_offer_fields(NULL)`, không qua transform, When `ganSdtS06` chạy khi hàm có phần giữ, Then kết quả đúng như AC-1. (cross-layer)
- AC-7: Given hàm vẫn mất phần giữ, When `runTransformChotot` chạy, Then không tin nào đổi số hay được dựng lại khoá, in `CHUA-AP-068`, không ném lỗi, `khoi_phuc = 0`, `khong_ro = 0`: AC-6 của hồ sơ gốc không đổi. (cross-layer)
- AC-8: Given fixture có đúng một tin khôi phục và một tin không rõ gốc, When `runTransformChotot` chạy và When dựng dòng in của `--thu` từ kết quả bộ gán, Then cả hai dòng mang `khoi_phuc=1`, `khong_ro=1`, không chứa SĐT nào; số dạng `+84` hay dạng `0` lọt vào dòng thì ném `RO-SO`. Given DB local, When chạy `--thu`, Then thoát 0, in đủ hai số đếm và `md5_khop=true`; DB local chưa có tin nào mang số nên hai số đếm ở lệnh này đo sự có mặt, không đo giá trị. (cross-layer)
- AC-9: Given PR này, When soát, Then không tệp nào dưới `db/migrations/`, `app/`, `data-api/`, `collector/`, không tệp đẩy cloud, không script thu, nạp đổi; toàn bộ ca của `pipeline/scripts/gan-sdt-s06.test.mjs` có từ trước vẫn xanh, gồm ma trận 88 ô, không sửa ca nào.

- AC-10: Given tin A mang số ghép lấy từ tin B, khoá đã mất vì hàm bị ghi đè, và B đổi sang số khác trong lúc đó, When áp lại 068 và A chuyển ẩn số, Then A vẫn giữ số cũ, không khoá, `khong_ro = 1`, tên ca ghi rõ đây là giới hạn G1, trái luật ẩn số và được chấp nhận. Cùng fixture nhưng B không đổi số thì A bị rút. (cross-layer)

### Ma trận AC-4: 26 ô

Bốn trục: số riêng (hợp lệ · không) × ẩn số (không · ẩn) × tài khoản (trống mã · 0 số · 1 số · từ 2 số) × số trên tin mất khoá (bằng số riêng · bằng một số của tài khoản, khác số riêng · không khớp stg) = 48 ô. Gạch 22 ô tự mâu thuẫn: số riêng hợp lệ × tài khoản 0 số (6); không có số riêng × «bằng số riêng» (8); tài khoản trống mã hoặc 0 số × «bằng một số của tài khoản» (6, còn lại sau khi đã gạch); số riêng hợp lệ × tài khoản 1 số × «bằng một số tài khoản, khác số riêng» (2), vì số duy nhất của tài khoản chính là số riêng.

| Dòng | Số riêng | Ẩn | Tài khoản | Số trên tin | Kết quả | Số ô |
|---|---|---|---|---|---|---|
| K1 | hợp lệ | bất kỳ | trống mã, 1, từ 2 | bằng số riêng | giữ số, dựng xuất xứ trực tiếp | 6 |
| K2 | hợp lệ | bất kỳ | từ 2 | bằng số khác của tài khoản | đổi sang số riêng, xuất xứ trực tiếp | 2 |
| K3 | hợp lệ | bất kỳ | trống mã, 1, từ 2 | không khớp | giữ, không khoá | 6 |
| K4 | không | không | 1 | bằng số tài khoản | giữ số, dựng xuất xứ ghép | 1 |
| K5 | không | ẩn | 1 | bằng số tài khoản | rút | 1 |
| K6 | không | bất kỳ | từ 2 | bằng một số tài khoản | rút | 2 |
| K7 | không | bất kỳ | trống mã, 0, 1, từ 2 | không khớp | giữ, không khoá | 8 |

## Coverage

- Trục đối tượng: số trên tin so với stg × số riêng × ẩn số × số số của tài khoản [thước CE: các nhánh CASE của `SQL_GAN` và bảng L1–L9 của hồ sơ gốc, `pipeline/gan-sdt-s06.mjs`]
- Trục đường mất khoá: transform · `resolve_offer_fields(NULL)` · hai hàm enrich [thước CE: `grep resolve_offer_fields` trên `pipeline/`, `db/migrations/066_can_theo_tin.sql`]. Core đo hai đường đầu; hai hàm enrich gọi cùng hàm SQL nên không đo riêng.
- Trục trạng thái hàm: có phần giữ · bị ghi đè · áp lại [thước CE: AC-6 hồ sơ gốc]
- Trục thời điểm chuyển ẩn số: trong lúc bị ghi đè · sau khi áp lại [thước CE: AC-1, AC-2]
- Trục stg trong lúc bị ghi đè: không đổi · tin nguồn đổi số [thước CE: phản biện context sạch, AC-3, AC-10]
- Chân ngành: logic nội bộ của kho, không có chuẩn ngoài đúng loại [GIẢ ĐỊNH: chưa có chuẩn ngành đúng loại]; thước là bảng luật đã ký.
- [GIẢ ĐỊNH] Không có bên nào ngoài bộ gán ghi số cho tin S06 từ nay về sau. Có bên như vậy thì số trùng số tài khoản bị xếp ghép (giới hạn 3 của thiết kế).
- Later: kiểm phần giữ trong transform (lối khác của Hỏi-1), rút số ngay trong lúc hàm bị ghi đè, cột xuất xứ riêng (Hỏi-2). Never: tự áp 068 từ transform, vì áp thật là bước Mạnh duyệt.

## Out of scope

- Áp 068 hoặc ghi thật lên DB máy thu; mọi kiểm đều trong ROLLBACK.
- Sửa migration đã commit, thêm migration, thêm cột.
- Rút số trong lúc hàm còn bị ghi đè; đổi job S06 sang đỏ khi hàm mất phần giữ.
- Mục Ngoài-1, Ngoài-4 (số S06 vào danh bạ, thuộc #294), Ngoài-6.
- Cảnh báo tự động lên Ops khi `khong_ro` khác 0: chỉ có số đếm trong log và `--thu`.

## Notes

- Đường nền hạ tầng chưa chạy: hook đợt `dieu-phoi` chặn `duong-nen.mjs`, và lệnh xin từ chối vì worktree này không thuộc dãy nào. Suite chạy ở S4.
- #294 cũng sửa `pipeline/gan-sdt-s06.mjs` và tệp test, khác dòng; gộp sau phải chạy lại `gs_test`.
- #294 không phá luật ẩn số: dòng nó thêm nằm sau hai nhánh ẩn số trong CTE `quyet`, nên tin ẩn số được dựng lớp ghép vẫn bị rút khi view chưa có 070; chỉ tin không ẩn mới giữ số chờ 070.
- Hồ sơ `sdt-s06-ghep-tai-khoan` đã ký có eval trỏ `pipeline/gan-sdt-s06.mjs`, nên PR này có thể phải ghim lại hồ sơ đó.
