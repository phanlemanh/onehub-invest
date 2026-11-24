---
schema_version: 1
feature: Lượt 00:00 nạp S03 có trần tổng 6 giờ và một mốc dừng sạch cho bước đọc gộp suy từ trần tổng thực, chừa chỗ cho enrich — phần A (phía trên mốc làn) của lưới chia trần
slug: tran-tong-luot-dem-va-tran-doc-gop
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-24-tran-tong-luot-dem-va-tran-doc-gop-design.md
---

# Acceptance Contract: tran-tong-luot-dem-va-tran-doc-gop

## Context

Hàng HT13 (GS cắt 24/11, dãy U1). Lượt 00:00 của `scripts/zalo-import-daily.sh` đêm nào cũng TIMEOUT ở trần tổng 14400 s:
bước đọc gộp gọi model tuần tự (~7,2 s/lời × ~2.900 lời) ăn hết trần, đồng hồ tổng TERM cả lượt, enrich đứng sau không chạy
từ 21/11. Việc chia trần (GIAO claudedp-2311-5) chạm cả hai phía mốc «Từ đây trở xuống là làn Claude», luật làn
(JST-AC-8) chỉ cho một nhánh sửa một phía, nên tách hai nhánh. Hồ sơ này nghiệm thu nhánh A của ZCode
(`zcode/s03-nhap-chia-tran` @a68e15d18, phía TRÊN mốc), gộp trước; nhánh B (HT12, đồng hồ riêng + mã 75 đi tiếp) đứng
trên nó, hồ sơ riêng.

Hành vi nhánh A: trần tổng lượt 00:00 mặc định 21600 s; tuổi khoá theo cùng trần; biến `ZALO_IMPORT_TRAN_TONG` thắng mặc
định (plist đêm 24→25/11 đặt 32400 một đêm, lời Mạnh). Trần đọc gộp = trần tổng − (trần nạp + 600) − 3000 (chỗ cho
enrich); `DOC_GOP_TRAN_GIAY` = trần đọc gộp − 300, sàn 60, được export cho bước đọc gộp (hợp đồng dừng sạch với P3/HT6).
`ZALO_IMPORT_TRAN_DOC_GOP` tường minh lớn hơn chỗ còn thì bị kẹp kèm một dòng JOB WARN. Lượt nhanh không đổi.

## Acceptance Criteria

- **AC-1** Given lượt 00:00 trên bản sao script không đặt biến trần, Then đồng hồ tổng nhận `21600 10800`, dòng khai trần
  lúc khởi động nêu `lượt ≤21600s`, và hai chỗ đặt mặc định trần tổng trong script (tuổi khoá, đồng hồ) cùng số 21600.
  Đối chứng cùng fixture: bản sao trả trần tổng về 14400 → đỏ ghim dòng khai trần.
- **AC-2** Given khoá nạp của chủ thật còn sống (pid sống, chữ ký khớp) lấy lúc 5 giờ trước, When lượt nhanh chạy, Then khoá
  không bị gỡ, lượt nhanh nhường («⏭ bỏ lượt»); khoá 7 giờ (quá trần 6 giờ) thì bị gỡ và lượt nhanh chạy. Đối chứng: bản
  sao để tuổi khoá ở 14400 → đỏ «khoá 5h của lượt thật vẫn còn chủ».
- **AC-3** Given `ZALO_IMPORT_TRAN_TONG=32400` (biến của plist đêm 24/11), Then biến thắng mặc định: đồng hồ tổng nhận
  `32400 16200`, dòng khai trần nêu `đọc gộp ≤27000s (dừng sạch ở 26700s) · lượt ≤32400s`, bước đọc gộp nhận
  `DOC_GOP_TRAN_GIAY=26700`. Các biến trần nhỏ (`TRAN_TONG=100`, kèm `CANH_BAO=7`) cũng thắng.
- **AC-4** Given trần tổng T bất kỳ trong {mặc định 21600, 32400, 6000}, When lượt 00:00 chạy, Then mốc dừng sạch M mà bước
  đọc gộp nhận thoả T − M ≥ (trần nạp + 600) + 2400 — đọc gộp tự dừng đủ sớm cho enrich — và enrich chạy sau đọc gộp. Mặc
  định M = 15900; T = 6000 → đọc gộp co về 600, M = 300. Đối chứng: bản sao bỏ phần chừa cho enrich (`CHUA_ENRICH=0`) →
  đỏ «đọc gộp dừng quá muộn».
- **AC-5** Given `ZALO_IMPORT_TRAN_DOC_GOP` đặt tường minh, Then: 1200 → bước nhận 900; 30 → sàn 60; lớn hơn chỗ còn (trần
  tổng mặc định) → kẹp về 16200 (bước nhận 15900) kèm một dòng `JOB WARN [zalo-import-daily] trần đọc gộp … kẹp về 16200s`. Đối chứng:
  bản sao bỏ chỗ kẹp → đỏ «phải được kẹp và báo»; bản sao không export biến → bước nhận `KHONG_DAT`, đỏ «không nhận được».
- **AC-6** Given lượt nhanh (`--luot-nhanh`), Then trần giữ 2400 s, một đồng hồ, dòng khai trần không nhắc đọc gộp.
- **AC-7** Given chưa có nhánh B: bước đọc gộp giả thoát 75 (dừng sạch), Then enrich VẪN chạy, lượt thoát 75 kèm JOB FAIL
  (đỏ giả tới khi HT12 vào main — ghi Known limits). Given lượt lành, Then thoát 0, thứ tự bước đọc gộp rồi enrich, không
  dòng FAIL/WARN, không còn tiến trình đồng hồ sau khi lượt thoát.
