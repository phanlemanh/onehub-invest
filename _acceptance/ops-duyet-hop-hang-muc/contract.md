---
schema_version: 1
feature: Người duyệt chọn một hạng mục và quyết liền từng thẻ bằng phím, quyết xong tự sang thẻ kế, hoàn tác được trong 5 giây, xem lại quyết định gần đây
slug: ops-duyet-hop-hang-muc
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: verified
design_doc: docs/superpowers/specs/2026-11-08-ops-duyet-hop-hang-muc-design.md
lo_trinh_ma: OD2
approved_by: Mạnh
approved_at: 2026-11-08
---

# Acceptance Contract: ops-duyet-hop-hang-muc

## Context

Hàng OD2 (`docs/plan/lo-trinh.json`): ĐC3 + ĐC4 + ĐC5 và Q4, Q7 của `docs/research/soat-ops-0711.md` §(f), Mạnh duyệt
07/11 (ROADMAP §3 mục 35; f4 chốt khuôn `@reui/solution-agents-9`, `@reui/c-dialog-9`). Dựng trên OD1 (#372): Hạng mục
duyệt, đồng hồ thẻ `elapsed_ms`, bảng Nhịp duyệt. OD1 đo số trước; OD2 rút các bước quanh thẻ (chọn hàng, mở, gõ lý do,
đóng, tìm thẻ kế) để `bat_khi` của hàng — trung vị giây/thẻ giảm so OD1 ở từng hạng mục — đo được bằng chính bảng của OD1.

Căn cứ: lo-trinh OD2 (`cau_giao`, `bat_khi`, `vi_sao`); báo cáo soát Ops 07/11 §e9 (điều hướng), §f1 Q4 (lý do), Q7 (hoàn
tác), §f2 ĐC3–ĐC5, §f4 (khuôn đã xác minh); `routes.md` dòng `/ops/review`; luật đặt tên `AGENTS.md`, `CONTEXT.md`.
Thiết kế: `design_doc`.

Source input: hàng lộ trình OD2 (Cổng Đáng gom về giám sát, Mạnh duyệt qua ROADMAP §3 mục 35).

## Criteria

- **AC-1** — Given hàng duyệt có thẻ chờ (có thẻ tạo trước 3 ngày) và thẻ quyết hôm nay theo giờ Việt Nam, When người Vận
  hành mở `/ops/review` ở máy thu, Then `PageHeader` «Hàng duyệt» có ba số: Chờ duyệt (đếm thẻ `pending`), Quá 3 ngày
  (thẻ `pending` có `created_at` cũ hơn 72 giờ), Đã quyết hôm nay (thẻ có `decided_at` từ 00:00 giờ Việt Nam, mọi người)
  — thẻ quyết lúc 23:30 hôm qua giờ Việt Nam không tính; vai Người xem và nhánh cloud giữ như OD1.
- **AC-2** — Given thẻ chờ thuộc nhiều Hạng mục duyệt, When trang dựng, Then hộp hạng mục (khuôn cột trái
  `solution-agents-9`) có mục «Tất cả» rồi một mục cho mỗi hạng mục có thẻ (chờ hay đã quyết) theo thứ tự
  `REVIEW_CATEGORIES`, mỗi mục mang số thẻ chờ, tuổi thẻ chờ cũ nhất (ngày; mục hết thẻ chờ ghi «hết thẻ chờ») và trung vị
  giây ở thẻ 7 ngày đọc từ `loadReviewPace` của OD1 («—» khi chưa đo); bấm một mục → bảng chỉ còn thẻ của mục đó, URL có
  `?category=<mã>`; mục hết thẻ chờ + Trạng thái «Đã quyết» vẫn lọc ra thẻ đã quyết của mục đó; mở
  `/ops/review?category=<mã>` → mục đó chọn sẵn; `?category=` lạ → «Tất cả», không lỗi; ô lọc theo `item_type` không còn (hộp thay
  nó), ô «Trạng thái» giữ.
- **AC-3** (cross-layer) — Given đang chọn một hạng mục có N thẻ chờ, When người bấm «Duyệt liền» rồi quyết lần lượt từng
  thẻ, Then sheet mở ở thẻ chờ đầu theo thứ tự cũ nhất trước (Hỏi-1), đầu sheet hiện «k/N · <hạng mục>», mỗi lượt quyết
  thì thẻ kế cùng hạng mục hiện ngay trong CÙNG sheet (sheet không đóng giữa hai thẻ), Trước/Sau đi lùi tới không quyết;
  quyết hết N thẻ → thân sheet là Empty «Hết thẻ chờ ở hạng mục này» kèm nút sang hạng mục kế còn thẻ (không còn → nút
  «Đóng»); mọi lượt đều tới route decide và ghi `review_queue` + `ops_audit` như OD1.
- **AC-4** — Given sheet chế độ duyệt đang mở, When người gõ phím, Then `J`/`↓` sang thẻ sau, `K`/`↑` về thẻ trước, `1`–`4`
  bấm đúng nút đáp án thứ n ở chân thẻ (cạnh mỗi nút có `Kbd` số của nó, nút mang `aria-keyshortcuts` và giữ nguyên chữ đáp
  án; nút đang tắt thì phím không làm gì) và quyết luôn
  (Hỏi-2), `R` đưa tiêu điểm vào ô lý do, `?` mở bảng phím (khuôn `c-dialog-9`, liệt đủ mọi phím trên); khi tiêu điểm ở ô
  nhập, phím chữ/số không làm gì; phím có `⌘`/`Ctrl`/`Alt` kèm phím chữ không bị bắt (giữ `⌘K` của vỏ Ops).
- **AC-5** (cross-layer) — Given người bấm một đáp án ở chế độ duyệt, When chưa đủ 5 giây, Then chưa có yêu cầu nào tới
  route decide, toast «Đã ghi #<id> · <nhãn đáp án>» có nút «Hoàn tác», thẻ kế đã hiện; bấm «Hoàn tác» → không yêu cầu nào
  được gửi, sheet quay về thẻ đó với lý do đã gõ còn nguyên, `review_queue` không đổi; không hoàn tác → đúng một yêu cầu
  gửi lúc 5 giây với `elapsed_ms` đo tới lúc bấm (không cộng 5 giây chờ); route trả lỗi → toast lỗi kèm «Mở thẻ», thẻ trở
  lại danh sách chờ; «Hoàn tác» bấm SAU khi lệnh đã gửi (toast còn hiện vì chuột đè lên) → không đưa thẻ trở lại, không gửi
  thêm; trang phát `pagehide`, hay hàng duyệt bị gỡ (chuyển route trong app) khi còn lệnh chờ → mọi lệnh chờ gửi ngay bằng
  `fetch` có `keepalive: true`.
- **AC-6** — Given `ops_audit` có lượt `review.decide` của người đang duyệt và của người khác, trong và ngoài 7 ngày, When
  trang dựng, Then Frame «Quyết định gần đây» liệt tối đa 20 lượt mới nhất trong 7 ngày của chính người đang duyệt
  (Hỏi-3), mỗi lượt: #id, tiêu đề thẻ (đã gọt điểm như OD1), nhãn đáp án, lý do, giờ Việt Nam; #id là liên kết
  `/ops/review?card=<id>` mở sheet thẻ đã quyết; chưa có lượt nào → Empty «Chưa có quyết định nào trong 7 ngày» kèm nút
  «Duyệt liền»; bảng `ops_audit` vắng → Frame trống, không lỗi.
- **AC-7** (cross-layer) — Given một thẻ chờ, When người bấm đáp án với ô «Lý do» để trống, Then yêu cầu gửi route decide
  mang `reason` = nhãn đáp án đã bấm (Cùng căn, Khác căn, Không chắc, Đã áp, Để sau, Đã ghi, Đã gộp, Giữ tách, Hoãn…), route
  trả 200, `review_queue.decision_note` và `ops_audit.detail.ly_do` là nhãn đó, ghi cùng giao dịch; riêng «Bỏ» ở thẻ Bổ
  sung tin (có trường đề xuất hay chỉ đối chiếu) nút vẫn tắt khi lý do trống; lý do gõ tay thắng nhãn; mọi lượt ở chế độ
  duyệt vẫn ghi `seconds`, `category`, `since_prev_seconds` như OD1; route decide không đổi một dòng.

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …»: phạm vi đã chốt ngoài vòng (câu giao OD2 + ĐC3, ĐC4, ĐC5,
Q4, Q7 của báo cáo f2 đã Mạnh duyệt). Trục tự kê để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Hạng mục ĐC | ĐC3 đầu trang + hộp · ĐC4 chế độ duyệt + phím · ĐC5 hoàn tác + gần đây · Q4 lý do | AC-1, AC-2 · AC-3, AC-4 · AC-5, AC-6 · AC-7 |
| Hạng mục duyệt | Ghép căn · Gộp Người · Luật và AI khác nhau · Bổ sung tin · ba Đối chiếu · Loại khác | AC-2, AC-3, AC-7 |
| Đường quyết | chuột · phím · hoàn tác · hết 5 giây · lỗi route · rời trang | AC-3, AC-4, AC-5 |
| Lý do | trống · gõ tay · «Bỏ» Bổ sung tin | AC-7 |
| Mặt | đầu trang · hộp · bảng · sheet · toast · bảng phím · Quyết định gần đây | AC-1..AC-6 |
| Môi trường | máy thu · cloud · vai Người xem · `?category` lạ · hạng mục một thẻ · hàng rỗng | AC-1, AC-2, AC-3 |

## Out of scope

- Đáp án theo câu hỏi cho từng hạng mục, chip lý do soạn sẵn (OD3); tách điền/ghi đè/trùng của Bổ sung tin (OD4).
- Đảo một quyết định sau 5 giây (lệnh đảo ADR-0015, trang `/ops/audit`).
- Tải trước ảnh của thẻ kế (dữ liệu thẻ đã nạp sẵn với trang).
- Bỏ Frame «Nhịp duyệt 7 ngày» của OD1 (hồ sơ OD1 đã ký trên Frame đó).
- Duyệt hàng loạt (GD10 đã loại).
- Hoàn tác trên cloud (hàng duyệt chưa lên máy chủ — TV13).

## Notes

- Không đổi route decide (`app/src/app/api/v1/ops/review/**` là đường T3 của kho), không migration, không API mới.
- Hoàn tác quay về một thẻ thì đồng hồ thẻ (OD1) đặt lại: giây ở thẻ của lượt đó đo từ lúc quay về.
- Ô lọc theo `item_type` bỏ vì hộp hạng mục thay nó (thẻ Người lọc ở mục «Gộp Người»). Test cũ đã sửa theo: `ops-duyet-nhip.test.tsx`
  ca OD1-AC-8 (bộ lọc thẻ Người — hồ sơ ops-duyet-nhip-va-chu AC-8), OD1-AC-1-UI, OD1-AC-10 (chỉ đổi chuỗi đột biến theo mã
  mới); `review-queue.test.tsx` RQ-AC-2 (ma trận lọc, hồ sơ UI1), RQ-AC-5 (quyết từ sheet: chờ 5 giây, sang thẻ kế);
  `review-card.test.tsx` AC-11, `review-nguoi.test.tsx` TN-AC-8, `the-duyet-du-can-cu.test.tsx` TD-AC-6, TD-AC-7 (lý do
  trống theo Q4). Ý của các tiêu chí đã ký giữ nguyên, chỉ đổi đường bấm và luật lý do mà Q4 đã chốt.
- Bắt gõ lý do khi «Bỏ» ở Bổ sung tin là tạm, tới khi OD4 phân được ghi đè (Q4 chỉ giữ lý do gõ tay cho việc bác đề xuất
  ghi đè).
