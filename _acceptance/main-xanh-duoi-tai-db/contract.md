---
schema_version: 1
feature: Hai test DB (agent AC-10, app the-duyet «public đã bị chạm») không đỏ theo tải của DB local dùng chung, không nới assertion
slug: main-xanh-duoi-tai-db
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-01T02:20:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-01-main-xanh-duoi-tai-db-design.md
---

# Acceptance Contract: main-xanh-duoi-tai-db

## Context

main đỏ dưới tải DB local :5433 dùng chung (job S06/đêm ghi cùng lúc), chặn mọi lượt ghim lại của đợt dot0 (#252,
#234, #254). Hai chỗ: agent `enrich-revert.test.ts` AC-10 deadlock khi áp lại 044; app `the-duyet-du-can-cu.test.tsx`
so số dòng public trước/sau. Giám sát giao ưu tiên 0 ngày 01/11.

Vùng: `agent/tests/enrich-revert.test.ts`, `app/tests/the-duyet-du-can-cu.test.tsx`.

## Criteria

- AC-1: Given một phiên khác giữ khoá mà lần áp lại cần, quá hạn chờ khoá, When `apLaiChiuTai` áp câu ấy, Then lần đầu
  hết chờ khoá (55P03) bị lùi về SAVEPOINT, lần sau chạy được khi khoá nhả, giao dịch test vẫn dùng tiếp được; đối chứng:
  cùng tình huống mà áp thẳng (không thử lại) thì ném 55P03.
- AC-2: Given câu SQL lỗi không phải do tải (cú pháp sai, đối tượng đã có), When `apLaiChiuTai` áp nó, Then ném ngay ở
  lần đầu (không chờ lùi, không thử lại) với mã lỗi gốc.
- AC-3: Given AC-10 sau sửa, When chạy, Then mọi kiểm cũ còn nguyên — cấu trúc không đổi, số dòng không đổi, không dòng
  đề xuất trùng, và chiều đỏ «câu không idempotent áp lần hai thì lỗi» vẫn đỏ.
- AC-4: Given một phiên khác ghi dòng không mang dấu lượt vào bảng của lược đồ đang kiểm trong lúc lượt chạy, When
  `publicBiCham` đếm, Then bảng đó đếm 0.
- AC-5: Given lượt ghi vào lược đồ đang kiểm một dòng mang dấu lượt (mã td_/hd9, vai td-, actor machine:td, mã người
  lược đồ tạm), When `publicBiCham` đếm, Then bảng đó đếm ≥ 1 và kiểm cuối lượt đỏ với thông điệp «public đã bị chạm».
- AC-6: Given dòng mang dấu có từ TRƯỚC mốc xid của lượt, When đếm, Then không tính (chỉ dòng sinh/sửa trong cửa sổ lượt).
- AC-7: Given DB local dùng chung ở trạng thái lúc chấm (không dựng tải giả), When chạy `cd agent && npm test` và
  `cd app && npm test` trên nhánh, Then cả hai thoát 0.
- AC-8: Given hai phiên giữ khoá chéo nhau và phía test bị Postgres chọn làm nạn nhân deadlock (40P01), When
  `apLaiChiuTai` áp câu ấy, Then lần đầu bị lùi về SAVEPOINT, lần sau chạy được, giao dịch test dùng tiếp được; đối
  chứng: áp thẳng thì ném 40P01.
- AC-9: Given khoá không bao giờ nhả trong lượt, When `apLaiChiuTai` áp với trần 5 lần, Then sau đúng 5 lần nó ném lỗi
  mang mã gốc (55P03) và số lần đã thử — không trả về im lặng.

## Coverage

Trục (quét hình thái, preset test-matrix):
- Lỗi khi áp lại: hết chờ khoá · deadlock · khoá không nhả (chạm trần) · lỗi khác · không lỗi → AC-1, AC-8, AC-9,
  AC-2, AC-3.
- Dòng trong lược đồ kiểm: không dấu trong cửa sổ · có dấu trong cửa sổ · có dấu ngoài cửa sổ → AC-4, AC-5, AC-6.
- Mức: hàm trong test · ca test thật · cả bộ test module → AC-1/2/4/5/6, AC-3, AC-7.

## Out of scope

- OOS-1: Chạy agent test trên DB riêng dựng từ đầu (đắt, lệch DB thật).
- OOS-2: Bắt lượt XOÁ dòng public có từ trước (bản cũ bắt bằng số dòng nhưng đỏ theo mọi job xoá).
- OOS-3: Sửa job S06/đêm hay khoá chung với nó (làn ZCode/pipeline).
- OOS-4: Các test DB khác có thể cũng nhạy tải — chỉ hai chỗ giám sát đo được đỏ.
