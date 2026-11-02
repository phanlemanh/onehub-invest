---
schema_version: 1
feature: SĐT người bán S06 từ stg lên tin rao, ghép theo tài khoản có đúng một số, tin ẩn số không nhận số ghép, xuất xứ tách được — migration 068
slug: sdt-s06-ghep-tai-khoan
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/ (068) — khớp t3_paths
surfaces: [cli]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-02-sdt-s06-ghep-tai-khoan-design.md
---

# Acceptance Contract: sdt-s06-ghep-tai-khoan

## Context

Stg S06 đã có số cho 521 tài khoản nhưng tin rao S06 chưa có số nào. Mạnh duyệt thu mỗi tài khoản một lần (mẫu 72/72 cặp trùng số), nên số phải
phủ các tin khác của tài khoản, và phải tách được số thu trực tiếp với số ghép. Đo chỉ đọc 02/11: bán 0 → 4.398/20.873 tin có số, thuê 0 → 7.127/27.626.

Source input: prompt từ phiên giám sát 02/11, thiết kế ở `design_doc`.

## Acceptance criteria

- AC-1: Given migration 068 áp hai lần lên lược đồ riêng, mà hàm phân xử đang chạy là bản mới nhất của kho, When một tin vừa được `ganSdtS06` ghi số rồi `resolve_offer_fields` chạy, Then không lỗi, 068 không đổi dòng tin nào,
  khoá `seller_phone` và `offer_status` còn nguyên, mọi khoá khác của `field_provenance` và các cột phát biểu giống hệt bản hàm trước 068; lượt phân xử thứ hai trả `offers_changed = 0`; tin không có khoá ấy không sinh khoá mới; mốc văn bản không còn thì 068 RAISE có tên. (cross-layer)
- AC-2: Given ma trận 88 ô (bảng dưới), mỗi ô một tin, trong đó có bốn ca có số trực tiếp, tài khoản một số, tài khoản hai số, tin ẩn số, When `ganSdtS06` chạy, Then `seller_phone`, `seller_phone_hash` và khoá `field_provenance.seller_phone` của từng tin đúng dòng luật;
  xuất xứ đúng `{fact, source_field, s06-so-tren-tin}` hoặc `{observed, e1_rule, s06-cung-tai-khoan}`; `tu_tin` của mọi số ghép là tin cùng tài khoản đang mang đúng số đó trong stg. (cross-layer)
- AC-3: Given tin đang giữ số ghép, When tin chuyển sang ẩn số, Then số ghép bị rút cùng khoá băm và khoá xuất xứ; When tài khoản có thêm số thứ hai, Then cũng rút; số trực tiếp và số không rõ gốc không bị rút trong cả hai tình huống. (cross-layer) (Hỏi-1)
- AC-4: Given `runTransformChotot` đã chạy một lượt có số, When chạy lại không đổi stg, Then `ganSdtS06` đổi 0 dòng; When stg bị xoá `seller.phone` như lượt thu thường của importer ở main, rồi transform và phân xử chạy, Then không tin nào mất số, băm hay xuất xứ. (cross-layer)
- AC-5: Given stg có số sai dạng E.164, When chạy, Then số đó không vào tin, không tính vào số đếm của tài khoản, và được đếm trong kết quả; khoá băm của mọi số bằng 32 ký tự đầu sha256 của số E.164. (cross-layer)
- AC-6: Given `runTransformChotot`, When hàm phân xử giữ được khoá, Then tin có số ngay trong lượt; When hàm chưa có phần giữ, kể cả khi bị một migration sau ghi đè, Then lượt không ghi số, in một dòng chứa `CHUA-AP-068`, không ném lỗi. (cross-layer)
- AC-7: Given tin nguồn khác cùng khoá gốc và tin S06 đã nghỉ, When chạy, Then tin nguồn khác không đổi, tin đã nghỉ vẫn được gán, số đo tách tin sống với tin nghỉ. (cross-layer)
- AC-8: Given DB local, When chạy `node pipeline/gan-sdt-s06.mjs --thu`, Then lệnh tự áp 068 trong giao dịch rồi ROLLBACK, in `da_ap_068=true`, số tin có số trước và sau riêng bán và thuê, `ghep` lớn hơn 0 và bằng một câu đếm độc lập trên stg, `tai_khoan_hai_so`, `an_so_bi_ghep = 0`, `sai_e164 = 0`, `ghep_lech_tu_tin = 0`;
  dữ liệu sau lệnh không đổi; đầu ra không chứa SĐT nào, ở cả dạng `+84` lẫn `0`; bất biến sai thì lệnh thoát 1. (cross-layer)
