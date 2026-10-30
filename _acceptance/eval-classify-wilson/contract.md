---
schema_version: 1
feature: Người vận hành dữ liệu chạy eval:classify và nhận độ đúng từng (cách đọc × trường × phân khúc) theo cận dưới Wilson so với ngưỡng F3, ghi vào dq_check_results
slug: eval-classify-wilson
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-10-30-eval-classify-wilson-design.md
---

# Acceptance Contract: eval-classify-wilson

## Context

Hàng PL9 của `docs/plan/lo-trinh.json` (T2, đứng trên PL8 đã gộp). Cổng Đáng `build`: Mạnh 30/10. Căn cứ: review
phân loại F3 (ngưỡng theo cận dưới Wilson: nhóm A ≥ 0,95, nhóm B ≥ 0,90), §3.5 (dev/test, `eval:classify` ghi
`dq_check_results`), §0.4 (ô = cách đọc × trường × phân khúc), FRAMING §3.4 (phân khúc = thị trường × loại hình);
bảng nhãn PL7 (054); tập mẫu PL8 (JSONL). Hôm nay lát OCP1 có 0 nhãn người.

## Criteria

- AC-1: Given số đúng `k` trên `n` nhãn, When tính cận dưới Wilson 95% hai phía (z = 1,96), Then kết quả khớp các mốc
  của bảng cỡ tập F3 theo cả hai chiều.
  - Đạt 0,95: 100/100, 148/150, 197/200; không đạt: 99/100, 147/150, 196/200.
  - Đạt 0,90: 96/100, 143/150; không đạt: 95/100, 142/150 (F3 ghi «150 được ≤ 8 lỗi» — công thức cho ≤ 7; lệch ghi ở
    design §5).
  - `n = 0` cho «không có số», không phải 0.
- AC-2: Given một ô có `n` nhãn và `k` đúng, When xếp trạng thái, Then ngưỡng theo nhóm trường và trạng thái theo cận
  dưới.
  - Nhóm A ≥ 0,95: `listing_intent`, `kind`, `property_type`, `project`, `building`. Nhóm B ≥ 0,90: `price_min_vnd`,
    `price_max_vnd`, `area_m2`, `bedrooms`.
  - `pass` khi cận dưới ≥ ngưỡng, `fail` khi dưới; tỉ lệ thô đạt ngưỡng mà cận dưới không đạt là `fail`.
  - `skip` có lý do tên: «chưa có cách đọc» khi cách đọc không trả trường đó (xét trước); «chưa có nhãn người» khi
    `n = 0`.
- AC-3: Given nhãn vàng và giá trị cách đọc của một trường, When so khớp, Then đúng/sai theo luật của trường.
  - Vàng «tin không nêu»: đúng khi cách đọc không trả gì, sai khi trả giá trị; vàng có giá trị mà cách đọc không trả
    gì là sai.
  - Chữ và từ vựng: bằng nhau sau NFC + chữ thường + bỏ khoảng trắng thừa. Giá: bằng nhau từng đồng. Diện tích: lệch
    ≤ 3%. Phòng ngủ: bằng nhau.
- AC-4: Given chữ tin, When cách đọc `parser` đọc, Then nó trả đúng giá trị mà `parsePost`/`maToaCan` thật của
  `transform-zalo.mjs` đọc ra, đổi về khuôn nhãn PL7 — mọi giá trị nó trả đi qua bộ ghi nhãn thật `chuanHoaLuot` mà
  không đổi.
  - `kind`; `price_min_vnd` = `price_max_vnd` = giá; `area_m2`; `bedrooms`.
  - `building`: mã toà bỏ đuôi căn, chữ thường, chỉ khi tin nêu đúng một toà.
  - Không trả `listing_intent`, `property_type`, `project`.
- AC-5: Given nhãn người của một lát trên DB, When đọc nhãn vàng, Then chỉ lấy tin của lát và split đã chọn (mặc định
  `test`), chữ tin từ `stg_zalo_posts`.
  - Một trường: một người gắn, hoặc nhiều người cùng nhãn → nhãn đó.
  - Nhiều người khác nhãn → loại trường ấy, đếm `bat_dong`. Tin không còn chữ → loại cả tin, đếm `mat_chu`.
  - Đọc trong giao dịch chỉ đọc.
- AC-6: Given nhãn vàng và sổ cách đọc, When chấm, Then mỗi ô (cách đọc × trường × phân khúc) có đúng một kết quả.
  - Phân khúc `tat-ca` luôn đủ (số cách đọc × 9) ô, kể cả khi chưa có nhãn nào.
  - Thêm một phân khúc cho mỗi loại hình có trong nhãn vàng («tin không nêu» → `khong-neu`); tin có nhãn loại hình
    bất đồng chỉ vào `tat-ca`.
