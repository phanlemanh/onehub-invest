---
schema_version: 1
feature: Hàng duyệt ghi giờ mở và giờ quyết từng thẻ (đo giây/thẻ theo hạng mục), chữ và nhãn khớp quyết định mới, thẻ không còn điểm hay mã thô, Căn giá tốt báo căn đang chờ ghép
slug: ops-duyet-nhip-va-chu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: verified
design_doc: docs/superpowers/specs/2026-11-08-ops-duyet-nhip-va-chu-design.md
lo_trinh_ma: OD1
approved_by: Mạnh
approved_at: 2026-11-08
---

# Acceptance Contract: ops-duyet-nhip-va-chu

## Context

Hàng OD1 (`docs/plan/lo-trinh.json`): ĐC6 + ĐC1 + ĐC2 + ĐC7 của `docs/research/soat-ops-0711.md` mục (f), Mạnh duyệt 07/11
(ROADMAP §3 mục 35). Hàng duyệt có 671 thẻ chờ mà không có số giây/thẻ nào — OD2 hứa giảm giây/thẻ theo hạng mục nên OD1
ghi giờ mở, giờ quyết trước để có số trước. Cùng lượt dọn bốn chỗ làm người duyệt hiểu sai (điểm Stage B, So «Lệch» trên
hai số bằng nhau, ô ảnh hỏng, nhãn mã thô và nhãn trạng thái lệch nút) và nối Căn giá tốt với thẻ Ghép căn đang chờ.

Căn cứ: lo-trinh OD1 (`cau_giao`, `bat_khi`); báo cáo soát Ops 07/11 §(b) P1-1, P1-2, P1-5, P1-6, P1-11, P2-1..P2-3, §(e) e1, e9,
§(f) ĐC1, ĐC2, ĐC6, ĐC7; Q9 (`review-queue.ts`); luật đặt tên ở `AGENTS.md` và `CONTEXT.md`. Thiết kế: `design_doc`.

Source input: hàng lộ trình OD1 (Cổng Đáng gom về giám sát, Mạnh duyệt qua ROADMAP §3 mục 35).

## Criteria

- **AC-1** (cross-layer) — Given một thẻ chờ ở hàng duyệt, When người mở thẻ trong sheet rồi bấm một đáp án kèm lý do, Then
  body gửi route decide có `elapsed_ms` = khoảng từ lúc thẻ dựng tới lúc bấm (đồng hồ đơn điệu của trình duyệt), và dòng
  `ops_audit` `review.decide` ghi CÙNG giao dịch với quyết định có `detail.decided_at` (bằng `review_queue.decided_at`),
  `detail.opened_at` = `decided_at` − `elapsed_ms`, `detail.seconds` (một chữ số thập phân), `detail.category`, và
  `detail.since_prev_seconds` = giây từ dòng `review.decide` trước gần nhất của cùng người (vắng khi chưa có hay cách quá 24
  giờ) — Hỏi-3; đồng hồ chạy cả khi tab ẩn, mở thẻ khác thì đặt lại; mọi loại thẻ có nút quyết (Ghép căn, Bổ sung tin, chỉ đối
  chiếu, Người) đều gửi `elapsed_ms`.
- **AC-2** — Given body decide thiếu `elapsed_ms`, hay nó không phải số nguyên trong 1…86 400 000, When route ghi quyết định,
  Then quyết định vẫn ghi như cũ (200) với `detail.timing = "khong-do"` và không có `opened_at`, `seconds`; các luật cũ giữ
  nguyên: lý do trống → 400 không đổi gì, thẻ đã quyết → 409, thẻ ghép căn không chạm đúng một ứng viên → 422 không dòng audit.
- **AC-3** — Given thẻ mỗi dáng (ghép căn; Người `nguoi:`; bổ sung tin có trường xung đột; có trường đề xuất; chỉ đối chiếu ý
  định, giá, diện tích và có hai khối; loại lạ), When gọi `reviewCategory`, Then ra đúng một mã theo bảng hạng mục của thiết kế
  (`unit_match`, `party_merge`, `rule_vs_ai`, `fill`, `intent_check`, `price_check`, `area_check`, `other`) — thẻ có hai khối
  đối chiếu lấy loại đầu theo thứ tự `y_dinh → gia → dien_tich`; route và trang dùng cùng hàm.
- **AC-4** (cross-layer) — Given dòng `review.decide` trong 7 ngày (có đo, `timing: khong-do`, ngoài 7 ngày, dài hơn 30 phút),
  When người Vận hành mở `/ops/review` ở máy thu, Then Frame «Nhịp duyệt 7 ngày» có một hàng mỗi hạng mục đang có thẻ chờ hoặc
  lượt đo: Thẻ chờ, Đã quyết có đo, Trung vị giây ở thẻ và Trung vị giây giữa hai lượt (mỗi cột chỉ lượt có số đó, ≤ 30 phút,
  trong 7 ngày) và Quá 30 phút (lượt có giây ở thẻ vượt trần, đếm riêng);
  không có lượt đo nào → chữ trống kèm nút «Mở thẻ chờ cũ nhất» trỏ `?card=` của thẻ chờ tạo sớm nhất.
- **AC-5** — Given thẻ Ghép căn có tiêu đề gốc «Cùng căn? cau-giay 80m² ↔ 84m² (score 0.93)» và `evidence.stage_b_score`, When
  trang dựng thẻ gửi xuống trình duyệt, Then tiêu đề là «Cùng căn? <phường của evidence> · 80 m² và 84 m²», `evidence` không còn
  `stage_b_score`, và HTML của `/ops/review` trên DB máy thu không chứa chuỗi «score» cũng như số thập phân của điểm Stage B ở
  bất kỳ thẻ chờ nào; thẻ loại khác mang vế «score <số>» cũng bị gọt.