- AC-9: Given PR này, When soát, Then không đổi tệp đẩy dữ liệu lên cloud, `PII_EXCLUDE` vẫn loại `seller_phone`, `field_provenance` không có trong danh sách cho phép, không tệp nào dưới `app/`, `data-api/`, `collector/` và không script thu, nạp nào đổi.
  `seller_phone_hash` vốn đã trong danh sách cho phép nên khoá băm S06 rời máy sau lần ghi thật đầu tiên: đây là hành vi đã khai, thuộc Hỏi-2, không phải điều AC này chặn.

### Ma trận AC-2: 88 ô

Bốn trục: số riêng (hợp lệ · không · sai dạng) × ẩn số (không · ẩn) × tài khoản (trống mã · 0 số · 1 số · từ 2 số) × đang có ở tin (trống · trực tiếp · ghép · không rõ gốc) = 96 ô. Gạch 8 ô «số riêng hợp lệ × tài khoản 0 số» vì tự mâu thuẫn. Kết quả từng ô theo bảng luật:

| Dòng | Số riêng | Ẩn | Tài khoản | Đang có | Kết quả | Số ô |
|---|---|---|---|---|---|---|
| L1 | hợp lệ | bất kỳ | trống mã, 1, từ 2 | trống, trực tiếp, ghép | số riêng, xuất xứ trực tiếp | 18 |
| L2 | hợp lệ | bất kỳ | trống mã, 1, từ 2 | không rõ gốc | giữ nguyên | 6 |
| L3 | không, sai dạng | ẩn | bất kỳ | ghép | rút số ghép | 8 |
| L4 | không, sai dạng | ẩn | bất kỳ | trống, trực tiếp, không rõ gốc | giữ nguyên | 24 |
| L5 | không, sai dạng | không | 1 | trống, ghép | số tài khoản, xuất xứ ghép | 4 |
| L6 | không, sai dạng | không | 1 | trực tiếp, không rõ gốc | giữ nguyên | 4 |
| L7 | không, sai dạng | không | từ 2 | ghép | rút số ghép | 2 |
| L8 | không, sai dạng | không | từ 2 | trống, trực tiếp, không rõ gốc | giữ nguyên | 6 |
| L9 | không, sai dạng | không | trống mã, 0 | bất kỳ | giữ nguyên | 16 |

## Quyết định chờ Mạnh

Mạnh duyệt ngày 02/11/2026 theo lối máy khuyên ở cả ba câu.

- **Hỏi-1. Rút số ghép khi tin chuyển sang ẩn số hoặc tài khoản có thêm số thứ hai?** Máy khuyên rút, chỉ số ghép. Lối khác: giữ số ở ca hai số và chỉ đếm báo; số có thể sai người nhưng không mất; ca ẩn số vẫn phải rút theo luật «không bao giờ». Hợp đồng đang soạn theo lối khuyên. Việc này xoá giá trị, nhưng dựng lại được từ stg.
- **Hỏi-2. Thứ tự đưa vào chạy thật?** Máy khuyên: importer v5 vào main → gộp PR này → `pg_dump` → áp 068 (nếu 067 vào sau thì áp lại 068 sau 067) → lượt S06 kế ghi thật. Lần ghi thật đầu tiên kéo theo khoá băm SĐT S06 lên cloud ở lượt sync kế, số gốc vẫn ở máy. Lối khác: hoãn tới khi PR #274 vào: mọi thứ lên cùng lúc, nhưng số trên tin chậm hơn.
- **Hỏi-3. Số ghép trên Invest khi PR #274 vào main?** `field_provenance` không lên cloud, nên số ghép sẽ hiện như số thường, có thể sai người trong số ít ca. Máy khuyên: PR #274 chỉ hiện số ghép sau khi có nhãn «chưa xác minh», theo framing ra mắt; mở vòng riêng đưa xuất xứ lên cloud. Lối khác: hiện không nhãn cho kịp 05/11, dựa trên mẫu 72/72 cặp trùng số.

## Coverage

Quét bằng `morphological-scan`, chân sản phẩm từ DB local và `collector/docs/DATA-CONTRACT.md`, chân ngành không áp dụng vì đây là luật nội bộ trên dữ liệu đã thu.

