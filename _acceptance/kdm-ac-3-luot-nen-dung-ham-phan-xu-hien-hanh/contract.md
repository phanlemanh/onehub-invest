---
schema_version: 1
feature: Lượt nền KDM-AC-3 chạy với bộ phân xử resolve_offer_fields đang có trong DB — napPhatBieu áp lại phần chèn 068 và 099 sau khi nạp lại 045
slug: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-22T12:15:01Z
design_doc: _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/design.md
approved_by:
approved_at:
---

# Acceptance Contract: kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh

## Context

Hàng HT5 (GS cắt 22/11). `KDM-AC-3` đỏ trên main f962afade với DB thử chép dữ liệu máy: lượt nền gỡ 7.951 tin có phường hợp lệ.
Gốc đo được: `napPhatBieu` nạp lại thân `resolve_offer_fields` của 045 mà không áp lại phần chèn 068 (giữ khoá `seller_phone`) và
099 (phường suy từ dự án, DA45), nên lượt `--thu` chạy ba transform với bộ phân xử cũ hơn DB. Phép thử trên bản chép: áp lại 068 +
099 sau `napPhatBieu` → 0 tin đổi. Chi tiết: design.md. Hàng nền (test, thước) — miễn điều kiện «số trên màn đổi».

## Acceptance Criteria

- **AC-1** Given mọi tệp `db/migrations/*.sql` có chữ `resolve_offer_fields` (quét rộng, không phân biệt hoa thường), When so
  với bảng viết trước (045, 059, 061 định nghĩa · 068, 069, 095, 099 chèn · 063, 066 gọi · 096, 102 nhắc), Then tập tệp bằng
  đúng bảng (tệp mới phải được xếp loại tay), bộ phân loại xếp đúng từng tệp, và `CHUOI_PHAN_XU` của `pipeline/lib/nap-045.mjs`
  bằng tập định nghĩa + chèn; chiều đỏ: chuỗi bỏ 099 → thiếu `["099"]`; hai migration giả (định nghĩa có tiền tố `public.`, chèn
  bằng `::regprocedure`) → thiếu `["998","999"]`.
- **AC-2** Given bản chép DB thử (`db/db-thu.sh --chay`), When `kiem-tin-rao-gan-khu-vuc.mjs --phan-xu` (giao dịch rồi ROLLBACK),
  Then md5 của `resolve_offer_fields(text[])` và `resolve_offer_area_du_an(text[])` trước và sau `napPhatBieu` bằng nhau, thoát 0,
  dòng «ok bộ phân xử sau napPhatBieu bằng bản DB đang chạy (…)»; và ở trạng thái DB chưa có phần chèn 068, 099 (dựng trong
  giao dịch), `napPhatBieu` không cấy thêm chúng — dòng «ok DB chưa có phần chèn 068, 099: napPhatBieu không cấy thêm phần chèn».
  Hai chiều đỏ gọi đúng hàm: `--pha bo-099` → «FAIL … khác bản DB đang chạy: resolve_offer_fields(text[])»; `--pha bo-tra-du-an`
  (áp lại 099 mà không trả bản đang chạy) → «FAIL … khác bản DB đang chạy: resolve_offer_area_du_an(text[])», không nêu hàm kia.
- **AC-3** Given bản chép DB thử, When `KDM-AC-3 ba chiều trên cùng DB`, Then xanh: `--thu` thoát 0 (lượt nền 0 tin có phường hợp
  lệ bị gỡ hay đổi), hai chiều đỏ cũ `--pha khong-sua`, `--pha mo-loc` vẫn đỏ đúng dòng.
- **AC-4** Given bản chép DB thử, When `--thu --pha bo-099`, Then thoát 1, dòng «FAIL lượt nền: <n> tin có phường hợp lệ ở DB thật
  bị gỡ hay đổi khu vực» với n ≥ 1, dừng sau lượt nền (không «phép đo dừng giữa chừng»).
- **AC-5** Given thế CI (`CI=true`), When `node scripts/lib/ci-can-du-lieu.mjs scripts`, Then ca HT5-AC-3 nằm trong danh sách bỏ qua
  có lý do; HT5-AC-1, HT5-AC-2 không bị bỏ; `scripts/ci-test-module.test.mjs` xanh.
- **AC-7** Given bản chép DB thử, When chạy `pipeline/phat-bieu-cat-chuyen.mjs --thu` với `napPhatBieu` của main f962afade và của
  nhánh, Then hai bản in cùng bộ dòng số và cùng mã thoát (hay khác thì `so-cat-chuyen.md` ghi từng dòng lệch kèm lý do); probe
  `probes/so-cat-chuyen.mjs --kiem` thoát 0 khi tệp có đủ hai lượt, cùng mã thoát và mọi dòng lệch có lý do. Mã thoát của công cụ
  không phải lời hứa của hàng: cắt chuyển PL15 đã chạy thật, `--thu` trên dữ liệu hôm nay báo lệch ở cả main.
- **AC-6** Given cây sau khi sửa, When chạy `feature_loop.suite_keys` và `node --test scripts/*.test.mjs`, Then thoát 0.

## Out of scope