- **AC-6** — Given hai tin có Giá/m² 72,3 tr và 71,8 tr (cùng hiện «72tr/m²»), hay Giá 2,351 tỷ và 2,349 tỷ (cùng «2.35 tỷ»),
  When dựng bảng so của thẻ Ghép căn, Then cột So ghi «Khớp»; 72 tr và 74 tr → «Lệch»; một bên trống → «Thiếu».
- **AC-7** — Given dải ảnh có ảnh tải lỗi, When ảnh báo lỗi, Then không ô «Ảnh hỏng» nào còn trên màn, ảnh lỗi rời dải, một
  dòng «<n> ảnh không còn tải được» đếm đúng số ảnh lỗi, ảnh tốt giữ nguyên; mọi ảnh lỗi → chỉ còn dòng đó; áp cả dải nhỏ của
  sheet lẫn lưới lớn của trang một căn.
- **AC-8** — Given thẻ mọi loại đã quyết và thẻ Người, When người xem danh sách và sheet, Then thẻ Người mang nhãn «Người» (bộ
  lọc «Loại thẻ» có «Người»; «Loại khác» không nhận nó; không badge mã thô `data_quality`), nhãn trạng thái ở danh sách, đầu
  sheet, chân sheet và thông báo sau khi bấm là nhãn đáp án đã bấm theo bảng của thiết kế, chữ hàng duyệt không xưng «bạn»
  hay «anh», nhánh cloud (bảng `review_queue` vắng) dựng ra câu nói hàng TV13 thay câu «không lên máy chủ» và không có
  Frame nhịp, vai Người xem không có Frame nhịp; `CONTEXT.md` có «Hạng mục duyệt», «Nhịp duyệt»,
  «Đang chờ ghép», tham số URL `card`, và mục «Hàng duyệt», «Ảnh tin», «Gắn nhãn» khớp quyết định hiện hành.
- **AC-9** (cross-layer) — Given căn ở `/ops/deals` là Tin A hay Tin B của một thẻ Ghép căn đang chờ, When người mở lưới, sheet
  căn và `/ops/deals/<offerId>`, Then cả ba hiện badge «Đang chờ ghép», sheet và trang một căn có liên kết «Mở thẻ ghép #<id>»
  tới `/ops/review?card=<id>`; thẻ ghép đã quyết hay căn không có thẻ → không badge; `review_queue` vắng (cloud) → không badge,
  không lỗi.
- **AC-10** (cross-layer) — Given `/ops/review?card=<id>`, When thẻ có trong `review_queue` (bộ nạp của trang đọc mọi thẻ, kể
  cả đã quyết; thẻ có thể nằm ngoài trang 1 và ngoài bộ lọc mặc định), Then sheet thẻ đó mở sẵn; id không có → danh sách như
  thường kèm Alert «Không tìm thấy thẻ #<id>».

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …»: phạm vi đã chốt ngoài vòng (câu giao OD1 + ĐC1, ĐC2, ĐC6, ĐC7
của báo cáo f2 đã Mạnh duyệt). Trục tự kê để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Hạng mục ĐC | ĐC6 nhịp · ĐC1 chữ · ĐC2 thẻ sạch · ĐC7 nối | AC-1..AC-4 · AC-8 · AC-5..AC-7 · AC-9, AC-10 |
| Loại thẻ | Ghép căn · Bổ sung tin (xung đột, đề xuất, chỉ đối chiếu ×3) · Người · loại lạ | AC-3, AC-5, AC-8 |
| Trạng thái quyết | duyệt · bác · hoãn · lỗi route (400, 409, 422) | AC-2, AC-8 |
| Đồng hồ | có đo · thiếu · sai kiểu · ngoài khoảng · > 30 phút · ngoài 7 ngày | AC-1, AC-2, AC-4 |
| Mặt | danh sách · sheet · `/ops/deals` lưới · sheet căn · trang một căn · liên kết `?card=` | AC-4, AC-8..AC-10 |
| Môi trường | máy thu · cloud (không hàng duyệt) · vai Người xem | AC-4, AC-8 (cloud, Người xem), AC-9 (cloud) |

## Out of scope

- Rail hạng mục, ba số đầu trang, PageHeader của `/ops/review` (OD2 · ĐC3); phím tắt, tự sang thẻ kế, hoàn tác, lý do không
  bắt cho Hoãn (OD2).
- Tách «Bổ sung tin» thành điền ô trống / ghi đè / trùng giá trị đang lưu (OD4 — cần giá trị đang lưu trên thẻ).
- Liên kết hồ sơ người trên thẻ Người, hai cột so (OD5); xưng hô màn Gắn nhãn (OD7).
- Sửa writer tiêu đề Ghép căn ở `agent/` (cột `title` trong DB giữ điểm — chỉ gọt ở lớp đọc, như Q9 với `ai_confidence`).
- Badge «Đang chờ ghép» trên cloud (hàng duyệt chưa lên máy chủ — TV13).

## Notes

- Không migration: `ops_audit.detail` là jsonb. Route decide chỉ thêm một trường tuỳ chọn `elapsed_ms` trong body.
- Số OD1 là số trước của OD2 (`bat_khi` OD2: «Trung vị giây/thẻ giảm so số OD1 ở từng hạng mục»).
