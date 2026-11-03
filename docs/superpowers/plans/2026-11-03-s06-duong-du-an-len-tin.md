# Đường của tin S06 đi tới tin và căn — kế hoạch thi công (hàng DS1)

**Mục tiêu:** tin và căn S06 có đường, đo được trên bản chép dữ liệu thật. **Thiết kế:** `docs/superpowers/specs/2026-11-02-s06-duong-du-an-len-tin-design.md`.
**Hợp đồng:** `_acceptance/s06-duong-du-an-len-tin/contract.md` (AC-1..7), Mạnh duyệt 03/11: Hỏi-1 tách, Hỏi-2 Stage A.

Làm tuần tự trong một phiên: các bước dùng chung bộ đọc và phát biểu, không tách được.

## Ràng buộc

- Không migration, không sửa `sync-cloud.mjs`, không đổi `khoaDuong`, `judge-entity`, giao diện thẻ.
- `thu-lai-deadlock.test.mjs` ghim chữ SQL của `resolve-properties.mjs`: câu SQL mới nằm ở tệp riêng, gọi qua client đã bọc.
- `replaceOwn` không rút khi lượt không có giá trị mới: nguồn bỏ trống cần bước rút riêng.
- Đo trên DB thử (`db/db-thu.sh`), không ghi lên DB dùng chung.

## Việc

1. **Bộ đọc (AC-1).** `docDuong` và phát biểu `street_raw` trong `pipeline/lib/dac-trung-s06.mjs`; 27 hàng ở `pipeline/scripts/dac-trung-s06.test.mjs`, hai ca đỏ (hàng 17, hàng 9). Lệnh: `node --test pipeline/scripts/dac-trung-s06.test.mjs`.
2. **Tin (AC-2..4).** `retractRule` ở `pipeline/lib/assert.mjs`; `transform-chotot.mjs` rút phát biểu của tin không còn đường trước khi phân xử. Ca DB ở `pipeline/scripts/s06-duong.itest.mjs`. Lệnh: executor `ds1_db`.
3. **Căn (AC-5).** `pipeline/lib/duong-can.mjs` (`dienDuongCan`, `hoanTacDuong`); gọi cuối Stage A; cờ `--hoan-tac-duong` ở `main`. Ca DB cùng tệp.
4. **So đường (AC-6).** `agent/tests/judge-duong-s06.test.ts`: bảy cặp ở hai bản. Lệnh: executor `ds1_judge`.
5. **Thước (AC-7).** `pipeline/scripts/do-duong-s06.mjs` chạy thật trên bản chép, tự chứng ba chiều đỏ, chạy lệnh hoàn tác ở bước cuối. Lệnh: executor `ds1_do`.
6. **Chốt.** `/verify` module `pipeline` và `agent`, ghi ROADMAP as-built, S4.

## Điểm dễ sai

- Tin rời kho không được cấp đường cho căn: đọc qua view `sale_offers`.
- Hai tin cùng `last_seen`: `offer_id` nhỏ nhất, kết quả phải xác định.
- Hoàn tác xong chạy lại không được đụng ô người đã sửa: chỉ trả ô còn đúng giá trị đã ghi.
- «Tỉnh lộ 10, Bình Chánh» có phẩy vẫn là đường; «Xã Đàn, Đống Đa» bị bỏ là giới hạn đã khai.
