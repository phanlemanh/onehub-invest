---
schema_version: 1
feature: resolve-properties tự thử lại có hạn khi Postgres báo deadlock (40P01), không đổi logic resolve
slug: resolve-thu-lai-deadlock
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-10-31T09:35:00Z
design_doc: docs/superpowers/specs/2026-10-31-resolve-thu-lai-deadlock-design.md
---

# Acceptance Contract: resolve-thu-lai-deadlock

## Context

chotot-daily 30/10 ~22:3xZ thoát 1 ở bước `resolve-properties`: Postgres huỷ câu `INSERT INTO property_offers … FROM
sale_offers` của Stage A vì deadlock (40P01) với một phiên giữ khoá view `sale_offers` rồi xin khoá độc quyền
`property_offers` (`pipeline/logs/chotot.log`). Chạy lại thì xanh — lỗi nhất thời làm hỏng cả chuỗi đêm. Hàng chặn việc
nâng S06 lên hai lượt/ngày (gói dữ liệu ra mắt, Mạnh «Giao gói khuyến nghị» 31/10).

Source input: `opportunity.md` · vùng: `pipeline/resolve-properties.mjs`, `pipeline/lib/thu-lai-deadlock*`,
`pipeline/tests/resolve-properties*`.

## Criteria

- AC-1: Given một câu của resolve bị Postgres trả lỗi mã `40P01` từ 1 đến 3 lần liên tiếp rồi thành công, When resolve
  chạy câu đó, Then câu được chạy lại đúng số lần ấy (số lần chạy = số lần lỗi + 1), kết quả trả về là kết quả của lần
  thành công, và các lần chờ trước mỗi lần chạy lại lần lượt là 500 · 1000 · 2000 ms.
- AC-2: Given câu trả `40P01` 4 lần liên tiếp, When resolve chạy câu đó, Then câu được chạy đúng 4 lần (3 lần thử lại) rồi
  lỗi `40P01` của lần cuối được ném ra nguyên vẹn (cùng `code`, cùng `message`), tổng thời gian chờ là 3500 ms.
- AC-3: Given câu trả lỗi mã khác `40P01` (vi phạm ràng buộc `23505`, cú pháp `42601`, `40001`, `55P03`, lỗi kết nối không
  có mã), When resolve chạy câu đó, Then lỗi được ném ngay ở lần chạy đầu, không chờ, không thử lại.
- AC-4: Given một lần thử lại, When nó xảy ra, Then stderr có đúng một dòng `resolve-properties: deadlock (40P01) ở «<nhãn>»,
  thử lại <k>/3 sau <ms>ms`, nhãn là 40 ký tự đầu của câu SQL đã gộp khoảng trắng; dòng không chứa giá trị tham số nào
  của câu.
- AC-5: Given DB thử có `sale_offers` là view trên `sale_offer_records` (như migration 044) và một phiên thứ hai tạo vòng chờ
  thật — giữ khoá `sale_offers` rồi xin khoá độc quyền `property_offers` — đúng lúc resolve chạy câu
  `INSERT INTO property_offers` đầu tiên, When resolve chạy trọn lượt, Then lượt hoàn tất không ném lỗi, phiên thứ hai cũng
  commit được, và `properties`, `property_offers`, `property_candidates` sau lượt bằng kết quả một lượt sạch trên cùng mồi
  (so theo khoá nghiệp vụ, bỏ id và mốc giờ).
- AC-6: Given cùng vũ đạo của AC-5, When resolve chạy với thử lại tắt (`lan: 0`), Then resolve ném lỗi `40P01` — chứng vòng
  chờ dựng được là deadlock thật — và với thử lại bật, Postgres đã trả `40P01` cho resolve ít nhất một lần trong lượt
  (đếm thử lại ≥ 1).
- AC-7: Given mã nguồn `pipeline/resolve-properties.mjs` sau vòng, When đọc tĩnh, Then tập chữ SQL resolve gửi đi (gộp khoảng
  trắng) bằng đúng tập của bản base `82a53e0a`, và không còn lời gọi `c.query(` trực tiếp nào — mọi câu đi qua bộ thử lại.
- AC-8: Given lượt resolve kết thúc, When có ít nhất một lần thử lại, Then stdout có thêm đúng một dòng
  `resolve-properties: thử lại sau deadlock <n> lần` với n bằng tổng số lần thử lại; lượt không thử lại lần nào thì stdout
  chỉ có hai dòng `Stage A: …` và `Stage B: …` như trước vòng.
- AC-9: Given DB thử và một phiên thứ hai tạo deadlock thật với lượt resolve, When chạy điểm vào CLI thật
  `node pipeline/resolve-properties.mjs` (DATABASE_URL trỏ DB thử, không tiêm gì), Then tiến trình thoát 0, stderr có dòng
  `… thử lại 1/3 sau 500ms`, stdout có dòng tổng kết của AC-8; và khi mồi gây một lỗi mã khác 40P01, tiến trình thoát 1 với
  thông điệp lỗi gốc trên stderr và không có dòng thử lại nào.

## Coverage

Trục (quét hình thái, preset test-matrix):
- Số lần 40P01 liên tiếp: 0 · 1 · 2 · 3 · 4 (vượt trần) → AC-1, AC-2.
- Loại lỗi: 40P01 · mã Postgres khác (23505, 42601, 40001, 55P03) · lỗi không mã (kết nối) → AC-1, AC-3.
- Mức dựng: client giả · deadlock thật trên DB thử · điểm vào CLI thật · đọc tĩnh → AC-1..AC-4, AC-5/AC-6, AC-9, AC-7.
- Vết: stderr mỗi lần thử lại · stdout tổng kết · kết quả bảng → AC-4, AC-8, AC-5.
- Bất biến logic: chữ SQL · kết quả lượt có deadlock = lượt sạch → AC-7, AC-5.
- Thước CE: mọi ô của bảng trục có ít nhất một AC; ô «thử lại tắt» là đối chứng đỏ của mức dựng thật (AC-6).

## Out of scope

- OOS-1: `pipeline/sync-cloud.mjs` — đọc local trong giao dịch READ ONLY, là phía nạn nhân của cùng dáng; giám sát duyệt bỏ khỏi
  vùng (P3-134).
- OOS-2: Thử lại cho mã khác 40P01 (40001 serialization, 55P03 lock_not_available, 53300 hết kết nối).
- OOS-3: Thử lại cả lượt hay cả giao dịch — resolve không có giao dịch tường minh; mỗi câu tự commit và an toàn khi chạy lại.
- OOS-4: Sửa phía gây khoá (DDL áp lại migration trên DB dùng chung) hay đổi thứ tự khoá của resolve.
- OOS-5: Các bước khác của chotot-daily và `scripts/chotot-daily.sh`.

## Đường đo

Ngưỡng ở `opportunity.md` (Cổng Đáng): SỐNG = «deadlock dựng thật trên DB thử → resolve thử lại và hoàn tất, lỗi khác vẫn
hỏng ngay; logic resolve không đổi».
- «deadlock dựng thật → hoàn tất» — itest DB thử; AC-5, AC-6 bảo đảm.
- «lỗi khác vẫn hỏng ngay» — unit + CLI; AC-3, AC-9.
- «logic resolve không đổi» — đọc tĩnh + so bảng; AC-7, AC-5.
- «không thử lại vô hạn» (dòng CHẾT) — AC-2.
