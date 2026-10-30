## Ngữ cảnh

- Sản phẩm: onehub-invest, lệnh đo độ đúng cách đọc tin (PL9) — chân sản phẩm: review phân loại F3/§3.5/§0.4
  [SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md], FRAMING §3.4 [SUY-TỪ-REPO: docs/product/FRAMING.md],
  bảng nhãn PL7 [SUY-TỪ-REPO: db/migrations/054_labels.sql] · chân ngành: khoảng Wilson cho tỉ lệ nhị thức
  [NGÀNH: Wilson score interval, Wilson 1927; dùng làm cận dưới trong đánh giá bộ phân loại].
- Preset: test-matrix (bài toán là phủ đủ không gian ô chấm và ca nhãn).

## Trục

- Trục A — trường × nhóm: listing_intent | kind | property_type | project | building (A) · price_min_vnd |
  price_max_vnd | area_m2 | bedrooms (B) [thước CE: CHECK `field` của 054 + bảng F3]
- Trục B — trạng thái ô: pass | fail | skip «chưa có nhãn người» | skip «chưa có cách đọc» [thước CE: F3 + câu giao
  «ô bỏ qua có tên»]
- Trục C — ca nhãn vàng: một người | đồng nhãn | bất đồng | mất chữ | khác lát | khác split [thước CE: CHECK/UNIQUE
  của 054, F5 hai người]
- Trục D — nguồn vàng × đường ra: nhãn người → dq_check_results | nhãn người → --dry | tập mẫu → in [thước CE: §3.5,
  PL8 design]

## Core (≤20%)

1. Mốc Wilson của bảng F3 theo hai chiều — mọi quyết định tự áp dựa vào nó (AC-1).
2. Ô đủ ở tat-ca kể cả khi 0 nhãn — hôm nay lát có 0 nhãn, đây là trạng thái thật (AC-6).
3. Bất đồng bị loại, không đoán (AC-5).
4. Không định danh người gắn lên cloud qua dq_check_results (AC-7).
5. Tập mẫu không chạm DB (AC-8).

## Later

- Cách đọc E1 luật / LLM / Kev (khi có hàm chạy được).
- Nhóm C (chưa có trường nhãn).
- Chạy trong CI khi parser đổi; đo lại hằng tuần, tự hạ ô.

## Never

- Đa số phiếu khi hai người khác nhãn — hai người không có đa số.
- Ghi tập mẫu vào bảng — PL8 chốt tập là hàm thuần, ngoài DB.

## Cross-cutting áp mọi ô Core

- Mỗi phép đo âm có đối chứng đỏ ghim thông điệp; ma trận viết trước, số assert = số phần tử.
