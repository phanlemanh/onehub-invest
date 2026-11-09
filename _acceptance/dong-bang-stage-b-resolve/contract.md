---
schema_version: 1
feature: Đóng băng Stage B của bộ dựng căn và thẻ Ghép căn — không sinh cặp, không gieo thẻ, thẻ chờ không hiện, dữ liệu cũ giữ nguyên
slug: dong-bang-stage-b-resolve
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, ui]
status: approved
design_doc: docs/superpowers/specs/2026-11-09-dong-bang-stage-b-resolve-design.md
approved_by: Mạnh
approved_at: 2026-11-09
---

# Acceptance Contract: dong-bang-stage-b-resolve

## Context

Ngày 08/11 Mạnh chốt Q1: gắn căn là nhận diện duy nhất, như có số nhà hay mã căn (`docs/product/FRAMING.md` §3.4). Stage B
của `pipeline/resolve-properties.mjs` dựng mỗi đêm cặp tin «cùng phường, diện tích lệch dưới 15%, giá/m² lệch dưới 20%»,
và `agent/scripts/judge-run.ts` biến cặp thành thẻ «Ghép căn» ở `/ops/review`. Duyệt thẻ chỉ đổi trạng thái cặp, không gắn
tin vào căn nào. Bản tổng hợp 08/11 giao việc V7: đóng băng Stage B và thẻ này, không vá — danh bạ vật thể (DB1) và chuỗi
gắn căn GC0–GC3 thay thế. DB máy thu 09/11: 748 cặp, 7 thẻ Ghép căn đang chờ (mới nhất 30/10), 12 thẻ đã quyết.

## Criteria

### AC-1 — Stage B không dựng cặp, không xoá cặp
Given DB có cặp `property_candidates` đủ bốn trạng thái và tin S03/S05/S06 đủ điều kiện cặp của luật cũ,
When chạy `chayResolve`,
Then không câu nào gửi tới DB nhắc `property_candidates`; mọi dòng `property_candidates` giữ nguyên từng cột; đầu ra có
đúng dòng `Stage B: đóng băng (V7) — không dựng cặp mới`; và `properties`, `property_offers` sau lượt bằng đúng kết quả của
Stage A bản trước vòng trên cùng dữ liệu.

### AC-2 — judge-run không chấm, không gieo, không rút
Given DB có cặp `needs_llm` và thẻ Ghép căn đang chờ,
When chạy `agent/scripts/judge-run.ts` (có hay không `--khong-llm`),
Then lệnh thoát 0, in đúng dòng `judge-run: Ghép căn đóng băng (V7) — không chấm, không gieo hay rút thẻ`, không mở kết
nối DB, không gọi model; `review_queue` và `property_candidates` không đổi.

### AC-3 — Hàng duyệt không hiện thẻ Ghép căn đang chờ
Given `review_queue` có thẻ Ghép căn đang chờ, thẻ Ghép căn đã quyết và thẻ đang chờ của loại khác,
When nạp hàng duyệt `/ops/review` (`loadReviewQueue`), kể cả mở `?card=<mã thẻ Ghép căn đang chờ>`,
Then danh sách không có thẻ Ghép căn đang chờ nào và liên kết sâu tới nó ra «Không tìm thấy thẻ»; thẻ Ghép căn đã quyết
và mọi thẻ chờ loại khác vẫn có, mở được bằng `?card=`.

### AC-4 — Mọi số đếm thẻ chờ bỏ thẻ Ghép căn đang chờ
Given cùng dữ liệu của AC-3,
When đọc ba số đầu trang (`loadDauTrang`), số thẻ chờ theo loại cho vai viewer, số «Hàng duyệt» của trang dòng chảy
(`app/src/lib/data-flow-queries.ts`), bản tin cloud (`readReviewQueue` của `scripts/lib/ops-local.mjs`), số H1 của báo cáo
ngày (`scripts/bao-cao-ngay.mjs`) và kiểm HD11 (`pipeline/do-the-duyet.mjs`),
Then không số nào tính thẻ Ghép căn đang chờ; thẻ chờ loại khác vẫn được tính đủ; thẻ Ghép căn «hoãn» không tính là chờ
(như hàng duyệt đang làm); «Đã quyết hôm nay» vẫn tính thẻ Ghép căn quyết trong ngày.

### AC-5 — Căn giá tốt không báo «đang chờ ghép»
Given một căn ở Căn giá tốt là Tin A của một thẻ Ghép căn đang chờ,
When nạp `loadPendingUnitMatches` cho căn đó,
Then kết quả rỗng — không căn nào mang mã thẻ chờ ghép, không truy vấn `review_queue`.

