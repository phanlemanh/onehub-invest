---
schema_version: 1
feature: Bước đọc gộp của lượt 00:00 có đồng hồ riêng và mã 75 «dừng sạch» đi tiếp tới enrich — phần B (phía dưới mốc làn) của lưới chia trần
slug: doc-gop-dong-ho-rieng-trong-luot-dem
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-24T06:19:34Z
design_doc: docs/superpowers/specs/2026-11-24-doc-gop-dong-ho-rieng-trong-luot-dem-design.md
---

# Acceptance Contract: doc-gop-dong-ho-rieng-trong-luot-dem

## Context

Hàng HT12 (GS cắt 24/11, dãy U1). Phần B của lưới chia trần (GIAO claudedp-2311-5), nhánh ZCode
`zcode/s03-nhap-chia-tran-buoc` @03fb68bf2, đứng thẳng trên main be765e6a5 (#533, HT13 — phần A). Nhánh chỉ sửa phía DƯỚI
mốc «Từ đây trở xuống là làn Claude» của `scripts/zalo-import-daily.sh`: hàm `doc_gop_run` + đồng hồ riêng
`canh_gio_buoc`, dòng gọi bước đọc gộp `job_run … doc-gop-hang-ngay` → `doc_gop_run`. HT13 cấp `TRAN_DOC_GOP` (trần
đọc gộp suy từ trần tổng) và `DOC_GOP_TRAN_GIAY` (mốc dừng sạch). Tệp test đổi theo: ma trận AC-7 của
`scripts/zalo-import-tran.test.mjs` nay ghim hai đồng hồ của lượt 00:00; hai lưới cũ tìm dòng gọi mới.

Hành vi nhánh B: bước đọc gộp chạy nền dưới đồng hồ riêng (trần `TRAN_DOC_GOP`, TERM mỗi giây, KILL sau 20 s, theo dấu cả
cây con cháu); hết trần thì cắt đúng bước, chuỗi chạy tiếp tới enrich; mã 75 của bước (dừng sạch theo hợp đồng HT6) là đi
tiếp — dòng JOB WARN, không JOB FAIL, không vào mã lượt; mã khác vẫn là lỗi như `job_run`.

## Acceptance Criteria

- **AC-1** Given bước đọc gộp treo và trần đọc gộp 2 s (trần tổng 40 s), When lượt 00:00 chạy, Then đồng hồ riêng in
  `TIMEOUT: bước đọc gộp vượt trần 2s`, bước ghim `mã 143` kèm JOB FAIL, enrich VẪN chạy, đồng hồ tổng không bắn, lượt
  thoát 143. Đối chứng: bản sao bỏ đồng hồ riêng (trần tổng 8 s) → đỏ ghim `(1) dòng TIMEOUT của đồng hồ riêng bước đọc gộp` hoặc `(1) CA LÕI` (bước treo tới trần tổng, enrich không tới lượt).
- **AC-2** Given bước đọc gộp theo hợp đồng HT6 làm 2/6 bài rồi thoát 75, When lượt 00:00 chạy, Then ghim `mã 75`, một dòng
  `JOB WARN … hết giờ dừng sạch (mã 75) — đi tiếp`, không dòng JOB FAIL của bước, enrich chạy, lượt thoát 0, bước nhận
  `DOC_GOP_TRAN_GIAY=15900`; lượt sau gọi lại bước và bước giả (giữ sổ theo hợp đồng HT6) đọc tiếp đúng 3..6 — B không làm mất phần dở; việc bước THẬT giữ sổ không mất không lặp là của HT6. Đối chứng: bản sao coi 75 là lỗi → đỏ
  «75 là dừng sạch, không phải lỗi».
- **AC-3** Given bước thoát 75 ngay, Then lượt thoát 0 và không có dòng JOB FAIL nào; given bước thoát 3, Then lượt thoát 3
  kèm `JOB FAIL … doc-gop-hang-ngay mã 3` — mã khác 75 vẫn là lỗi như `job_run`.
- **AC-4** Given bước gọi node con phớt TERM, When đồng hồ bước bắn, Then bash của bước chết (mã 143), node con bị KILL —
  0 tiến trình còn lại sau khi lượt thoát, enrich chạy, nơi gọi chạy tiếp dưới 12 s (không chờ hết ân hạn 20 s). Đối
  chứng: bản sao bỏ SIGUSR1 → đỏ «không chờ ân hạn 20s».
- **AC-5** Given chạy tay qua `bash -c` (script không trưởng nhóm) và trần tổng 6 s bắn giữa lúc bước phớt TERM, Then
  người gọi sống, 0 tiến trình của bước còn sau khi lượt thoát. Đối chứng a: đồng hồ bước không bỏ qua SIGTERM → đỏ «sống
  mồ côi»; b: bỏ KILL ân hạn → đỏ «sống mồ côi».
- **AC-6** Given lượt 00:00 trên bản sao với node giả ghi tham số đồng hồ, Then lượt có đúng HAI lần gọi đồng hồ theo thứ
  tự: tổng rồi của bước — mặc định `21600 10800` rồi `16200`; `TRAN_TONG=32400` → `32400 16200` rồi `27000`;
  `TRAN_TONG=100` (kèm hoặc không `CANH_BAO=7`) → đồng hồ bước `60`; lượt nhanh vẫn MỘT đồng hồ `2400 1200`.
- **AC-7** Given cây nhánh B, Then ca quan hệ của HT13 (mốc dừng sạch M thoả T − M ≥ trần nạp + 600 + 2400 với T ∈
  {21600, 32400, 6000}, enrich chạy) và mọi ca phần A trong `zalo-import-chia-tran-zcode.test.mjs` vẫn xanh; lượt 00:00 lành
  thoát 0, không FAIL/WARN, đọc gộp rồi enrich, 0 đồng hồ còn lại.
- **AC-8** Given cây nhánh B, When chạy lưới hồi quy lượt nạp (zalo-import-tran, zalo-import-tran-zcode, zalo-import-job gồm
  PL34-AC-3/4, zalo-import-job-nhe, zalo-import-job-lan, enrich-buoc-job, job-step-thoi-luong gồm JST-AC-8 luật một-phía-mốc,
  job-exit) và hai nửa suite pipeline, Then tất cả thoát 0; `pipeline/cron/` không đổi so với origin/main.
- **AC-9** Given thư mục `ap-may-thu/`, Then README có đủ năm mục (lệnh áp · số chạy thử · sao lưu trước · cách lùi · lệnh
  kiểm sau) và `kiem-sau.sh`, trên log mẫu rút từ đầu ra thật của bản sao script, chạy bộ kiểm HT13 rồi chấm lượt 00:00
  mới nhất: ĐẠT khi bước đọc gộp xong trọn, dừng sạch 75 có JOB WARN, hoặc bị đồng hồ bước cắt — miễn enrich chạy; KHÔNG
  ĐẠT khi lượt mới nhất còn `JOB FAIL … doc-gop-hang-ngay mã 75` (dù lượt cũ trước nó đạt), khi mã 75 thiếu dòng WARN dừng
  sạch, khi `--tran 21600` gặp lượt trần khác; lượt cũ còn FAIL rồi lượt mới đạt thì ĐẠT. Log mẫu trần 32400 (đêm đầu sau áp): `--tran 32400` ĐẠT, `--tran 21600` KHÔNG ĐẠT; README ghi `--tran` theo trần plist từng đêm.

## Out of scope

- HT6 (P3): bước `pipeline/doc-gop-hang-ngay.sh` tôn trọng `DOC_GOP_TRAN_GIAY` và thoát 75. Chưa có HT6 thì đêm nào đọc
  gộp chưa xong cũng bị đồng hồ bước cắt (mã 143, JOB FAIL, lượt thoát 143) — enrich vẫn chạy; đây là đường dự phòng của B,
  không phải lỗi áp.
- Bước đọc gộp THẬT giữ sổ đã-đọc để lượt sau không mất, không lặp bài khi thoát 75: hồ sơ HT6 tự đo; AC-2 chỉ đo B gọi lại bước
  và không xoá phần dở, trên bước giả.
- Phần A (HT13, đã ký máy): trần tổng, tuổi khoá, công thức trần đọc gộp, kẹp + JOB WARN — chỉ kiểm hồi quy ở AC-7.
- Trần đọc gộp đặt tường minh dưới 360 s: mốc dừng sạch có sàn 60 s của A, nên với trần rất nhỏ mốc dừng sạch nằm SAU đồng
  hồ bước (vd trần 2 s → dừng sạch 60 s); chỉ người vận hành hoặc test đặt giá trị ấy.
- Không đổi plist; đêm 24→25/11 plist cài sẵn `ZALO_IMPORT_TRAN_TONG=32400`, `ENRICH_LIMIT=0` (lời Mạnh).

## Coverage

- Trục kết cục bước đọc gộp: xong trọn · dừng sạch 75 · thoát lỗi khác · treo tới trần · phớt TERM [thước CE: nhánh
  `rc` của `doc_gop_run` + hai đường bắn của `canh_gio_buoc`] — AC-1, AC-2, AC-3, AC-4, AC-7.
- Trục cách gọi lượt: launchd (trưởng nhóm) · chạy tay `bash -c` [thước CE: đồng hồ tổng chỉ trúng con trực tiếp] — AC-4,
  AC-5.
- Trục nguồn trần đọc gộp: mặc định · biến trần tổng lớn (32400) · biến trần tổng nhỏ (100) · lượt nhanh [thước CE: ma
  trận AC-7 của #519] — AC-6.
- Trục hồi quy: phần A + lưới tệp bọc + luật một-phía-mốc + suite pipeline [thước CE: danh sách LL chạy 24/11] — AC-7,
  AC-8.
- Trục kiểm sau áp: lượt mới đạt · lượt mới còn mã A · mã 75 thiếu WARN · nhiều lượt nối · trần 32400 đêm đầu · sai trần [thước CE: log launchd
  nối nhiều lượt] — AC-9.

## Đường đo

Hàng gỡ sự cố vận hành (audit 24/11 §13: đêm 24/11 phải nâng tay trần tổng). Con số trên máy thu: lượt 00:00 đầu tiên sau áp
có `JOB STEP [zalo-import-daily] bước enrich-run` và KHÔNG có `JOB FAIL … doc-gop-hang-ngay mã 75`; đo bằng lệnh kiểm sau ở
`ap-may-thu/README.md` (AC-9). Trong vòng: AC-1, AC-2 đo trên bản sao.

## Notes

- Bản sửa do ZCode viết (LL soát ĐẠT 24/11, đột biến LL ở bản d74798312: coi 75 là lỗi → 2 đỏ; gọi lại `job_run` → 9 đỏ;
  bản 03fb68bf2 là rebase lên main sau #533, logic không đổi).