- Sửa migration, transform, bộ phân xử thật hay DB máy thu — đường ống thật không gọi `napPhatBieu`.
- Gom các bộ nạp lại khác (`napDacTrung`, `nap068`) về một chuỗi chung — chúng không nạp lại thân 045.
- Đo lại các thước khác gọi `napPhatBieu` (PX1 AC-9 `nap-dvhc-do.mjs`…) — số có thể đổi theo bản sửa (đúng hơn: bộ phân xử
  khớp DB). Riêng `phat-bieu-cat-chuyen.mjs --thu` (GS dặn soát) là AC-7.

## Coverage

- Bỏ quét hình thái: xem dòng sổ `descope` «bỏ coverage-scan». Trục đã phủ: chuỗi migration (AC-1) · bộ phân xử sau nạp (AC-2) ·
  lượt nền xanh/đỏ (AC-3, AC-4) · thế CI (AC-5) · hồi quy (AC-6).

## Notes

- Soát `phat-bieu-cat-chuyen.mjs --thu` 22/11 (so-cat-chuyen.md): main f962afade và nhánh in giống hệt (S03 property_type
  8160 → 8164, bedrooms 8237 → 8239, block_raw 4639 → 4641; S05 bedrooms 29 → 32; S06 không đổi; legacy mới 1; 0 dòng lệch giữa
  hai bản); cả hai thoát 1 «LỆCH — không ghi» — đỏ sẵn của công cụ trên dữ liệu hôm nay, không do HT5.
- Mù-1 (suite `pipeline_a` không có mã thoát ở lượt chấm S4 r2 thử lại — bộ chấm bỏ chờ ở phút 30): bằng chứng NGOÀI lượt chấm,
  không thay cho S4 — `nice -n 19 node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'` trên đầu nhánh
  394af89ae, 2026-11-22T17:02:57Z: mã thoát 0, 434 ca pass / 0 fail / 0 cancelled, 1.559 giây (nhật ký
  `.acceptance-runs/ht5/pipeline-a-ngoai-luot.log`). Cùng lệnh này (E6a) đã xanh ở S4 r1.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-23:
  - Ngoài-1: Một lần thêm migration mới có thể làm bước kiểm danh sách báo xanh dù bộ nạp lại chưa áp phần mới. Bước so bản hàm trên dữ liệu thật vẫn bắt được, nên chỉ chậm phát hiện một nhịp.
  - Ngoài-2: Người chạy công cụ kiểm có thể gõ nhầm tổ hợp tuỳ chọn và nhận kết quả xanh trông như đã kiểm chiều đỏ. Không ảnh hưởng dữ liệu thật hay người dùng cuối.
  - Ngoài-3: Nếu phép so bị ngắt giữa chừng, hai tệp tạm có thể nằm lại trong thư mục mã nguồn và phải xoá tay. Không ảnh hưởng người dùng.
  - Ngoài-4: Phép so sánh trước và sau bản sửa có thể không thấy khi số tin bị lệch thay đổi lớn mà mười dòng đầu vẫn giống. Kết luận không đổi đầu ra khi đó yếu hơn vẻ ngoài.
  - Ngoài-5: Nếu cấu trúc tệp đổi, phép so có thể lặng lẽ so bản với chính nó và báo xanh giả. Chỉ ảnh hưởng độ tin cậy của bằng chứng nội bộ.
  - Ngoài-6: Lời hứa trong tên ca kiểm rộng hơn thứ nó thật sự kiểm, nên người đọc có thể tin bộ nạp lại đã được ép cập nhật khi chưa. Dữ liệu và người dùng không bị ảnh hưởng.
  - Ngoài-7: Phép kiểm cuối chỉ đọc lại bản ghi đã lưu, nên nếu mã đổi sau đó mà không chạy lại phép so, nó vẫn báo xanh trên số cũ.
  - Ngoài-8: Một ô kiểm có thể báo xanh mà chưa chứng minh được trạng thái thiếu phần chèn đã thật sự dựng, nên độ tin cậy của ô đó thấp hơn vẻ ngoài. Không ảnh hưởng dữ liệu người dùng.
  - Ngoài-9: Chú thích trong công cụ đo hứa một lớp canh mạnh hơn thực tế. Người đọc sau này có thể tin rằng thêm migration mới sẽ luôn bị bắt, trong khi thực ra chỉ có phép so bản hàm ở ca khác bắt được.
  - Ngoài-10: Nếu người chạy công cụ đo gõ nhầm tổ hợp tuỳ chọn, công cụ có thể báo xanh dù đang ở chiều thử lỗi, hoặc chạy một chiều chưa được khai. Chỉ ảnh hưởng người vận hành công cụ nội bộ.
  - Ngoài-11: Ca kiểm danh sách migration chỉ đo lời khai, không đo việc nạp lại thật. Một migration mới có thể làm ca này xanh dù chưa được áp lại, và chỉ ca so bản hàm sau đó mới bắt được.
  - Ngoài-12: Phép kiểm so sánh hai bản cắt chuyển chỉ đọc tệp ghi kết quả cũ, không chạy lại. Nếu mã đổi sau đó làm kết quả lệch thì phép kiểm này vẫn báo xanh.
  - Ngoài-13: Một ô kiểm có thể báo xanh dù bước dựng trạng thái thử không thật sự gỡ được phần cần gỡ. Khi đó ô này không chứng minh được điều nó nói.
  - Mù-1: suite pipeline_a không có mã thoát ở lượt chấm S4 r2 thử lại (bộ chấm bỏ chờ); ship với bằng chứng ngoài lượt chấm 434/0.
