# meta-kev-thanh-phat-bieu (PL5) — điểm Kev thành phát biểu ý định tin và bán/thuê

Hồ sơ: `_acceptance/meta-kev-thanh-phat-bieu/` · hàng PL5 · hạng T3 (migration) · phần (2) của cách chia giám sát duyệt
30/10 (P1-65): ZCode làm phần (1) — hook hỏi Kev hai câu typed, `meta.kev` v5, importer chở vào cột `kev_*` của bảng nạp;
P1 làm phần (2) — cột, sổ từ vựng, transform ghi phát biểu, phép đo. Cổng Bằng chứng chờ dữ liệu thật của phần (1).

## Vấn đề

Kev-4B chấm điểm mọi tin Zalo ở hook (PL4) nhưng chỉ một xác suất cho một câu, và bước nạp bỏ qua `meta.kev`: bảng nạp
`stg_zalo_posts` không có cột Kev nào. Transform không biết tin nào là tin rao, Yêu cầu hay không phải tin; bài «khách
tìm…» (Yêu cầu) không thành offer và mất dấu. C1.1: lọc phải là phát biểu ở pipeline để chạy lại được khi đổi ngưỡng.

## Hình dạng dữ liệu (liên làn chốt 30/10, claudedp-3010-2 — ZCode code theo đúng bộ này)

`meta.kev` v5 = `{p, intent, intent_p, kind, kind_p, model, at}`. Snapshot v3/v4 chỉ có `p, model, at`. Gate down → mọi
điểm `null`. Migration 057 (số liên làn cấp) thêm vào `stg_zalo_posts`, cho phép NULL:

| Cột | Kiểu | Nghĩa |
|---|---|---|
| `kev_p` | real | điểm «có phải tin BĐS» (v3 lẫn v5) |
| `kev_intent` | text | `offer` · `inquiry` · `not_listing` — CHECK đúng sổ `listing_intent` |
| `kev_intent_p` | real | xác suất của lớp ấy |
| `kev_kind` | text | `sale` · `rent` — CHECK |
| `kev_kind_p` | real | xác suất của lớp ấy |
| `kev_model` | text | model chấm |
| `kev_at` | timestamptz | lúc chấm |

Bảng nạp chỉ ở máy thu (không lên cloud) — migration chỉ áp DB local. Nhận diện «ngày v5»: ngày (giờ VN) có ít nhất một bài
mang `kev_intent` không null; trong ngày ấy, bài có `kev_at` (gate đã trả lời) phải có `kev_intent`; bài gate down (mọi
điểm null) được đếm riêng, không tính trượt. Ô cơ hội viết «một ngày v3» lúc DATA-CONTRACT mới v3; ý định và bán/thuê chỉ
có từ v5 nên phép đo dữ liệu thật dùng ngày v5.

## Phát biểu

- Sổ: trục mới `assertion_field` = năm trường cũ + `listing_intent` + `kind`, gắn cột `field_assertions.field`; trục
  `enrich_field` thôi gắn `field_assertions.field` (vẫn gắn `enrichment_proposals.field` — mỗi trục có cột bị CHECK, mở rộng
  `enrich_field` là cho Kev đề xuất enrich). Trục `assertion_method` thêm `kev` «Bộ lọc Kev»; rationale của trục sửa cùng
  commit: `kev` thuộc lớp suy luận.
- Lớp `inferred`: Kev cho một lớp kèm xác suất, không trích dẫn; sổ gọi lớp `observed` là «Quan sát có trích dẫn», và thiết
  kế PL15 dành lớp `inferred` cho phát biểu không trích dẫn. Migration 057 thay CHECK `field_assertions_field_chk`,
  `field_assertions_method_chk` và hàm canh: `kev` chỉ đi với `inferred`. Lớp `inferred` không bao giờ vào cột canonical
  (PL15) — năm cột và bộ phân xử không đổi.
- Transform (`transform-zalo.mjs`, hàm thuần mới `pipeline/lib/kev-phat-bieu.mjs`): với MỌI bài S03 thật (đã gạt bài thử):
  - `kev_intent` có → phát biểu `listing_intent` = đúng mã ấy;
  - `kev_kind` có → phát biểu `kind` = `sale`, hoặc `rent_lt` khi Kev ghi `rent` (mã sổ của «Cho thuê»);
  - lớp `inferred`, phương pháp `kev`, `method_version` = `kev_model`, `observed_at` = `kev_at`, `evidence` = `{p: <xác suất
    của lớp>, kev_p, model}`; chủ thể `S03:<post_id>`; `replaceOwn` theo (chủ thể, trường, phương pháp) — chạy lại thay chính
    nó, `kind` và `listing_intent` không thay nhau.
  Mỗi bài mỗi trường đúng một phát biểu vì Kev chỉ trả một lớp mỗi câu. Không ngưỡng, không lọc. Giá trị ngoài bộ (không
  thể có nhờ CHECK, nhưng hàm vẫn chặn) → không ghi, đếm vào dòng log.
- Không loại tin nào theo Kev: luồng dựng offer không đọc cột Kev. Bài Yêu cầu không thành offer nhưng giữ phát biểu
  `listing_intent = inquiry` theo bài.
- Cột Kev chưa có trên DB (057 chưa áp) → transform bỏ qua bước Kev, in một dòng «chưa áp 057», luồng offer chạy như cũ
  (máy thu chạy mã từ checkout chính ngay sau gộp, trước khi migration được áp).

## Đo (KV3 và không lùi)

- Ma trận thuần `pipeline/scripts/kev-phat-bieu.test.mjs`: dòng cột Kev → phát biểu (tin rao, Yêu cầu, không phải tin, rent
  → rent_lt, chỉ có ý định, chỉ có kev_p của v3, gate down, giá trị ngoài bộ).
- Ca DB thử `pipeline/scripts/kev-phat-bieu.itest.mjs` (ROLLBACK, nạp 045 + 057 trong giao dịch): bài tin rao, Yêu cầu, không
  phải tin, bài không điểm; chạy hai lần; offer giống hệt khi có và khi trống cột Kev; năm cột canonical không đổi.
- Thước KV3 `pipeline/scripts/do-kev-phat-bieu.mjs` trên DB thử: điền điểm Kev tổng hợp (7 cột) cho mọi bài S03 trong ROLLBACK, đo
  giây transform-zalo có/không Kev, số phát biểu thêm, cỡ thêm của 7 cột (`pg_column_size`), offer giống hệt; `field_assertions`
  không nằm trong danh sách bảng của sync cloud (cloud không phình).
- Dữ liệu thật (sau phần 1): ngày v5 gần nhất — bài có `kev_at` đều có `kev_intent`; số bài gate down in riêng; số offer
  khi có Kev = khi xoá trắng cột Kev (bất biến của transform); số bài stg S03 và số offer của ngày ấy in cạnh trung vị 7
  ngày trước (chỉ in — rớt bài ở hook/importer là nghiệm thu của phần 1); bài «khách tìm…» có phát biểu `listing_intent`
  (không bị bỏ) và tỉ lệ ra `inquiry` được in (Hỏi-1).

## Không làm

- Hook, OpenClaw, importer, DATA-CONTRACT (làn ZCode — phần 1).
- Đặt ngưỡng hay lọc theo Kev (PL21 khi đã đo); huấn luyện lại Kev (PH3); bảng lưu Yêu cầu và ghép với listing (luật 11).
- Đưa `listing_intent`/`kind` của Kev vào cột canonical hay bộ phân xử.
