# DA5 ma-can-s06-sach — mã căn, số nhà sạch và toà từ `block` cho tin S06

Hàng DA5 (đợt `danh-ba-du-an-0811`, kế hoạch DA1 ở `docs/plan/ke-hoach-danh-ba-du-an-0811.md` dòng 147). Cổng Đáng: Mạnh 12/11
«Làm cả ba» (ô `_acceptance/ma-can-s06-sach/opportunity.md`). T2: không chạm migration.

## Vấn đề (đo 12/11 trên DB local, chỉ đọc)

- `pipeline/lib/dac-trung-s06.mjs:55` đọc `payload.unitnumber_display` trước `unitnumber`. Trong thô S06, `unitnumber_display`
  và `streetnumber_display` là **cờ hiển thị** (chỉ có giá trị `0`, `1`: 10.177 + 2.744 và 32.378 + 7.007 tin), không phải mã.
- Phát biểu còn hiệu lực (fact · source_field): `unit_number` từ cờ 12.928 dòng (`0` 10.184, `1` 2.744); `street_number` từ cờ
  28.993 dòng (`0` 26.837, `1` 2.156). Thêm từ trường thật: `unit_number` `1` 117, `0` 2; `street_number` `0` 14.
  Bộ phân xử dựng cột: `sale_offer_records` S06 có 13.046 mã căn `0`/`1`, 29.092 số nhà `0`/`1`.
- `payload.block` (3.068 tin có chữ; `A`, `B`, `1`, `C`, `A1`…) không được đọc; `block_raw` của S06 chỉ có 546 dòng legacy.
- `pty_project_type` (12.856 tin, 11 giá trị) chưa rõ nghĩa; ZCode đoán 1, 3, 4, 7 căn hộ; 2 shophouse; 10 nhà phố; 11 đất nền.

## Thiết kế

1. **Bộ đọc** `docDacTrungS06` (`pipeline/lib/dac-trung-s06.mjs`, hàm thuần):
   - không bao giờ đọc khoá `*_display`; mã căn chỉ từ `payload.unitnumber`, số nhà chỉ từ `payload.street_number`;
   - mã căn chỉ gồm chữ số 0 (`0`, `00`) hoặc đúng `1` → không thành phát biểu; số nhà chỉ gồm chữ số 0 → không thành phát biểu
     (số nhà `1` là số nhà thật, giữ);
   - mới: `payload.block` → phát biểu `block_raw` (fact · source_field, `rule_id` `payload.block`), NFC + cắt đầu cuối + gộp
     khoảng trắng; rỗng hay toàn khoảng trắng → không; giữ nguyên chữ hoa thường (là chữ thô, chuẩn hoá toà ở danh bạ).
2. **Transform** `pipeline/transform-chotot.mjs`: không đổi luồng (đọc lại MỌI tin của `stg_chotot_ads` mỗi lượt); phát biểu mới
   đi qua `writeAssertions(..., {replaceOwn:true})` như cũ. Hệ quả có tên: tin có cả cờ rác lẫn `unitnumber` thật (đo 12/11: 980
   tin) thì đêm đầu sau gộp rác bị thay bằng mã thật (`thay-boi-luot`). Tin chỉ có cờ: bộ đọc thôi phát ra nên transform không
   rút — rác còn tới lượt `--ghi` của lệnh dọn (chờ lời Mạnh, Hỏi-1).
3. **Lệnh dọn** `pipeline/scripts/ma-can-s06-sach.mjs` (mới):
   - mặc định **chạy thử**: đếm phát biểu S06 `source_field` còn hiệu lực sẽ rút, theo (trường, rule_id, giá trị), số tin sẽ
     phân xử lại, và dòng «toà: N tin có block trong thô · M tin có block_raw hiệu lực · tỉ lệ»; không ghi gì;
   - `--ghi`: trong một giao dịch, rút (`retracted_at`, `retract_reason = 'co-hien-thi-nguon'` cho rule `*_display`,
     `'gia-tri-rac'` cho `0`/`1` từ trường thật) rồi `resolve_offer_fields` cho các tin bị chạm; chạy lại → 0;
   - `--bang-pty <tệp>`: dựng bảng nghĩa `pty_project_type` từ `stg_chotot_ads` — mỗi giá trị: số tin, số tin theo `category`
     (1010 căn hộ, 1020 nhà, 1030 văn phòng/mặt bằng, 1040 đất, 1050 phòng), loại chiếm đa số và tỉ lệ, giả thuyết ZCode; không
     tự kết luận; dòng tổng và dòng «sinh bởi … lúc …»; ghi `docs/research/pty-project-type-s06.md`.
4. **Lượt ghi thật**: sau khi PR gộp, Mạnh nói thì chạy `node pipeline/scripts/ma-can-s06-sach.mjs --ghi` trên máy thu.

## Thứ tự và đo

Test `pipeline/scripts/ma-can-s06-sach.test.mjs` (mã ca `MCS-AC-n`): ca thuần cho bộ đọc; ca DB trong giao dịch ROLLBACK trên DB
của lượt (`db-thu.sh`, như `dac-trung-s06.itest.mjs`): transform trên tin mồi, lệnh dọn chạy thử/ghi, bảng pty. Đối chứng đỏ:
bản sao đột biến của `dac-trung-s06.mjs` (đọc lại cờ) và của lệnh dọn.

## Ngoài phạm vi

- Tầng S06 (PL13), nối `pty_project_type` vào loại hình hay dự án (chỉ đo nghĩa), gắn toà vào danh bạ (`buildings`).
- Rút phát biểu trên DB máy thu hay cloud trong vòng này.
- `streetnumber_display`/`unitnumber_display` ở bộ thu (làn ZCode) — vẫn lưu trong thô, chỉ thôi đọc.
