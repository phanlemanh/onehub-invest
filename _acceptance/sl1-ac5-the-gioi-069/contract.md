---
schema_version: 1
feature: Hai ca SL1-AC-5 đỏ sẵn của itest s03-len-cong xanh lại — đọc lại «không đổi ô nào» theo thế giới sau 069, phát lại 067 trên view đời 070
slug: sl1-ac5-the-gioi-069
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-11
design_doc: docs/superpowers/specs/2026-11-11-sl1-ac5-the-gioi-069-design.md
---

# Acceptance Contract: sl1-ac5-the-gioi-069

## Context

Hai ca SL1-AC-5 của `pipeline/scripts/s03-len-cong.itest.mjs` đỏ trên DB thử chép từ máy thu, lệnh chấm của hồ sơ
`dong-bang-stage-b-resolve` đang bỏ qua chúng. Ca «áp 069» đỏ vì 39.884 phát biểu loại hình bậc `inferred` (`transform-zalo@sl1`)
sinh SAU 069 — 069 cho chính loại phát biểu này vào cột; câu đã ký «phân xử lại mọi tin hiện có không đổi ô nào» (AC-5 của
`s03-len-cong`) nói về tin lúc 069 ra đời. Ca «hai thứ tự» đỏ vì bản sao 067 thay view `sale_offers` bằng `SELECT *` mà view đã có cột
tính của 070. Tách từ `do-san-sl1-kdm` (sổ d-20261110T194308Z-6). Thiết kế: `docs/superpowers/specs/2026-11-11-sl1-ac5-the-gioi-069-design.md`.

## Criteria

### AC-1 — Áp 069 chỉ đổi đúng ô luật 069 định đổi (cách đọc lại câu đã ký — Hỏi-1)
Given DB của riêng lượt chép từ bản mẫu của DB máy thu (`db/db-thu.sh --chay`) với ít nhất 1.000 phát biểu
`property_type` bậc `inferred` còn sống, trong giao dịch ROLLBACK, mọi tin phân xử bằng hàm 061,
When áp 069 và phân xử lại mọi tin,
Then giá trị kỳ vọng tính bằng câu SQL độc lập trên `field_assertions` (không gọi hàm phân xử), chia bốn loại tin, mỗi loại ít nhất một
tin: (a) không có phát biểu `property_type` bậc `inferred` còn sống → không đổi ô nào (trọn dòng trừ `updated_at`); (b) chỉ một giá trị
suy, không lớp trên → cột nhận giá trị đó, `tier: inferred`; (c) hai giá trị suy, không lớp trên → `unknown` kèm `goi_y`; (d) có lớp trên
(`observed`/`fact`) → `property_type` và khoá `property_type` của `field_provenance` không đổi. Ở (b), (c) chỉ cột `property_type` và
khoá `property_type` của `field_provenance` được đổi. Thiếu dữ liệu (dưới 1.000 phát biểu, hay một loại không có tin) thì ca đỏ nêu rõ,
không bỏ qua. Ba chiều đỏ cùng fixture, mỗi chiều ghim «SL1-AC-5»: đổi `bathrooms` của một tin loại (a); đổi một cột ngoài
`property_type` của một tin loại (b); đổi một khoá `field_provenance` khác `property_type` của một tin loại (b).

### AC-2 — Hai thứ tự với 068 chạy được trên view đời 070
Given ma trận năm thứ tự (chỉ 069 · 067→069 · 068→069 · 069→068 · 067→068→069) trên DB thử có view `sale_offers` mang cột của 070,
When mỗi giao dịch gỡ view `sale_offers` trước khi phát lại thứ tự có 067,
Then mọi assert cũ của ca giữ nguyên và xanh (`fp_sdt`, cột 067, luật mới, dấu số, dấu trạng thái chào, «mất mốc thì dừng»); cùng thứ
tự `067→069` không gỡ view thì phát lại vẫn vỡ ở `seller_phone_inferred`, ca ghim «SL1-AC-5»; sau ma trận, định nghĩa view
`sale_offers` (`pg_get_viewdef`) đọc từ một kết nối mới bằng trước ma trận.

### AC-3 — Cả tệp itest xanh, không bỏ ca, không ghi DB dùng chung
Given lệnh `sl1_ac5_toan` chạy `pipeline/scripts/s03-len-cong.itest.mjs` qua `db/db-thu.sh --chay` trên DB của riêng lượt, không
`--test-skip-pattern`,
When chạy,
Then exit 0, dòng tổng kết «skipped 0», «fail 0»; chạy cùng tệp với `DATABASE_URL` trỏ `oneinvest` thì thoát khác 0 trước khi nối DB,
thông điệp «không chạy trên oneinvest».

## Coverage

Trục (preset test-matrix cho «ca đo trên DB thử»):
- Loại tin khi áp 069: không phát biểu loại hình suy · một giá trị suy · hai giá trị suy · có lớp trên (observed/fact). [AC-1 — thước:
  câu SQL độc lập trên `field_assertions` của DB của riêng lượt chép từ máy thu]
- Thứ tự migration: năm thứ tự của ma trận cũ × view đời 070 có/không gỡ. [AC-2]
- Chỗ chạy: DB của riêng lượt · ROLLBACK · từ chối `oneinvest`. [AC-3]

Core → AC-1…AC-3. Later: gỡ `--test-skip-pattern` của `dbs_s03_len_cong` (hồ sơ `dong-bang-stage-b-resolve` khi ghim lại). Never: sửa
migration đã commit, sửa dữ liệu thật.

## Out of scope

- Sửa migration 067, 068, 069, 070 hay dữ liệu thật; ghi DB dùng chung.
- Sửa hợp đồng đã ký của `s03-len-cong` (cách đọc lại ghi ở hồ sơ này).
- Gỡ `--test-skip-pattern` của `executors.test.dbs_s03_len_cong` (hồ sơ đã ký).

## Notes
