# Quét hình thái — tap-nhan-mau-ocp1 (preset test-matrix)

## Ngữ cảnh
- Sản phẩm: onehub-invest, tập tin mẫu có đáp án cho PL9 — chân sản phẩm: bảng trường PL7
  `[SUY-TỪ-REPO: docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md]`, sổ từ vựng
  `[SUY-TỪ-REPO: pipeline/lib/vocab.generated.mjs]`, chữ tin thật của lát (DB local, chỉ đọc) · chân ngành: tập dữ
  liệu tổng hợp có đáp án theo dựng cho đánh giá trích xuất (khuôn + bơm giá trị) `[NGÀNH: synthetic data from
  templates — vd bộ sinh dữ liệu của Snorkel/Faker dùng cho kiểm thử trích xuất]`.

## Trục
- Trục A trường × trạng thái: 9 trường PL7 × {nêu, không nêu} [thước CE: bảng trường PL7]
- Trục B dạng viết: giá {tỷ phẩy, tỷ chấm, «x tỷ y», triệu, VND đủ số, khoảng} · diện tích {m2, m², m} · phòng ngủ
  {PN, ngủ, N} · dự án {tên đủ, viết tắt, tên thương hiệu} [thước CE: 25 tin lát đọc 30/10 + `parsePost`]
- Trục C ý định × loại tin: {offer, inquiry, not_listing} × {sale, rent_lt} [thước CE: sổ từ vựng]
- Trục D đường ra: hàm · JSONL · DB [thước CE: bài học L19]

## Core
1. A × B đủ ô có nghĩa (AC-2, AC-4) — đáp án theo dựng là lý do tồn tại của tập.
2. C đủ sáu tổ hợp có nghĩa (not_listing × kind = không nêu) (AC-4).
3. D: hàm + JSONL tất định, DB = 0 đường (AC-1, AC-7, AC-8).
4. Khuôn từ tin thật + khử định danh (AC-5, AC-6).

## Later
- Phân bố dạng viết theo tần suất tin thật (đo tần suất trên lát rồi lấy mẫu theo đó).
- Lát khác, nguồn khác (S05/S06).

## Never
- Dạng viết hai cách hiểu («5,5x tỷ», «1N+1», «Studio», giá không đơn vị) — đáp án phải theo quy ước gắn nhãn của
  đội, chưa có (Hỏi-2).
- Ghi tập mẫu vào stg/canonical — đúng đường L19.

## Cross-cutting áp mọi ô Core
- Tất định theo seed; không định danh; dấu `mau` trên mọi tin.