- Trục số riêng của tin: có hợp lệ | không | sai dạng [thước CE: `seller.phone` đo trên 51.994 dòng stg]
- Trục ẩn số: không | ẩn [thước CE: `payload.phone_hidden` có từ lượt thu danh sách, đo 7.651 `true`, 44.343 vắng, 0 `false`; vắng là nguồn không gắn cờ, xem thiết kế]
- Trục tài khoản: trống mã | 0 số | 1 số | từ 2 số [thước CE: đo 0 dòng | 14.678 | 521 | 0 tài khoản; trống mã và từ 2 số chưa có thật, chỉ có ở fixture]
- Trục giá trị đang có ở tin: trống | trực tiếp | ghép | không rõ gốc [thước CE: S06 hiện 100% trống; ba giá trị còn lại phát sinh sau lượt đầu hoặc do tay]
- Đường chạy: lần đầu | chạy lại | sau phân xử | stg mất số [thước CE: AC-1, AC-4 chạy qua `runTransformChotot` thật]
- Core: AC-2 phủ toàn ma trận 88 ô; 8 ô gạch ghi lý do ở bảng.
- Later: thay số trực tiếp khi tài khoản đổi số thật; kiểm số còn gọi được. Never: suy số từ tên người bán, vì tên trùng nhau.

## Out of scope

- Lên cloud số gốc và xuất xứ, API, hiển thị trên Invest hay Ops, nhãn «chưa xác minh».
- Chạy `dung-nguoi` để số S06 thành bí danh danh bạ và hiện ở `sellers`.
- Ghép số cho S03, S05, S01.
- Gọi nguồn S06, chạy bộ thu, sửa importer (làn ZCode).
- Ghi thật lên DB máy thu và áp 068 trước khi Mạnh ký. Số «sau» trong vòng này đo bằng ROLLBACK, kèm `pg_dump` trước khi áp thật (Hỏi-2).

## Notes

- Phụ thuộc: importer v5 ở nhánh `zcode/hop-dong-nguoi-ban` chưa vào main. Importer ở main ghi đè `seller`; lịch S06 chạy 05:30 và 14:00 nên lượt thu thường kế sẽ xoá số ở stg của tin được thấy lại.
  Tin đã ghi không mất số (AC-4), nhưng số chưa kịp lên tin sẽ mất tới khi ZCode bù từ snapshot.
- Bốn số Context đo bằng câu chỉ đọc 02/11; lượt S06 kế có thể đổi chúng, AC-8 đo lại lúc chấm và đối chiếu câu đếm độc lập.
- Đường nền hạ tầng chưa chạy: hook đợt `dieu-phoi` chặn `duong-nen.mjs`, và lệnh xin từ chối vì worktree này không thuộc dãy nào. S4 vẫn chạy suite.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-03:
  - Ngoài-2: Lệnh đo `--thu` chạy trên DB dùng chung, không có DB thử riêng và không giữ khoá 33033, nên trùng giờ thu thì job thu hoặc nạp có thể chờ trong chốc lát; dữ liệu không đổi vì lượt đo hoàn tác.
  - Ngoài-3: Phép kiểm ranh giới chưa phủ hết phạm vi AC-9 và làn ZCode, nên có thể xanh nếu về sau có người sửa nhầm script thu hoặc tệp đẩy cloud.
  - Ngoài-7: Phép đo số ghép trỏ sai tin chỉ có kiểm bằng 0, chưa chứng minh nó bắt được lỗi thật.
  - Ngoài-8: Ca tài khoản khoảng trắng và cờ ẩn số dạng chuỗi chỉ kiểm kết quả rỗng, chưa có đối chứng dương.
  - Ngoài-9: Lệnh chấm ranh giới chỉ chạy đường xanh, chiều đỏ không nằm trong lệnh.
  - Ngoài-10: Mẫu ranh giới bỏ lọt tệp đẩy cloud và script thu, nạp mà AC-9 hứa không đổi; hôm nay chưa có tệp nào như vậy bị sửa.
  - Ngoài-11: Ô «giữ nguyên» chỉ kiểm mã luật, nên xuất xứ của tin giữ số bị đổi nhẹ vẫn có thể xanh.
  - Ngoài-12: Dòng stg và bước «importer xoá số» của AC-4 là dữ liệu dựng tay, chưa đi qua bộ nạp thật, nên chưa phủ ca thu lại đổi mã tài khoản hay cờ ẩn số.
  - Ngoài-13: Chiều đỏ của lệnh đo chỉ đưa giá trị tay vào hàm kiểm bất biến, chưa chứng minh lệnh thật thoát 1 khi dữ liệu bị đổi.
  - Ngoài-14: Bản hàm phân xử dưới test đọc từ DB dùng chung, nên có migration mới chưa áp thì kết quả xanh có thể không phản ánh mã đang kiểm.