### AC-6 — Một vị từ đóng băng cho mọi bên đọc
Given vị từ `THE_DONG_BANG_SQL` ở `app/src/lib/ops/review-dong-bang.ts`,
When so với chuỗi vị từ chép trong các tệp `.mjs`, và quét MỌI câu `FROM review_queue` / `JOIN review_queue` trên cây
(`app/src`, `scripts`, `pipeline`, `agent`, `data-api/src`; trừ test và smoke),
Then mọi chuỗi vị từ bằng nhau từng ký tự; mỗi câu đọc thẻ chờ không lọc riêng một loại khác `entity_match` chứa `NOT ` +
vị từ, hoặc nằm trong danh sách miễn ghi lý do từng câu (đọc theo mã thẻ, lọc loại khác, judge-run đã đóng băng).

### AC-7 — Vòng không ghi dữ liệu
Given cây của vòng so với nhánh chính,
When quét các tệp vòng đổi,
Then không có migration mới; không câu `INSERT`, `UPDATE`, `DELETE` hay `TRUNCATE` mới nào nhắm `review_queue`,
`property_candidates`, `property_offers`, `properties`; route `app/src/app/api/v1/ops/review/[id]/decide/route.ts` không
đổi.

### AC-8 — Bước đêm và tài liệu
Given `scripts/chotot-daily.sh` và tài liệu của kho,
When đọc bước `resolve-properties` và các mục mô tả Stage B, judge-run,
Then `chotot-daily` vẫn gọi `resolve-properties`; ROADMAP §2 as-built, `pipeline/CLAUDE.md` ghi Stage B và thẻ Ghép căn đã
đóng băng, lý do Q1 và việc thay thế là DB1, GC0–GC3. (judgment)

### AC-9 — Hồi quy
Given bộ test của `app`, `pipeline`, `agent`, itest thử lại deadlock của resolve và itest `s03-len-cong`,
When chạy,
Then tất cả xanh; test cũ gieo thẻ Ghép căn đang chờ được đổi mồi (thẻ đã quyết hoặc loại khác) mà không bỏ phép đo nào.

## Coverage

Trục (quét hình thái, preset entity-feature cho «thẻ Ghép căn»):
- Lớp: sinh cặp (Stage B) · chấm và gieo thẻ (judge-run) · hiện thẻ (hàng duyệt, `?card=`) · đếm thẻ (đầu trang, viewer,
  bản tin cloud, dòng chảy, báo cáo ngày, HD11) · báo căn (Căn giá tốt) · ghi quyết định (route decide). [thước CE: quét
  mọi câu `FROM|JOIN review_queue` trên cây 773a0040 — E6 chạy lại phép quét mỗi lượt, câu mới không vị từ thì đỏ]
- Trạng thái thẻ: đang chờ · đã quyết · hoãn. [thước CE: CHECK của `review_queue.status`]
- Nơi: máy thu · cloud (chỉ số đếm qua bản tin). [thước CE: `review-content.tsx` nhánh `localOnlyTable`]

Core → AC-1…AC-7. Later: đóng 7 thẻ cũ bằng một lượt ghi (Hỏi-1 lối khác). Never: vá luật cặp Stage B (trái Q1). Thẻ
«hoãn» do máy đặt (`deferred` của judge-run) không còn sinh khi judge-run dừng — không có AC riêng.

## Out of scope

- Không xoá hay đóng thẻ Ghép căn cũ, không xoá cặp `property_candidates` — dữ liệu giữ làm lịch sử.
- Không sửa route decide (đường dẫn T3); POST tay vào thẻ Ghép căn đang chờ vẫn đổi trạng thái cặp như cũ.
- Không dựng bộ gắn tin → nút danh bạ (GC0–GC3) hay danh bạ vật thể (DB1) — hàng riêng.
- Không gỡ giao diện thẻ Ghép căn (`review-card.tsx`) — thẻ đã quyết vẫn cần nó để xem lại.

## Notes

- Hỏi-2 theo lối khác (thêm Alert «Ghép căn đã đóng băng») thì TRƯỚC khi duyệt: thêm AC-10 (Alert hiện ở /ops/review cho
  vai ops và viewer, sáng và tối) + E10 `ui-check` `layer: ui-observed`, ghi dòng sổ `supersedes` cho ba dòng bỏ design-pass,
  ui-observed, đặc-tả-UX, rồi dựng lại thẻ. Ba dòng bỏ ấy chỉ đứng khi Hỏi-2 = không thêm chữ.
- HD11 (`do-the-duyet`) sau đóng băng đo 0 thẻ: kết quả «pass» là rỗng, không phải «đủ dữ liệu».
- Ca «tin cấp thị trường không thành cặp» của `pipeline/scripts/s03-len-cong.itest.mjs` đúng theo cấu tạo khi Stage B không chạy.
