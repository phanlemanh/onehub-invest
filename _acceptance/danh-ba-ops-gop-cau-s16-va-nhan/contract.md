---
schema_version: 1
feature: Trang một dự án của Danh bạ Ops đọc thuộc tính căn S16 bằng một câu thay hai (bỏ một trong hai lượt dựng view chạy song song — tải DB giảm một nửa, thời gian chờ đo và ghi lại), số ô phủ không đổi; nhãn nút mở hàng tiếng Việt, «Chưa có toà» khi dự án không có toà, trang mã sai riêng có nút «Về danh bạ»; danh sách bỏ bí danh trùng tên và ẩn cột Bậc trên màn hẹp
slug: danh-ba-ops-gop-cau-s16-va-nhan
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, db]
status: verified
approved_by: Mạnh
approved_at: 2026-11-27
design_doc: docs/superpowers/specs/2026-11-27-danh-ba-ops-gop-cau-s16-va-nhan-design.md
---

# Acceptance Contract: danh-ba-ops-gop-cau-s16-va-nhan

## Context

Hàng DA67 (dãy N1), đợt 1 của audit màn Danh bạ 27/11 (Mạnh bấm «Gửi giám sát»; báo cáo ở `research-local/`, gitignored,
mục 4–5). Trang `/ops/registry/<id>` của 5 dự án có toà chạy hai câu thuộc tính S16 song song, mỗi câu dựng lại trọn hai
view (≈3,3–3,4 s); phần riêng của ô phủ chỉ 66 ms. Nhãn «Expand row» lộ ở 15 bảng cây, dự án 0 toà ghi «Mọi toà đã có
căn», mã sai rơi vào 404 của Invest. Danh sách: 329/344 dự án gốc có dòng phụ chỉ nhắc lại tên (DB máy thu 27/11). Chỉ
`app/`, không migration, không đổi `pipeline/`. Thiết kế: `design_doc`.

## Criteria

- AC-1: Given một dự án có toà, When trang dự án đọc thuộc tính căn và ô phủ, Then lớp đọc chạy đúng MỘT câu chạm
  `v_unit_thuoc_tinh` (và một câu chạm `v_s16_gia_cdt`), hai view vẫn nạp `MATERIALIZED`, và số ô phủ (`trong_danh_ba`,
  `co_thuoc_tinh`, `co_gia`, `lan_thu`) đếm ở SQL, không đếm ở TypeScript.
- AC-2: Given DB thử của hồ sơ DA40 (fixture TTC), When đọc lưới và ô phủ qua hàm mới và qua hai hàm cũ (`docThuocTinhCan`,
  `docPhuThuocTinh`, nay là lớp mỏng), Then giá trị từng căn và bốn số ô phủ bằng lệnh đếm độc lập như trước (TTC-AC-9,
  TTC-AC-10 xanh), kể cả ca không căn nào của toà có thuộc tính (ô phủ vẫn ra số, lưới rỗng).
- AC-3: Given DB máy thu (chỉ đọc) và 5 dự án có toà (16, 1, 4, 2, 3), When đọc bằng hàm mới và bằng bản `main` của
  `thuoc-tinh-can.ts`, Then lưới thuộc tính (mọi căn, mọi trường) và ô phủ của từng dự án bằng nhau từng giá trị; dự án 16
  có ô phủ «có» với `trong_danh_ba` > 0.
- AC-4: Given dự án 16 trên DB máy thu, When đo tổng thời gian DB của việc đọc thuộc tính (cộng mọi câu, trung vị 3 lần),
  Then bản mới ≤ 60% bản `main` (bỏ một trong hai lượt dựng view); và thời gian tường của lời gọi đọc (bản `main` gồm
  cả `Promise.all` hai câu) bản mới ≤ 1,1 × bản `main` (không chậm hơn); bốn trung vị in ra evidence. (cross-layer)
- AC-5: Given dự án 0 toà, DB chưa áp 113, hay `ONEHUB_TTC_LOI_THU=1`, When trang dự án tải, Then lần lượt: ô phủ
  «khong-nguon» mà không chạy câu thuộc tính nào; «khong-nguon» không lỗi; Alert «Không tải được thuộc tính căn» có «Thử
  lại» và lưới toà vẫn hiện — như trước vòng này.
- AC-6: Given một bảng cây dùng `DATA_GRID_VI`, When hàng mở được đang đóng hay đang mở, Then nút mở hàng có `aria-label`
  «Mở hàng» hay «Thu gọn hàng», không còn «Expand row»/«Collapse row».
- AC-7: Given trang dự án, When `soToa = 0`, Then chân ô Toà ghi «Chưa có toà»; When có toà chưa có căn, Then «N toà chưa
  có căn»; When mọi toà đã có căn, Then «Mọi toà đã có căn».
