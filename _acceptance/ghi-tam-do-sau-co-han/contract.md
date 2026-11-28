---
schema_version: 1
feature: Máy chỉ tự ghi khi luật và model đọc độc lập trùng nhau, model không thấy đáp án của luật; giá trị tự ghi mang mã lô, cờ «chưa đo» và hạn đo bù; một lệnh rút được cả lô; ô quá hạn hoặc đo bù không đạt thì tự dừng ghi và rút lô
slug: ghi-tam-do-sau-co-han
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [script, db]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-26
design_doc: docs/superpowers/specs/2026-11-26-ghi-tam-do-sau-co-han-design.md
---

# Acceptance Contract: ghi-tam-do-sau-co-han

## Context

ROADMAP §3 mục 63 quyết định 3 (Mạnh «Chốt cả ba», 24/11): máy được tự ghi trước khi ô có số đo khi hai phiếu độc lập trùng
nhau, mỗi đợt ghi có mã lô và lệnh rút cả lô, giá trị ghi tạm không làm căn lên B3, và đo bù trong hai tuần — không đạt hay
quá hạn thì ô tự tụt và rút lô. DB máy thu 26/11: 2.290 giá trị đã tự ghi (1.993 loại hình của lượt đọc toàn bộ; 187 loại
hình và 110 toà của lượt hằng đêm), chưa giá trị nào có lô, cờ hay hạn. Lượt hằng đêm đứng từ 23/11 («Chờ sửa xong») vì lời
nhắc mang hai dòng đáp án của luật; NB11 (#537) chặn tạm tự áp của nó. Bảng phủ ca: design doc §2.

## Criteria

- AC-1: Given một tin S03 mà luật đã đọc ra loại hình và mã toà từ tên nhóm, When lượt làm giàu dựng lời nhắc gửi model,
  Then lời nhắc không chứa loại hình và mã toà của luật (không dòng «Loại hình từ nhóm», «Mã tòa phát hiện»), vẫn chứa tên dự
  án, ứng viên dự án và khu vực khi luật có.
- AC-2: Given một lời gọi mà lời nhắc thật sự gửi đi mang đáp án của luật (ca cấy), When model trả cùng giá trị với luật,
  Then đề xuất không tính là phiếu thứ hai: route `review`, không áp, `evidence.doc_lap = false` và căn cứ cũ ở
  `evidence.trung_luat`; lời nhắc mang danh sách toà hay mã toà (ca cấy) cũng không độc lập ở trường toà; cùng ca với lời nhắc
  độc lập thì đề xuất được áp ghi tạm và `evidence.doc_lap = true`. (cross-layer)
- AC-3: Given một lượt tự ghi đề xuất trùng nhau (luật và model độc lập, hoặc model và tên toà danh bạ), When áp, Then mỗi giá
  trị mang `lo_id` và `ghi_tam = true`; một lô cho mỗi (lượt × trường) ghi ai ghi, model, nấc, mở lúc và hạn đo bù = ngày mở
  + 14 ngày; không có đường nào áp đề xuất corroborated mà thiếu lô — cả lượt hằng đêm lẫn lượt đọc toàn bộ. (cross-layer)
- AC-4: Given bản chép DB máy thu, When áp migration 129, Then 2.290 giá trị đã tự ghi đều có lô và cờ ghi tạm, chia ba lô
  `doc-toan-bo-loai-hinh` 1.993, `truoc-doc-lap-loai-hinh` 187, `truoc-doc-lap-toa` 110 (297 giá trị của lượt đêm ở hai lô
  «trước độc lập», `doc_lap = false`; lô đọc toàn bộ `doc_lap = true` theo mục 63), hạn đo bù = ngày áp + 14 ngày; áp lần hai
  không đổi số dòng nào.
- AC-5: Given một lô đã ghi, When người chạy `rut-lo-ghi-tam.mjs --lo <mã>`, Then chạy thử in số giá trị và số tin sẽ đổi mà
  không ghi gì; `--ghi --nguoi hitl:<tên> --ly-do <…>` đưa mọi tin và đề xuất của lô về đúng như trước lần áp (giá trị ô về giá
  trị kế có căn cứ như `revert_enrichment`, đề xuất `reverted`, đề xuất superseded mở lại), lô `da-rut`; chạy lại không đổi
  dòng nào; thiếu `--nguoi hitl:` hay `--ly-do` thì từ chối.
- AC-6: Given một lô `dang-ghi` đã quá hạn đo bù mà chưa đạt (ca cấy), When lượt làm giàu kế chạy hoặc chạy lệnh độc lập
  `rut-lo-ghi-tam.mjs --het-han` (không cần lượt nào), Then không ghi thêm giá trị nào của trường đó (đề xuất trùng nhau đi
  thẻ), tổng kết hay đầu ra lệnh báo tên lô và lý do, lô bị rút bằng actor máy `may:ghi-tam:het-han` (cách rút theo Hỏi-4) và
  ô của trường dừng tới khi người mở lại; lô còn hạn của trường khác vẫn ghi.
- AC-7: Given người ghi kết quả đo bù cho một lô (`--ket-qua <lô> dat|khong-dat --nguoi hitl:<tên>`), When ghi `khong-dat`, Then
  lô bị rút và ô của trường dừng như AC-6; When ghi `dat`, Then giá trị của lô thôi mang cờ ghi tạm, lô `dat`, không rút; hàm
  rút bằng actor máy từ chối đề xuất không thuộc lô ghi tạm.
- AC-8: Given một căn danh bạ có tin gắn đủ trường lõi mà loại hình đến từ giá trị ghi tạm còn sống (ca cấy; DB máy thu hôm
  nay 0 căn như vậy), When tính bậc căn (`unit_data_level()`), Then căn không ở B3–B5 vì tin ấy; cùng tin sau khi lô `dat` thì
  căn lên B3; bậc của tin (B0–B2) không đổi.
- AC-9: Given chốt chặn NB11 đang chặn mọi tự áp của lượt đêm, When hàng này gộp, Then lượt đêm áp đề xuất corroborated khi
  và chỉ khi phiếu độc lập và ô của trường đang mở; đề xuất review, xung đột E1–LLM, field đang giữ và fill-gap giữ đúng như
  trước (`routeFields` không đổi kết quả cho các nhánh ấy).
- AC-10: Given chữ ký Cổng Bằng chứng kèm lời áp lên DB máy thu, When đọc `_acceptance/ghi-tam-do-sau-co-han/ap-may-thu.md`, Then có đủ năm thứ: lệnh áp, số chạy thử trên
  bản chép DB máy thu (khớp AC-4), sao lưu trước, cách lùi đã chạy thử trên bản chép, lệnh kiểm sau. (judgment)

## Coverage

Quét không gian AC theo bốn trục (chi tiết bảng phủ ca: design doc §2):
- Trục **lượt ghi** {đọc toàn bộ, hằng đêm, lượt về sau} × **trường** {loại hình, toà} × **căn cứ** {e1, danh bạ}: AC-3, AC-4,
  AC-9; ô đọc toàn bộ × toà = 0 ca (ngoài phạm vi, không có dữ liệu).
- Trục **độc lập** {lời nhắc sạch, lời nhắc mang đáp án}: AC-1, AC-2.
- Trục **vòng đời lô** {đang ghi, quá hạn, đo bù đạt, đo bù không đạt, đã rút, chạy lại}: AC-5, AC-6, AC-7.
- Trục **người đọc phía sau** {giá trị ô của tin, Hàng duyệt, bậc căn B3}: AC-5, AC-8, AC-2.
- Trục **áp lên máy thu** {áp, chạy lại, lùi}: AC-4, AC-10.
Direct E1 một phiếu (48 giá trị) và review người đã áp (2) ngoài phạm vi: không phải đường «hai phiếu trùng nhau».

## Đường đo

Không có `opportunity.md` (hàng giám sát cắt từ gói «Người ở biên», Cổng Đáng thuộc giám sát). Số trên màn đổi được đo bằng
câu đếm của AC-4 trên DB máy thu sau khi áp: giá trị tự ghi có lô 0 → 2.290; lô 0 → 3.

## Out of scope

- Lô đo bù, thẻ cài và việc gắn nhãn (phiên gắn nhãn của Mạnh); lên nấc chính thức (chữ ký từng ô, mục 61).
- Thước đo bù tự động từ nhãn (cần lớp xuất xứ nhãn NB2) — kết quả đo bù do người ghi bằng lệnh.
- Đổi trần `ENRICH_LIMIT` trong script nạp hằng ngày của S03 (làn ZCode; đổi là tiền — Hỏi-1).
- Direct E1 một phiếu và đường đọc gộp S03.
- Nối lệnh `--het-han` vào lịch hằng ngày (script nạp S03 thuộc làn ZCode) — giao riêng sau gộp; trong lúc chờ, lô quá hạn
  tụt ở lượt làm giàu kế hoặc khi người gõ lệnh.
- Hỏi-3 (bật lại tự ghi đêm khi áp) và Hỏi-5 (lô theo lượt × trường) đổi lời AC-3, AC-4, AC-9 nếu Mạnh chọn lối khác.

## Known limits

## Notes

- Thứ tự với 066 (GS phán 2026-11-27 sau probe M5 @fe6c96e69): 066 có trên `main` nhưng CHƯA áp DB máy thu (nợ GS trình Mạnh đường gỡ E7). 129 vá thân hàm đang chạy nên không phụ thuộc 066; ca E6 «bẫy thứ tự 066» tự nạp phần hàm của 066 (mục 1–3) vào DB lượt trước khi đo.
- Vòng 1 trên M5 @2469d5342 (BLOCKED vì suite, không tính vòng), GS phán 2026-11-27: (a) finding AC-6 — lượt đọc toàn bộ không xét hạn đo bù, vẫn ghi tạm vào trường có lô quá hạn chưa rút — vá trong hàng này: lượt đọc toàn bộ coi trường quá hạn là ô dừng (không rút lô; rút là việc lượt đêm hay `--het-han`), thêm ca E6 và đột biến «đọc toàn bộ bỏ xét quá hạn»; (b) chỗ yếu của phép đo độc lập theo nhãn (`DAU_DAP_AN_LUAT`) — mở hợp đồng mới: NB13 «phép đo độc lập kiểm theo giá trị»; (c) trần 30′ của `pipeline_that` là việc kit/config (HT37), hồ sơ không khai `long_running`.
- Vòng 1 trên M5 @03b9b5836 = REJECT (2a05d0d61), sửa trong vòng 2: (a) suite agent đỏ SL1-AC-11 (25P02) — `s03-len-cong.test.ts` có `withTx` riêng không nạp 129; trên DB chép máy thu (chưa áp 129) `xetHan` lỗi 42883 trong savepoint, rồi `oDangDung` đọc `ghi_tam_o` NGOÀI savepoint làm hỏng giao dịch. Cùng lỗi sẽ xảy ra trên máy thu nếu mã gộp trước khi áp 129 → thêm `coLopGhiTam`: DB chưa có lớp ghi tạm thì mọi trường dừng tự ghi, lượt không lỗi, tổng kết nêu 129 (ca E3 mới, đột biến «bỏ kiểm DB đã áp 129»); (b) hai finding AC-6: `xuLaiTrich` thiếu trường quá hạn → MỘT hàm `truongDangDung` (ô dừng ∪ lô quá hạn chưa rút ∪ chưa 129) cho cả ba đường máy áp đề xuất (`run.ts` lượt đêm, `doc-toan-bo.ts` lượt đọc toàn bộ, `xuLaiTrich`); ca E6 mới cho xử lại trích dẫn + đối chứng còn hạn; đột biến cho từng chỗ gọi và cho nguồn chung.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-27:
  - Ngoài-1: Khi bước xét hạn đo bù của lượt đêm gặp lỗi, lượt vẫn thoát thành công; lỗi chỉ hiện ở dòng tổng kết, trường quá hạn vẫn dừng tự ghi.
  - Ngoài-2: Bước bẫy thứ tự 066 trên bản chép tính mọi lỗi là «bị từ chối», chưa ghim đúng thông điệp từ chối.
  - Ngoài-3: Đột biến AC-4 trên bản chép coi mọi lệch là «đỏ đúng», chưa so với thông điệp ghim.
  - Ngoài-5: Ca «lượt đọc toàn bộ» của AC-6 còn vế kiểm trên mảng có thể rỗng, chưa có đối chứng dương riêng.
