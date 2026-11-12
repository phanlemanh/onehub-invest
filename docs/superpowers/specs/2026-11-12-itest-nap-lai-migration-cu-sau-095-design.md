# Itest nạp lại migration cũ trên DB đã có 095 — xanh lại, bền với migration mới

Hàng `itest-nap-lai-migration-cu-sau-095`, dãy P2, giám sát đợt mở ngày 12/11. Cùng lớp lỗi với DBV-AC-1 của
`dbv-itest-xanh-lai-tren-main` (#431).

## Bối cảnh

Quét 21 itest có nạp tệp migration trên main 3bfafd37, mỗi tệp trên DB của riêng lượt. 10 tệp đỏ:

- **6 tệp đúng lớp:** `s06-duong` (10/10), `sdt-trong-duong` (13/14), `phat-bieu-db` (2), `trang-thai-chao` (2),
  `nap-lai-db` (1), `danh-ba-vat-the-that` (2).
- **`dac-trung-s06`** đỏ 8/8 (N1 đo); để N1 trong DA5. Hàng này nhận phần còn lại sau khi DA5 gộp.
- **4 tệp đỏ vì lý do khác:** liệt kê ở `_acceptance/<slug>/anh-em.md`.

Các migration 059, 061, 082 và 095 đều `DROP` rồi `ADD` ràng buộc `field_assertions_field_chk`, mỗi bản với danh sách trường
của thời mình. Bộ kiểm nạp lại migration cũ (qua `pipeline/lib/nap-061.mjs`, `nap-045.mjs`, `nap-view-song.mjs`) lên DB đã
có trường mới, nên xảy ra một trong ba điều:

- **Ràng buộc vỡ:** «violated by some row» khi DB đã có phát biểu `floor_raw`, `builder_name`…
- **Ràng buộc bị thu hẹp lặng lẽ.**
- **Phép đo «áp X lần hai» hoặc «trục sau X» thấy dấu vết của migration sau X**, ví dụ phụ thuộc `sellers`, bốn trường
  của 082/095, trigger `registry_inherit` của 082.

Mỗi migration mới đụng ràng buộc lại phải thêm một bản vá riêng (`sqlNapLai059`, `napLai095`), và 096 của DA2 sẽ lặp lại
vòng này.

**Không phải lỗi sản phẩm.** Các hàm nạp lại chỉ chạy trên DB thật trong `--thu`, và ở đó bọc trong một giao dịch
ROLLBACK:

- `phat-bieu-cat-chuyen.mjs --thu`
- `scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu`
- `pipeline/scripts/dung-lai-canonical.mjs`

Không job đêm, finalize hay sync nào gọi chúng. Ràng buộc trên DB máy thu (đo chỉ đọc 12/11) đủ 17 trường theo 095.

## Thiết kế — hai nguyên tắc

**(A) Phép đo VỀ migration X chạy trên DB dừng ở X.**
- Áp dụng cho các ca «áp X hai lần», «trục/CHECK sau X», «phụ thuộc đúng tập sau X».
- Ca dựng DB thử bằng `taoDbThu(ten, { hetSo: X })` (khung DB thử từ `db/migrations`, như DBV-AC-1 của #431) thay cho bản
  chép DB đủ migration.
- Kỳ vọng giữ nguyên: chúng là sự thật về X, không về DB hôm nay.
- Bền với migration mới vì DB dừng ở X không thấy migration sau.

**(B) Bộ nạp lại dùng để dựng tính năng trên DB đủ migration không bao giờ thu hẹp ràng buộc trường.**
- Trong `sqlNapLai` (đường chung của mọi lần nạp lại), mọi câu `ADD CONSTRAINT field_assertions_field_chk CHECK (field IN
  (…))` thay bằng HỢP của tập sống và tập của tệp đang nạp (không bỏ trường nào của cả hai phía) khi tập sống KHÔNG nằm trong tập của tệp.
- Tập sống nằm trọn trong tập của tệp thì giữ nguyên từng byte, để KD-AC-3 của `kiem-do-sau-070.test.mjs` vẫn đúng.
- Bắt theo khuôn, không chép giá trị trục, như `sqlNapLai059`.
- Bền với 096: 096 thêm trường vào ràng buộc sống, bộ nạp lại tự giữ, không cần bản vá mới.
- `sqlNapLai059` thu về đường chung này.

**Ngoài lớp nhưng trong ranh giới hàng:** `danh-ba-vat-the-that` chép `areas` mang theo `parent_id`, `admin_code` và các
thị trường cha (luật ISO một tỉnh, #406).

## Không nới phép đo

- Probe tĩnh so mọi lời gọi `assert.*(…)` của các tệp kiểm bị đổi với merge-base.
- Diff chỉ chạm các tệp kiểm trong vùng, `pipeline/lib/nap-*.mjs` (hàm phục vụ bộ kiểm) và hồ sơ.
- Không chạm migration hay mã sản phẩm (`pipeline/*.mjs` ở gốc, `app/`, `agent/`).

## Đối chứng đỏ

- Bản `sqlNapLai` không có (B) dựng lại đúng lỗi «violated by some row» khi nạp lại 061 trên DB có trường mới.
- Một trường giả thêm vào ràng buộc sống (mô phỏng 096) mất đi nếu thiếu (B), còn nguyên khi có (B).
- Bản merge-base của từng tệp kiểm đỏ như trên main.

## Bền với 096 — đo thật, không chỉ mô phỏng

Lượt chấm cuối chạy trên cây đã nhận main có 096 (DA2) và DA5: probe tĩnh đòi `db/migrations/096_*.sql` có mặt và
`dac-trung-s06.itest.mjs` (sau DA5) vào phạm vi. Trước khi hai hàng ấy gộp, hàng dừng sau S3 chờ.

## Thứ tự gộp

GS giữ thứ tự gộp: hàng này vào main SAU DA5 và DA2. `pipeline/lib/nap-061.mjs` nằm trong vùng của hồ sơ khác, nên gộp
trước sẽ buộc chúng ghim lại.

## Ngoài phạm vi

- Bốn tệp đỏ vì lý do khác (`anh-em.md`).
- Migration đã commit, mã sản phẩm.
