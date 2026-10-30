# Kế hoạch thi công — eval-classify-wilson (PL9, T2)

> For agentic workers: thực thi tuần tự trong vòng chính (superpowers:executing-plans). Mỗi phép đo mới chạy cặp hai
> chiều trên cùng fixture (xanh trên bản thật, đỏ trên bản chép hỏng), thông điệp ghim đúng chữ trong `evals.yaml`.

**Mục tiêu:** lệnh `eval:classify` chấm độ đúng từng ô (cách đọc × trường × phân khúc) theo cận dưới Wilson so ngưỡng
F3, ghi `dq_check_results`; chấm được tập mẫu PL8 từ tệp. Hợp đồng `_acceptance/eval-classify-wilson/contract.md` (Mạnh
duyệt 30/10, Hỏi-1/2 theo khuyến nghị). Thiết kế `docs/superpowers/specs/2026-10-30-eval-classify-wilson-design.md`.

**DB:** ghi chỉ trên DB thử `oneinvest_p4_ecw` (`db/db-thu.sh`, dựng mới mỗi lượt đo). Trên `oneinvest` chỉ chạy `--dry`
(giao dịch READ ONLY). Executor `ecw_*`: thêm dòng vào `_acceptance/config.yaml` qua yêu cầu `cham-tep`.

## Task 1 — Lõi thuần

- Files: `pipeline/lib/eval-classify.mjs`
- `wilsonDuoi`, `NHOM_TRUONG`/`NGUONG`, `soKhop`, `CACH_DOC.parser` (nạp `parsePost`, `maToaCan` của
  `transform-zalo.mjs`), `phanKhuc`, `gopNhan` (nhãn nhiều người → vàng | bất đồng), `chamO`, `veDetail` (12 khoá),
  `docTapMau` (JSONL + kiểm dòng đầu), `docNhanNguoi(client, {lat, split})` (BEGIN READ ONLY), `ghiKetQua(client, ô, meta)`
  (BEGIN … INSERT INTO dq_check_results … COMMIT, lỗi → ROLLBACK).
- Không nạp `lib/tap-mau.mjs`.
- Phục vụ: E1, E2, E3, E4, E5, E6, E7

## Task 2 — Lệnh

- Files: `pipeline/eval-classify.mjs`, `pipeline/package.json` (script `eval:classify`), `pipeline/CLAUDE.md` (một dòng)
- `--lat <lát> [--split test|dev] [--dry]` | `--tap-mau <tệp>`; cờ lạ → thoát 1. Rẽ nhánh `--tap-mau` TRƯỚC khi nạp/mở
  kết nối `pg` (import động). In bảng ô; ghi khi không `--dry`.
- Phục vụ: E7, E8

## Task 3 — Test pipeline (E1, E2, E3, E4, E6, E8)

- Files: `pipeline/lib/eval-classify.test.mjs`
- Ma trận viết trước; đối chứng đỏ bằng bản chép lib ở thư mục tạm (cùng thư mục với bản chép `transform-zalo.mjs` và
  phụ thuộc của nó — hoặc chép lib vào `pipeline/lib/` tên tạm rồi xoá): z = 1,645 → 'WILSON LECH MOC 99/100'; tỉ lệ
  thô → 'TRANG THAI THEO TI LE THO'; area_m2 nhóm A → 'NHOM TRUONG LECH area_m2'; diện tích tuyệt đối → 'DIEN TICH
  KHONG CHO LECH 3%'; giữ đuôi căn → 'TOA CON DUOI CAN'; price_max null → 'GIA MOT DAU'; bỏ ô n = 0 → 'THIEU O
  tat-ca|parser|listing_intent'; CLI mở pg trước → 'TAP MAU MO KET NOI DB'.
- Verify: `node --test pipeline/lib/eval-classify.test.mjs`

## Task 4 — Bên đọc ở app

- Files: `app/src/lib/dq-labels.ts`, `app/tests/dq-eval-classify-label.test.tsx`, `app/tests/eval-classify-mien.test.tsx`,
  `CONTEXT.md`
- TEN_KIEM `eval-classify` → «Độ đúng cách đọc»; đối tượng `<lát>|<phân khúc>|<cách đọc>|<trường>`; chi tiết 12 khoá.
  Miền giá trị: giá trị parser qua `chuanHoaLuot` không đổi (đỏ: area '64,5' → 'GIA TRI NGOAI MIEN NHAN area_m2').
- Verify: `cd app && node --import tsx --test tests/dq-eval-classify-label.test.tsx tests/eval-classify-mien.test.tsx`
- Phục vụ: E4b, E9

## Task 5 — Probe DB + phạm vi

- Files: `_acceptance/eval-classify-wilson/probes/nap-nhan.tsx`, `probes/db.mjs`, `probes/on12.sh`, `_acceptance/config.yaml`
- `nap-nhan.tsx` (chạy ở app): fixture stg + items viết tay, nhãn qua `chuanHoaLuot` + `ghiNhan`, COMMIT; `db.mjs`: E5,
  E7 (tiến trình con ghi thật, `--dry`, ghiKetQua lỗi ô thứ 5, quét định danh, quét mã), dọn fixture; `on12.sh`: ON12-AC-5
  trên DB thử + thuật ngữ CONTEXT.md.
- Phục vụ: E5, E7, E9b, E10