- AC-7: Given một lượt chấm nhãn người không `--dry`, When lệnh ghi, Then mỗi ô một dòng `dq_check_results`, cả lượt
  trong một giao dịch.
  - `check_name = 'eval-classify'`; `entity = '<lát>|<phân khúc>|<cách đọc>|<trường>'`; `status` của AC-2.
  - `detail` là một dòng `khoá=giá trị` đúng 12 khoá theo thứ tự: `run`, `tap`, `split`, `n`, `dung`, `ti_le`,
    `can_duoi`, `nguong`, `nhom`, `ly_do`, `bat_dong`, `mat_chu`; mọi dòng của lượt chung `run`.
  - Không có `labeler_id`, chữ tin hay tên nguồn thật trong `entity`/`detail`.
  - Lỗi giữa lượt thì không dòng nào của lượt ở lại. `--dry` không ghi dòng nào. Lệnh không ghi bảng nào khác.
- AC-8: Given tệp tập mẫu PL8 (`label-mau.mjs --out`), When chạy `--tap-mau <tệp>`, Then lệnh chấm cách đọc trên nhãn
  có sẵn của tệp và in bảng ô.
  - Không mở kết nối DB, không ghi gì.
  - Tệp không có dòng đầu `loai: "tap-nhan-mau"`, `mau: true` thì bị từ chối kèm lý do.
  - Lệnh không nạp bộ sinh `lib/tap-mau.mjs`.
- AC-9: Given các dòng `eval-classify` ở `dq_check_results` (pass, fail, skip hai lý do), When bảng «Kiểm chất lượng»
  trên `/ops/quality` đọc chúng qua `app/src/lib/dq-labels.ts`, Then tên kiểm, đối tượng và chi tiết đều có nhãn tiếng
  Việt, không dòng nào hiện «chưa diễn giải».
  - Ca ON12-AC-5 (dựng bảng thật, soi mọi dòng 7 ngày) xanh trên DB thử sau một lượt ghi thật.
  - Nhãn mới có thuật ngữ trong `CONTEXT.md`.
- AC-10: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong:
  - `pipeline/lib/eval-classify.mjs`, `pipeline/lib/eval-classify.test.mjs`, `pipeline/eval-classify.mjs`,
    `pipeline/package.json` (một dòng script), `pipeline/CLAUDE.md` (một dòng bảng lệnh);
  - `app/src/lib/dq-labels.ts`, `app/tests/dq-eval-classify-label.test.tsx`, `app/tests/eval-classify-mien.test.tsx`,
    `CONTEXT.md` (một thuật ngữ);
  - `_acceptance/config.yaml`, hồ sơ này, design doc, plan, tệp máy sinh (`PRODUCT-MAP.md`, `LO-TRINH.html`).

## Coverage

- Trục **trường × nhóm ngưỡng** (chín trường PL7 × A/B) — AC-2, AC-3.
- Trục **trạng thái ô** (pass, fail, skip «chưa có nhãn người», skip «chưa có cách đọc») — AC-2, AC-6.
- Trục **nguồn vàng** (nhãn người theo split, tập mẫu) — AC-5, AC-8.
- Trục **ca nhãn người** (một người, đồng nhãn, bất đồng, mất chữ, khác lát, khác split) — AC-5.
- Trục **đường ra** (bảng in, `--dry`, `dq_check_results`, bảng «Kiểm chất lượng») — AC-7, AC-8, AC-9.
- Thước CE: ma trận viết trước trong test (số assert = số phần tử); mốc Wilson từ bảng F3. Bản quét: `coverage-scan.md`.

## Đường đo

- Ngưỡng ở `opportunity.md`: «ghi đủ một dòng mỗi ô, số cận dưới khớp bảng cỡ tập của F3, ô chưa có nhãn người hay
  chưa có cách đọc là bỏ qua có tên».
- Đủ dòng mỗi ô và «bỏ qua có tên»: AC-6, AC-7 (lượt ghi thật trên DB thử có nhãn: số dòng thêm = số ô; lượt `--dry` trên DB local của lát OCP1 hôm nay ra 9 ô `skip` ở phân
  khúc `tat-ca`: 6 «chưa có nhãn người» và 3 «chưa có cách đọc» — cách đọc `parser` trả 6/9 trường; ô không có cách
  đọc mang lý do ấy trước, dù có nhãn hay không).
- Số cận dưới khớp F3: AC-1.

## Out of scope

- Màn số độ đúng riêng trên `/ops/quality` (C4 `quality-du-theo-use-case`) — vòng này chỉ cho dòng kiểm có chữ tiếng
  Việt trong bảng «Kiểm chất lượng» sẵn có.
- Cách đọc E1 luật, LLM, Kev; nhóm C (mô tả); chạy trong CI khi parser đổi; đo lại hằng tuần và tự hạ ô.
- Ghi số tập mẫu vào DB; bảng kết quả eval riêng (cần migration).
- Sửa dòng «150 được ≤ 8 lỗi» của review F3 (tài liệu ngoài vùng tệp).
- Cặp ghép căn (G3); lát khác OCP1.

## Notes

- Lát OCP1 hôm nay có 0 nhãn người: lượt chạy thật chỉ ra ô `skip`; số thật có khi đội gắn nhãn.