- AC-8: Given đường `/ops/registry/<mã>` với mã sai khuôn (`abc`), số không có nút, hay nút không phải dự án gốc, When mở,
  Then trang báo «Không có dự án này trong danh bạ» kèm nút «Về danh bạ» trỏ `/ops/registry`, không có nút «Xem thị
  trường Việt Nam» của cổng Invest. (cross-layer)
- AC-9: Given một dự án gốc có bí danh mà `fold(bí danh) = fold(tên)` và bí danh khác, When danh sách vẽ dòng phụ, Then dòng
  phụ bỏ bí danh trùng tên, giữ bí danh khác (tối đa 3), ô tìm vẫn khớp theo mọi bí danh; trên DB máy thu số dự án gốc có
  dòng phụ nhắc lại tên từ 329 về 0.
- AC-10: Given danh sách `/ops/registry`, When khổ 375 px, Then cột Bậc ẩn và các cột Toà, Căn, Tin đang rao hiện; When từ
  768 px, Then cột Bậc hiện.

## Coverage

Quét theo bốn trục (bỏ bộ quét hình thái cho phần nhãn — mỗi nhãn một ca; xem sổ `descope`):
- Trục **đường đọc S16** {một câu mới, hai lớp mỏng cũ} × **dữ liệu** {fixture DA40, DB máy thu 5 dự án, dự án 0 toà, DB
  chưa 113, lỗi thử}: AC-1, AC-2, AC-3, AC-5.
- Trục **tốc độ** {DB dự án 16, tải trang}: AC-4 (DB, có ngưỡng); tải trang đo ghi nhận ở Đường đo, không ngưỡng.
- Trục **nhãn và trạng thái** {nút mở hàng đóng/mở, ô Toà ba ca, 404 ba loại mã}: AC-6, AC-7, AC-8.
- Trục **danh sách** {bí danh trùng/khác/ô tìm, khổ 375/768}: AC-9, AC-10.
Ai đọc đầu ra phía sau: đội vận hành trên `/ops/registry/**` của máy thu; DA68 (đợt 2) đọc lại `doc.ts`, không đọc lớp S16.

## Đường đo

Không có `opportunity.md` (hàng giám sát cắt từ audit; Cổng Đáng thuộc giám sát). Số trên màn: thời gian tải
`/ops/registry/16` trước → sau (audit đo 9,8–14 s trên dev, máy có tải) — đo bằng Navigation Timing ở eval E13 trên dev
server của worktree với DB máy thu, cùng lượt đo bản `main`; số DB (AC-4) do `probes/so-s16.mts` in. Danh sách
`/ops/registry` không đổi tốc độ ở đợt này (ngoài phạm vi, DA68).

## Out of scope

- Đếm «Tin đang rao» tính sẵn và tốc độ danh sách `/ops/registry` (DA68, đợt 2, có migration).
- Trang dự án tải căn theo toà, ô tìm toà, phân trang trong toà, đầu cột dính (đợt 3).
- Tính sẵn `v_unit_thuoc_tinh`, `v_s16_gia_cdt` ở pipeline (đợt 4).
- `FramePanel className="p-0! shadow-none!"` (chờ khuôn ReUI chuẩn, sửa cả năm chỗ một lần).
- Bí danh, mã đã nối ở mô tả đầu trang dự án; 25% căn thiếu tầng (làn dữ liệu).

## Known limits

## Notes

- Hai câu của bản `main` chạy song song, nên bỏ một câu chắc chắn giảm tải DB một nửa nhưng thời gian chờ trang có thể giảm
  ít hơn 3,3 s (chỉ bớt tranh CPU/IO). AC-4 hứa phần chắc chắn (tải DB) và «không chậm hơn» ở thời gian tường; số chờ thật
  đo và ghi ở E5 và E13 cạnh bản `main` (gap-probe P1). Giảm thời gian chờ thật là việc của đợt 4 (tính sẵn S16).
- Finding AC-9 của vòng 2 (assert «ô tìm không đổi» đọc fixture) sửa SAU khi chấm, chỉ tệp `app/tests/danh-ba-ops-dot1.test.tsx`;
  bằng chứng ghim lại trên M5 @2ab1a3364 (làn xanh, `repin-20261127T115628Z-98256`), phần sửa không qua hội đồng lần nữa.
- Số đo trên hai máy: AC-4 dự án 16 — Mac mini DB 5.693 → 2.794 ms (0,49), tường 2.913 → 2.820 ms (0,97); M5 DB 3.451 → 1.765 ms
  (0,51), tường 1.746 → 1.783 ms (1,02) — `evidence/m5-kiem-may-2ab1a3364.txt`. E13 375 px sáng = tối: scrollWidth/clientWidth
  333/333, mép phải Căn 283,3 · Tin 354 ≤ 375 — `evidence/m5-e13-375-2ab1a3364.txt`.
