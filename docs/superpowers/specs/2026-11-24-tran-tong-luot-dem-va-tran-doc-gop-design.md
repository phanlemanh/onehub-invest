# Trần tổng lượt đêm và trần đọc gộp — thiết kế (HT13 `tran-tong-luot-dem-va-tran-doc-gop`)

Ngày 2026-11-24 · dãy U1 · hạng T2 · hồ sơ `_acceptance/tran-tong-luot-dem-va-tran-doc-gop/`

## Vấn đề

Lượt 00:00 của `scripts/zalo-import-daily.sh` bị đồng hồ tổng 14400 s TERM mỗi đêm từ 21/11: bước đọc gộp gọi model tuần tự
(~7,2 s/lời × ~2.900 lời) ăn hết trần, enrich đứng sau nó không chạy. Log máy thu đêm 23/11: `TIMEOUT: lượt vượt trần
14400s` sau `xep-hang-gia`, không dòng `bước enrich-run`.

## Hình dạng (đã chốt ngoài vòng)

- GS 24/11: hai nhánh ZCode, hai hồ sơ — A (phía trên mốc làn, hồ sơ này, gộp trước) và B (HT12, phía dưới mốc).
  Căn cứ: luật một-phía-mốc JST-AC-8 (`scripts/job-step-thoi-luong.test.mjs`).
- LL 24/11 (BÁO claudedp-2411-11, -12): trần đọc gộp suy từ trần tổng thực (trần tổng − (trần nạp + 600) − 3000 cho
  enrich), kẹp + JOB WARN khi đặt tường minh lớn hơn chỗ còn — đóng quan sát U1 «hai biến độc lập thì trần tổng nhỏ cắt
  cả lượt trước mốc dừng sạch».
- Mạnh 24/11 (qua GS): plist đêm 24→25/11 đặt `ZALO_IMPORT_TRAN_TONG=32400` một đêm — evals phải có ca biến có mặt.

## Lựa chọn trong vòng

- **Không viết lại mã ZCode.** Vòng nghiệm thu bản a68e15d18; lỗi logic trả LL.
- **Eval dựa trên test của ZCode** (`scripts/zalo-import-chia-tran-zcode.test.mjs`, 15 ca, mỗi ca chính có chiều đỏ) và
  ma trận AC-7 của `scripts/zalo-import-tran.test.mjs`.
- **Thêm một ca QUAN HỆ (AC-4)** ở `scripts/zalo-import-tran.test.mjs`: với T ∈ {21600, 32400, 6000}, mốc M bước đọc gộp
  nhận thoả T − M ≥ (trần nạp + 600) + 2400, enrich chạy; chiều đỏ `CHUA_ENRICH=0`. Lý do: test ZCode ghim con số
  (15900, 26700, 300) — đúng hôm nay nhưng không nói ra lời hứa «đọc gộp dừng đủ sớm cho enrich»; LL đề nghị đo quan hệ.
  2400 = thời lượng enrich đo 21/11 (1.842 s cả bước ở LIMIT 50) cộng dự phòng; ZCode chừa 3000 nên ca xanh với lề 900 s, và bỏ phần chừa thì T − M = 2700 < 4800, đỏ.
- **Thư mục áp (AC-9)** theo khuôn năm thứ của AGENTS.md, lệnh kiểm sau `kiem-sau.sh` đọc lượt 00:00 đầu tiên chạy mã mới.

## Bỏ đặc tả UX

Không chạm giao diện (surface cli).