- **AC-8** Given cây của nhánh, When chạy lưới hồi quy lượt nạp (zalo-import-tran, zalo-import-tran-zcode, zalo-import-job
  gồm PL34-AC-4 tập 15 tệp, zalo-import-job-nhe, zalo-import-job-lan, enrich-buoc-job, job-step-thoi-luong gồm JST-AC-8 luật
  một-phía-mốc, job-exit), Then tất cả thoát 0; `pipeline/cron/` không đổi so với origin/main.
- **AC-9** Given thư mục `ap-may-thu/` của hồ sơ, Then README có đủ năm mục — lệnh áp (gộp + pull, có hiệu lực ở lượt 00:00
  kế, không nạp lại plist), số chạy thử, sao lưu trước (sha checkout chính + byte log), cách lùi (`git revert`), lệnh kiểm
  sau chạy HAI sáng (đêm biến 32400, rồi đêm mặc định với `--tran 21600`) — và lệnh kiểm sau `kiem-sau.sh`, trên log mẫu rút
  từ đầu ra thật của bản sao script, chấm đúng lượt 00:00 mới nhất trong log nối nhiều lượt: ĐẠT khi trong ĐÚNG lượt ấy có
  `bước enrich-run`, không TIMEOUT, bước trước đọc gộp ≤ trần nạp + 600 s, bước sau đọc gộp tới hết enrich ≤ 3000 s; KHÔNG
  ĐẠT khi lượt mới bị cắt dù lượt cũ trước nó có enrich, khi phần sau đọc gộp vượt 3000 s, khi `--tran 21600` gặp lượt 32400,
  khi chưa lượt nào chạy mã mới; một TIMEOUT của lượt nhanh sau lượt 00:00 không làm lượt 00:00 thành KHÔNG ĐẠT.

## Out of scope

- Nhánh B (HT12): đồng hồ riêng của bước đọc gộp, mã 75 đi tiếp không JOB FAIL — hồ sơ `doc-gop-dong-ho-rieng-trong-luot-dem`.
- Song song hoá bước đọc gộp trong `pipeline/doc-gop-hang-ngay.sh` (HT6, P3) và bước ấy tôn trọng `DOC_GOP_TRAN_GIAY`.
- `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh` vẫn chấm ngưỡng 14400 (hồ sơ đã ký) — đổi theo hàng
  riêng, không sửa hồ sơ đã ký trong vòng này.
- Đêm 24→25/11 trần 32400: đọc gộp chạy tới ~07:25 VN, chồng S06 05:30 (chung DB, khác khoá) và lượt nhanh từ 07:00 (khoá nạp
  đã nhả trước đọc gộp) — chưa đo va chạm DB; một đêm, GS gỡ biến 09:35 VN 25/11.
- `ZALO_IMPORT_TRAN_DOC_GOP` không phải số thì phép so `-gt` lỗi — biến chỉ người vận hành đặt.
- `scripts/au3-nap-bao-loi/acceptance.mjs` đỏ sẵn y như main; `zalo-import-job-khoa.itest.mjs` cần DB thử (không thuộc lưới
  AC-8 vì không chạm đường khoá đổi trong nhánh — tuổi khoá đo ở AC-2).

## Coverage

- Trục nguồn trần tổng: mặc định · biến lớn (32400) · biến nhỏ (6000, 100) [thước CE: plist đêm 24/11 + ca trần nhỏ của #519]
  — AC-1, AC-3, AC-4.
- Trục người dùng trần tổng: đồng hồ lượt · tuổi khoá · trần đọc gộp suy ra [thước CE: ba chỗ đọc `TRAN_TONG` trong script]
  — AC-1, AC-2, AC-4.
- Trục trần đọc gộp: suy · tường minh nhỏ · tường minh quá sàn · tường minh lớn hơn chỗ còn [thước CE: nhánh if của script]
  — AC-4, AC-5.
- Trục loại lượt: 00:00 · nhanh [thước CE: cờ `--luot-nhanh`] — AC-6.
- Trục kết cục bước đọc gộp: lành · 75 dừng sạch [thước CE: hợp đồng mã 75 với HT6] — AC-7.
- Trục hồi quy: lưới test cũ của tệp bọc + luật một-phía-mốc [thước CE: danh sách lệnh LL chạy] — AC-8.

## Đường đo

Hàng gỡ một sự cố vận hành (enrich không chạy từ 21/11). Con số trên máy thu: lượt 00:00 đầu tiên sau áp có dòng
`JOB STEP [zalo-import-daily] bước enrich-run` (đêm 21→24/11: 0 dòng) và dòng khai trần nêu trần đọc gộp; đo bằng lệnh kiểm
sau ở `ap-may-thu/README.md` (AC-9). Trong vòng: AC-4, AC-7 đo trên bản sao.

## Notes

- Bản sửa do ZCode viết (LL soát ĐẠT 24/11, đột biến LL: bỏ chừa enrich 6 đỏ, bỏ kẹp 1 đỏ, bỏ export 6 đỏ, bỏ «−300» 7
  đỏ, trả trần 14400 6 đỏ). Vòng này thêm ca quan hệ AC-4 (HT13, `scripts/zalo-import-tran.test.mjs`) và hồ sơ.
