# Đồng hồ riêng của bước đọc gộp trong lượt đêm — thiết kế (HT12 `doc-gop-dong-ho-rieng-trong-luot-dem`)

Ngày 2026-11-24 · dãy U1 · hạng T2 · hồ sơ `_acceptance/doc-gop-dong-ho-rieng-trong-luot-dem/`

## Vấn đề

Lượt 00:00 của `scripts/zalo-import-daily.sh` bị đồng hồ tổng cắt mỗi đêm từ 21/11 vì bước đọc gộp ăn hết trần; enrich
đứng sau không chạy (audit 24/11 §13: đêm 24/11 phải nâng tay trần tổng lên 32400 s). HT13 (#533, phần A, đã gộp) nâng
trần tổng lên 21600 s và cấp cho bước đọc gộp một mốc dừng sạch suy từ trần tổng. Còn thiếu hai thứ phía dưới mốc làn:
(1) không có gì cắt RIÊNG bước đọc gộp khi nó không tự dừng (chưa có HT6, hay bước treo) — đồng hồ tổng vẫn cắt cả lượt;
(2) bước dừng sạch thoát 75 thì `job_run` coi là lỗi: JOB FAIL, lượt thoát 75 (đỏ giả, Known limit AC-7 của HT13).

## Hình dạng (đã chốt ngoài vòng)

- GS 24/11: hai nhánh ZCode, hai hồ sơ — A (HT13, phía trên mốc, gộp trước) và B (hồ sơ này, phía dưới mốc, đứng trên A).
  Căn cứ: luật một-phía-mốc JST-AC-8 (`scripts/job-step-thoi-luong.test.mjs`).
- ZCode viết B (claudedp-2311-5, bổ sung 2311-6); LL soát ĐẠT kèm đột biến, rebase lên main sau #533 → @03fb68bf2.

## Lựa chọn trong vòng

- **Không viết lại mã ZCode.** Vòng nghiệm thu bản 03fb68bf2; lỗi logic trả LL (`tin MỞ LẠI`).
- **Eval dựa trên test của ZCode** (`scripts/zalo-import-chia-tran-zcode.test.mjs`: ca (1)–(6) của B, mỗi ca chính có chiều
  đỏ phá đúng nhánh) và ma trận AC-7 của `scripts/zalo-import-tran.test.mjs` (nay ghim trọn dãy đồng hồ của lượt).
- **Không thêm ca đo mới vào mã.** Khác HT13 (thêm ca quan hệ chừa enrich), quan hệ của B — «enrich chạy dù bước đọc gộp
  hết giờ theo đường nào» — đã được ca (1), (2), (5) đo trực tiếp bằng dòng `bước enrich-run` trong cùng lượt, mỗi ca có
  chiều đỏ.
- **Thư mục áp (AC-9)** theo khuôn năm thứ của AGENTS.md; `kiem-sau.sh` GỌI bộ kiểm của HT13 rồi thêm hai điều kiện của B
  (không `JOB FAIL … mã 75`; mã 75 có dòng WARN), log mẫu sinh từ đầu ra thật của bản sao script (hai bản sao đột biến
  cho hai ca KHÔNG ĐẠT), ba lần phá đúng nhánh đã đỏ.
- **Đường dự phòng chưa có HT6 vẫn ĐẠT ở lệnh kiểm sau**: bước bị đồng hồ bước cắt (mã 143, JOB FAIL) nhưng enrich chạy —
  đúng câu «đọc gộp chạy tới trần riêng rồi dừng có ghi» của hàng; lượt thoát 143 là trung thực (bước không xong).

## Bỏ đặc tả UX

Không chạm giao diện (surface cli).
