# Soát cổng Ops — luồng phê duyệt và UX/UI (07/11/2026)

Yêu cầu của Mạnh (07/11): kiểm tra lại tổng thể tính năng phê duyệt trên Ops, gồm cả UX/UI, sau nhiều quyết định mới
từ 23/10 đến 07/11, rồi đề xuất cải thiện. Phiên này **chỉ đọc**: không sửa mã, không ghi DB.

**Cách đo.**
- Đọc mã `app/src/app/ops/**`, `components/ops/**`, `lib/ops/**`.
- Đối chiếu với `routes.md` của skill `onehub-ui`, `CONTEXT.md`, ROADMAP §3, ADR-0007 (các sửa đổi), ADR-0015,
  `docs/plan/lo-trinh.json` và audit trước `docs/research/audit-hang-duyet-3010.md`.
- Chạy app dev ở máy thu (DB local :5433) và duyệt bằng ego lite: desktop 1440, mobile 375, sáng và tối.
- Đếm bằng truy vấn chỉ đọc (`SET default_transaction_read_only = on`).

Ảnh nằm ở `research-local/soat-ops-0711/` (gitignored, chỉ ở máy thu). Ảnh có chữ bài, tên và SĐT người bán, nên
không đưa vào kho. Báo cáo này chỉ trỏ tên tệp.

> **Lượt 2 (07/11, chiều):** mục (e) phân tích từng **hạng mục duyệt**. Mỗi hạng mục có câu hỏi thật, số đo, chỗ bằng
> chứng nằm trên màn và UX để quyết trong vài giây. Thêm P0-3, P1-12, P1-13, gói G và câu hỏi Q6–Q7. Kịch bản e11: hàng
> tồn 651 thẻ từ khoảng 9 giờ 24′ xuống khoảng 45′ (mục tiêu, chưa phải số đo).

> Giới hạn: phiên trình duyệt dùng tài khoản vai **Quản trị**. Vai `ops` thấy ảnh khác (ảnh đã tải, không URL gốc)
> và chưa được chụp riêng. Nút «N» nổi ở góc trái dưới trong ảnh mobile là chỉ báo của Next dev, không có ở bản build.

---

## (a) Bản đồ trang Ops

Thanh bên chia bốn nhóm: Giám sát · Xử lý · Quản trị · Hệ thống. Cột «Ra quyết định» cho biết trang có ghi gì không.

| Nhóm | Route | Làm gì | Ai dùng | Đọc gì (máy thu) | Ra quyết định | Trên cloud |
|---|---|---|---|---|---|---|
| Giám sát | `/ops` Tổng quan | Độ tươi nguồn so với SLO, cặp quá hạn | Vận hành, Mạnh | snapshot + `source_registry` | Không | Số từ bản tin (ON3) |
| Giám sát | `/ops/collections` Thu thập | Luồng 7 ngày, lưới nguồn, khoá an toàn, nhóm S03 | Vận hành | thống kê thu, lockdown | Không (ghi qua route riêng, TV5/TV6) | Một phần |
| Giám sát | `/ops/data-flow` Dòng chảy | Sankey đường ống, chất lượng từng chặng, hồ sơ tin | Vận hành | `stg_*` → canonical | Không | Chỉ máy thu |
| Giám sát | `/ops/ai-calls` Cuộc gọi AI | Cuộc · token · chi phí theo ngày × việc × model | Mạnh | sổ cuộc gọi AI | Không | Khối `aiCalls` (PL29) |
| Giám sát | `/ops/quality` Chất lượng | Kiểm DQ, thước giá, hiệu chuẩn S02 (chỉ trang này) | Mạnh | DQ, metrics | Không | Có |
| Xử lý | `/ops/review` **Hàng duyệt** | Thẻ máy đề xuất → người quyết kèm lý do | Người duyệt (ops+) | `review_queue`, `media`, `field_provenance` | **Có** (`/api/v1/ops/review/[id]/decide`) | Chỉ số thẻ chờ |
| Xử lý | `/ops/labels` **Gắn nhãn** | Gắn nhãn S03 theo nhóm, 24 ô + căn cứ, lượt hai | Người gắn nhãn | `eval_label_*` | **Có** (lưu nhãn) | Chỉ máy thu |
| Xử lý | `/ops/people` (+ `/[partyKey]`) Danh bạ người | Người theo nguồn, bí danh, tin đã đăng | Vận hành | danh bạ người (ADR-0016) | Không (quyết gộp/tách ở thẻ Người của Hàng duyệt) | Chỉ máy thu |
| Xử lý | `/ops/deals` (+ `/[offerId]`) Căn giá tốt | Căn rẻ hơn thước, ba tab Đủ để gọi / Cần xác minh / Còn thiếu | Vận hành gọi điện | `sale_offers`, thước giá | Chưa có (CG6 chưa làm) | Có |
| Quản trị | `/ops/sources` Nguồn | Sổ nguồn, kết nối (tầng A, `data-tier-a`) | Admin | `source_registry` | Chưa (TV5) | Có, không tên thật |
| Hệ thống | `/ops/design` Thư viện thiết kế | Mẫu UI sống | Người làm UI | — | Không | Có |

`docs/architecture/portals.md` còn liệt kê các trang chưa dựng: `/ops/console`, `/ops/audit`, `/ops/agents` và
`/ops/backups`. Đáng chú ý là chưa có trang nào **đọc lại nhật ký quyết định** (`ops_audit`), dù đầu Hàng duyệt viết
«mọi quyết định được ghi nhật ký».

### Số lúc đo (DB local, 07/11)

**Hàng duyệt**: 651 thẻ đang chờ, 25 thẻ đã quyết từ trước tới nay.

| Loại thẻ | Chờ | Tuổi TB (ngày) | Đã quyết (duyệt · trả · hoãn) |
|---|---:|---:|---|
| `agent_output` «Bổ sung tin» | 617 | 4,0 | 0 · 4 · 4 |
| `data_quality` thẻ Người (HD17) | 27 | 4,5 | 0 · 0 · 5 |
| `entity_match` «Ghép căn» | 7 | 7,7 | 1 · 11 · 0 |

- Lần quyết gần nhất là 05/11 lúc 00:01 (giờ VN). Từ đó tới nay không có quyết định nào.
- Riêng ngày 03/11 sinh 383 thẻ Bổ sung tin trong một lô.
- 239/617 thẻ Bổ sung tin (39%) **chỉ có khối Đối chiếu**. Bản thân thẻ ghi rõ: «Duyệt hay bỏ phần này chỉ ghi vào nhật ký,
  không đổi tin».
- 87 thẻ có trường mà luật và AI khác nhau, phải chọn một bên.
- Ảnh trên 617 tin của thẻ Bổ sung tin: 278 tin có dòng `media`, nhưng chỉ 224 tin có tệp ảnh đã tải. Khoảng 54 thẻ
  hiện «Ảnh hỏng» (URL gốc đã hết hạn), 339 thẻ không có ảnh nào.

**Gắn nhãn**:
- Lát `s03-theo-nhom` có 366 thẻ, đã gắn 50. Chỉ có **1 người gắn**.
- 73 thẻ gắn hai người (20%). Mới 1 thẻ có một người gắn, chưa thẻ nào đủ hai người. Vì vậy «Đồng thuận» luôn hiện
  «chưa đủ cặp».

---

## (b) Phát hiện

Mức: **P0** chặn việc duyệt hoặc trái luật; **P1** làm sai quyết định hoặc tốn nhiều công; **P2** đánh bóng, nợ chữ.
Mỗi mục ghi trang, chuyện gì, căn cứ và ảnh.

### P0

**P0-1 · `/ops/review` — Hàng duyệt đã ngừng chảy: 651 thẻ chờ, quyết 0 thẻ từ 05/11.**
- Số thẻ sinh ra (trung bình 40–50 thẻ/ngày, cộng lô 383 thẻ ngày 03/11) vượt xa sức duyệt một người.
- Cứ một thẻ phải mở sheet → đọc → gõ lý do → bấm → đóng → mở thẻ kế. Audit 30/10 (H13) đo **52 giây mỗi thẻ**. Với 651
  thẻ, cần khoảng 9,4 giờ làm liền.
- Thiếu cùng lúc ba thứ:
  - tự sang thẻ kế (HD8, chưa mở vòng);
  - trả lại hàng loạt (UI12, chưa mở vòng);
  - bộ lọc theo mức đáng duyệt (PL23, chưa mở vòng).
- Căn cứ: luật 7 (LLM-off-data-path): quyết định đi qua người. Nếu người không theo kịp thì đề xuất E2 không bao giờ vào
  dữ liệu, và mô hình «chỉ tốt lên» (framing 05/11) không có nhãn quyết định để học.
- Ảnh: `d-light-ops_review.png`.

**P0-2 · `/ops/review` — 39% thẻ là thẻ «chỉ ghi nhật ký» nhưng chiếm chỗ như thẻ có tác dụng.**
- 239 thẻ Đối chiếu (AI và bộ đọc khác nhau về ý định, giá, diện tích) không đổi tin khi quyết, nhưng vẫn:
  - đứng chung hàng, cùng loại «Bổ sung tin», cùng tiêu đề `offer_… (0 trường)`;
  - bắt gõ lý do như mọi thẻ.
- Người duyệt không lọc riêng được, cũng không biết thẻ nào có tác dụng trước khi mở.
- Căn cứ: framing 02/11, «chất lượng chỉ đo, không chặn». Đối chiếu là phép đo, nên được lấy mẫu để chấm chứ không phải
  xếp hàng để duyệt từng thẻ.

**P0-3 · `/ops/review` thẻ Đối chiếu — đáp án không nói bên nào đúng (lượt 2).**
- Nút là «Ghi phán quyết / Bỏ / Để sau». Phán quyết ghi vào `ops_audit` chỉ là `approved`/`rejected`. Người đọc nhật ký
  không biết «Ghi phán quyết» nghĩa là AI đúng hay bộ đọc đúng.
- Bài nhiều căn (#206667, 10 dòng giá) thì không đáp án nào đúng.
- Hệ quả: 269 thẻ đối chiếu, dù duyệt hết, cũng không thành nhãn đo được.
- Căn cứ: PL23 «mỗi quyết định thành nhãn đo», framing 02/11.
- Xem e2, e3. Ảnh: `hm-d-doichieu_gia.png`.

### P1

**P1-12 · `/ops/review` thẻ Bổ sung tin — «Áp dụng» là tất cả hoặc không, và 82 thẻ trùng giá trị đang lưu (lượt 2).**
- Thẻ nhiều trường không có ✓/✗ cho từng trường (trừ trường xung đột). Ví dụ #213472: Loại hình đúng, Đường sai (tên
  quận).
- 82/378 thẻ có mọi trường đề xuất đã bằng giá trị đang lưu, quyết cũng không đổi gì.
- 155 thẻ ghi đè giá trị đang có mà thẻ không cho thấy giá trị cũ.
- Xem e4. Ảnh: `hm-d-conflict.png`.

**P1-13 · `/ops/review` — không có đường đi nhanh giữa các thẻ (lượt 2).**
- Không có `?the=`, không phím tắt nào (không có `onKeyDown` trong `components/ops/review*`), không hoàn tác.
- Không lọc thì thẻ Ghép căn nằm ở trang 33/33.
- Mọi sheet đã đo có 0 liên kết tới tin, người hay bài gốc.
- Xem e0, e9.

**P1-1 · `/ops/review` thẻ Ghép căn — tiêu đề lộ điểm Stage B «(score 0.945)».**
- Tiêu đề thẻ hiện nguyên văn `Cùng căn? <slug phường> 76m² ↔ 68m² (score 0.945)` ở cả danh sách lẫn đầu sheet.
- Căn cứ: Q9 / RV-L04 (Mạnh duyệt 26/10): thẻ duyệt không hiện độ tự tin, không hiện điểm Stage B. Mã đã gọt
  `ai_confidence` và `fields[].confidence` nhưng sót cột `title` do `judge-run` ghi.
- Tiêu đề cũng dùng slug phường (`thanh-xuan`) thay cho nhãn.
- Ảnh: `d-light-review-list-ghepcan.png`, `d-light-review-sheet-ghepcan.png`.

**P1-2 · `/ops/review` bảng so — «72tr/m² ↔ 72tr/m²» bị chấm «Lệch».**
- Phép so chạy trên số chưa làm tròn, còn ô hiện số đã làm tròn. Người duyệt thấy hai số bằng nhau mà nhãn nói lệch,
  nên mất niềm tin vào cột So.
- Hàng Giá, Diện tích, Giá/m² đều ghi «Chưa ghi căn cứ — đọc từ tin» ở cả hai bên.
- Căn cứ: PL3 «thẻ duyệt đủ căn cứ».
- Ảnh: `d-light-review-sheet-ghepcan.png`.

**P1-3 · `/ops/review` — tiêu đề thẻ không giúp xếp ưu tiên.**
- Danh sách chỉ có `Bổ sung dữ liệu: offer_<băm> (n trường)` · Loại · Trạng thái · Tạo lúc. Không có:
  - nguồn `S0x`, khu vực, loại hình;
  - trường đề xuất là gì;
  - tuổi thẻ.
- Danh sách sắp mới nhất trước, nên thẻ cũ nhất (Ghép căn 8 ngày) nằm cuối trang 33.
- Căn cứ: luật ReUI «Table-backed management». Cột phải đủ để quyết có mở hàng hay không.
- Ảnh: `d-light-ops_review.png`.

**P1-4 · `/ops/review` thẻ Bổ sung tin — không thấy giá trị hiện tại của trường, căn cứ không trích.**
- Thẻ hiện «WC · 2 · Theo AI · LLM qwen27b · trace `…enrich-text.jsonl`». Không có:
  - giá trị đang lưu của tin (trước → sau);
  - câu trích chứa căn cứ (ở ví dụ là «2n2vs»).
- «Căn cứ» thực chất là tên tệp trace, người duyệt phải tự dò toàn văn.
- Căn cứ: PL3 (căn cứ từng trường), «Phát biểu» trong `CONTEXT.md` (giá trị + lớp căn cứ + bằng chứng). PL23 đã cắt
  hàng nhưng chưa mở vòng.
- Ảnh: `d-light-review-sheet-bosung.png`.

**P1-5 · `/ops/review` — ảnh hỏng chiếm chỗ.**
- Thẻ có ảnh chỉ còn URL gốc thì hiện 5 ô «Ảnh hỏng» màu đỏ to, đẩy toàn văn xuống dưới màn đầu (mobile: chiếm nửa
  khung).
- Đo được khoảng 54/617 thẻ Bổ sung tin như vậy (ảnh chụp bằng vai admin, vai này thấy URL gốc).
- Căn cứ: NH1 / GT1. Nên gom thành một dòng «n ảnh không còn tải được» thay vì n ô.
- Ảnh: `d-light-review-sheet-bosung.png`, `m-light-review-sheet.png`.

**P1-6 · `/ops/review` thẻ Người (HD17) — nhãn loại hiện mã thô `data_quality` và rơi vào bộ lọc «Loại khác».**
- `REVIEW_TYPE_LABEL` chưa có loại này, nên 27 thẻ Người hiện badge `data_quality`, không lọc riêng được.
- «Tin mẫu» chỉ có `offer_<băm>`, không có liên kết tới hồ sơ tin hay trang `/ops/people/[partyKey]`. Muốn quyết gộp hay
  tách phải tự tra.
- Căn cứ: `CONTEXT.md` «Hàng duyệt» (định nghĩa còn liệt `source_decision`, thiếu thẻ Người), HD17.
- Ảnh: `d-light-review-sheet-nguoi.png`.

**P1-7 · `/ops/review` — lý do bắt buộc cho cả «Để sau», «Không chắc», «Hoãn».**
- Mọi nút tắt tới khi gõ lý do. Hoãn là «chưa quyết», bắt lý do làm người duyệt bỏ qua thẻ khó bằng cách… không làm gì.
  Thực tế 9/25 quyết định là hoãn.
- Không có lý do soạn sẵn (chip) cho các trường hợp lặp như «cùng người đăng», «khác diện tích >10%».
- Căn cứ: PL3 bắt lý do cho quyết định. Hoãn không ghi dữ liệu, có thể nới mà vẫn giữ audit.

**P1-8 · `/ops/review` — Hàng duyệt là trang Ops duy nhất không dùng `PageHeader`.**
- Trang dùng `<h1>` tự viết, không có breadcrumb, không có ba số đầu trang (thẻ chờ, thẻ quá 3 ngày, đã quyết hôm nay).
- Căn cứ: `routes.md` «khung trang: PageHeader … Bắt buộc cho mọi trang operational». Mọi trang Ops khác đã có.

**P1-9 · `/ops/labels` — thẻ gắn hai người không bao giờ đủ cặp khi chỉ có một người gắn.**
- 73 thẻ (20% lát) đặt `double_label` nhưng mới có 1 người gắn. Ô «Đồng thuận» trên đầu trang là số chết.
- GN0b đã đẩy các thẻ này xuống cuối nhóm, nên chúng không chặn nữa, nhưng vẫn là 20% mẫu không dùng được.
- Căn cứ: PL7 (20% gắn hai người để đo đồng thuận); sổ gắn nhãn vòng 1 06/11.
- Ảnh: `d-light-ops_labels.png`.

**P1-10 · `/ops/labels` — biểu mẫu 24 ô không co lại theo ý định tin.**
- Bài «Không phải tin rao» (ví dụ bài rao mua điểm thưởng) vẫn hiện đủ 24 ô kèm 24 bộ chọn căn cứ.
- Chân dính ghi «Đã điền 0/24» như thể còn thiếu.
- Căn cứ: mô hình pipeline v4 (ý định tin là cổng đầu); luật ReUI về mật độ thông tin.
- Ảnh: `d-light-ops_labels.png`, `m-light-ops_labels.png`.

**P1-11 · Lệch giữa trang: Căn giá tốt dựa trên một căn đang có thẻ Ghép căn chờ quyết.**
- Ví dụ: căn 76 m², 5,5 tỷ ở `/ops/deals` («−29,6%», tab Còn thiếu) cũng là Tin A của thẻ Ghép căn #105729 đang chờ 8
  ngày (AI «chưa chắc», diện tích lệch 10,5%).
- Hai trang không nhắc nhau: người gọi điện không biết căn đang có thể là một căn trùng.
- Căn cứ: ADR-0013 (tin → căn), CG6.

### P2

- **P2-1 · Chữ cũ trái quyết định mới.**
  - Nhánh cloud của Hàng duyệt viết «giữ bằng chứng thô của nguồn (tầng A) nên không lên máy chủ». ADR-0007 sửa ngày
    26/10 và ADR-0015 đã cho thẻ duyệt lên cloud cho vai ops. Đúng ra phải là «chưa có (TV13)», không phải «không được».
  - `CONTEXT.md` mục «Ảnh tin» còn ghi «chỉ admin thấy, không lên máy chủ».
  - `CONTEXT.md` mục «Gắn nhãn» còn ghi «chín trường lõi» (nay là 24 ô).
- **P2-2 · Xưng hô không thống nhất.** Hàng duyệt dùng «bạn», Gắn nhãn dùng «Anh đã gắn hết…», «Vai của anh…». Chữ UI nên
  trung tính hoặc theo một quy ước trong `copy-vi.md` (hiện chưa có mục xưng hô).
- **P2-3 · Nhãn quyết định không khớp nhau.** Nút: «Khác căn», «Bỏ», «Để sau», «Không chắc». Trạng thái sau khi quyết: «Từ
  chối», «Hoãn». Nên giữ một cặp nhãn cho mỗi trạng thái.
- **P2-4 · Mobile 375: chân sheet chiếm nhiều chỗ.** Chân sheet (ô Lý do 80 px + mô tả + hàng nút) cao 209/812 px (26%
  khung nhìn), thân thẻ còn khoảng 470 px. Nên thu ô Lý do thành một dòng, mở rộng khi gõ (`m-light-review-sheet.png`).
- **P2-5 · Hàng duyệt tải toàn bộ `review_queue` (676 dòng kèm evidence, media, context) trong một truy vấn không giới
  hạn.** Hôm nay còn dưới 1 giây; tới vài nghìn thẻ sẽ chậm. Nên chia trang ở máy chủ như `/ops/people`.
- **P2-6 · `/ops/ai-calls` hiện «0 đ» cho 9 nhóm chưa có giá model.** Đọc dễ nhầm là miễn phí. Nên ghi «chưa có giá»
  (gắn với hàng giá Gateway PL31).
- **P2-7 · Không có trang đọc nhật ký quyết định.** `ops_audit` ghi lý do nhưng không có màn xem lại ai quyết gì, tỉ lệ
  duyệt và trả theo loại, hay để đảo một quyết định (ADR-0015 yêu cầu «hoàn tác là một lệnh đảo»).
- **P2-8 · Trạng thái trống của Gắn nhãn là một lệnh shell.** Hợp với Mạnh ở máy thu, không hợp với đội vận hành từ xa
  (quyết định 25/10).

**Đạt** (không cần sửa):
- Mọi trang Ops có trạng thái tải (Skeleton trong Suspense), lỗi tại chỗ (`RegionError` có Thử lại) và trống có hành
  động (trừ P2-8).
- Không trang nào cuộn ngang ở 375 px.
- Chế độ tối dùng token đúng, không thấy mảng màu thô (`d-dark-*.png`, `m-dark-*.png`).
- Badge trạng thái dùng biến thể `*-light`. Nút đóng sheet có nhãn tiếng Việt. Bộ chọn căn cứ và ô «không suy ra được»
  có `aria-label`.

---

## (c) Gói việc ứng viên cho lộ trình

Giám sát cắt thành hàng. Mỗi gói ghi câu giao, tiêu chí đo được, ước công và phụ thuộc. Mã hàng đã có thì ghi để không
cắt trùng.

### Gói A — Hàng duyệt chảy lại (P0-1, P1-7, P1-8) · T2 · khoảng 1,5 ngày

- **Câu giao:** Người duyệt quyết một thẻ và sang ngay thẻ kế, theo thứ tự cũ nhất trước, không phải đóng và mở lại.
  Hoãn không cần lý do.
- **Gồm:**
  - HD8 (tự sang thẻ kế; phím tắt `J`/`K` để di chuyển, `1`/`2`/`3` để quyết);
  - sắp mặc định theo `created_at` tăng dần;
  - `PageHeader` với ba số (chờ · quá 3 ngày · đã quyết hôm nay);
  - lý do soạn sẵn dạng chip cho «Khác căn» và «Bỏ».
- **Tiêu chí:**
  - đo lại kiểu audit 30/10 trên 20 thẻ: trung vị dưới 20 giây/thẻ (từ 52 giây);
  - 0 lần đóng sheet giữa hai thẻ;
  - quyết định vẫn có `decision_note` và `ops_audit` cùng giao dịch.
- **Phụ thuộc:** không. Dùng lại khung UI1, không cần migration.

### Gói B — Tách phép đo khỏi hàng duyệt (P0-2) · T2 · khoảng 1 ngày

- **Câu giao:** Thẻ Đối chiếu (chỉ ghi nhật ký) rời Hàng duyệt sang một lát chấm mẫu. Hàng duyệt chỉ còn thẻ mà quyết
  định đổi dữ liệu.
- **Tiêu chí:**
  - 0 thẻ chỉ-đối-chiếu ở trạng thái chờ của Hàng duyệt;
  - lát chấm lấy mẫu ngẫu nhiên có seed, khoảng 30 thẻ/tuần;
  - tỉ lệ «AI đúng / bộ đọc đúng» báo ở `/ops/quality`;
  - 239 thẻ hiện có chuyển trạng thái kèm lý do có tên và vết audit, chạy lại không chuyển trùng.
- **Phụ thuộc:** Mạnh chốt câu hỏi Q1 (d). Có thể cần thêm một giá trị trạng thái (migration nhỏ).

### Gói C — Thẻ đủ để quyết trên một màn (P1-1 … P1-6) · T2 · khoảng 2 ngày

- **Câu giao:** Mỗi thẻ cho thấy trước → sau, câu trích căn cứ tô trong toàn văn, nguồn và khu vực trên danh sách. Không
  còn điểm Stage B hay mã thô.
- **Gồm:**
  - gọt `score` khỏi `title` (sửa ở `judge-run` và ở lớp đọc);
  - so trên số đã làm tròn theo đơn vị hiện;
  - cột Nguồn · Khu vực · Trường đề xuất · Tuổi;
  - nhãn và bộ lọc «Người» cho `data_quality`/`nguoi:` (thẻ Người), kèm liên kết tới `/ops/people/[partyKey]` và hồ sơ
    tin;
  - ảnh hỏng gom thành một dòng.
- **Tiêu chí:**
  - 0 thẻ chờ có chữ `score` hay số thập phân Stage B trong HTML;
  - 0 hàng «Lệch» khi hai ô hiện cùng chữ;
  - 27/27 thẻ Người có nhãn tiếng Việt và liên kết;
  - thẻ Bổ sung tin hiện giá trị hiện hành cho 100% trường đề xuất.
- **Phụ thuộc:** gần với PL23 (thẻ duyệt v2). Đề xuất gộp vào PL23 hoặc cắt PL23 thành hai nấc (nấc 1 = gói này, nấc 2
  = phát biểu theo lớp và bất đồng mọi cặp).

### Gói D — Gắn nhãn hợp với một người và lớp nháp (P1-9, P1-10, P2-8) · T2 · khoảng 1,5 ngày

- **Câu giao:** Màn gắn nhãn co theo ý định tin, ẩn đo đồng thuận khi lát chỉ có một người, và (nếu Mạnh chọn) hiện lớp
  nháp hoặc bạc có nhãn riêng để duyệt.
- **Tiêu chí:**
  - bài «Không phải tin rao» lưu được sau 1 ô + căn cứ (từ 24 ô);
  - ô Đồng thuận ẩn hoặc ghi «cần người thứ hai» khi số người gắn < 2;
  - nếu có lớp nháp: nháp không bao giờ ghi vào `eval_labels` dưới tên người, đếm được tỉ lệ giữ nháp mỗi ngày.
- **Phụ thuộc:** câu hỏi Q2 và Q3 (d); KC1 (`silver_labels` đã có).

### Gói E — Nối trang và chữ theo quyết định mới (P1-11, P2-1 … P2-3, P2-6) · T1 · khoảng nửa ngày

- **Câu giao:** Căn giá tốt báo khi căn đang có thẻ Ghép căn chờ quyết. Chữ trên Hàng duyệt, Gắn nhãn, `CONTEXT.md` khớp
  ADR-0007 sửa 26/10, xưng hô và nhãn quyết định thống nhất.
- **Tiêu chí:**
  - mọi căn ở `/ops/deals` có thẻ Ghép căn chờ quyết đều mang badge «Đang chờ ghép» kèm liên kết;
  - grep «chín trường», «không lên máy chủ» (ở ngữ cảnh thẻ, ảnh) ra 0;
  - `copy-vi.md` có mục xưng hô.
- **Phụ thuộc:** không.

### Gói F (chân trời, đã có hàng) — Duyệt trên cloud

- TV4 → TV13 → UI12 giữ nguyên thứ tự trong lộ trình. Gói A và C nên xong trước TV13, để thứ đưa lên cloud là một
  màn duyệt nhanh chứ không phải màn 52 giây/thẻ.
- Thêm vào TV13 một tiêu chí: trang đọc nhật ký quyết định (P2-7) phải có trước khi đội vận hành từ xa duyệt, vì cần
  xem lại và đảo được.

### Gói G — Duyệt theo hạng mục (lượt 2: e1–e9) · T2, phần ghi `mo_luc` · khoảng 3 ngày, cắt được thành 3 hàng

- **Câu giao:** Người duyệt chọn một hạng mục (ý định, giá, điền ô, ghi đè, Người, Ghép căn) và quyết liền từng thẻ bằng
  một phím: câu hỏi, câu trích đã tô và đáp án nằm trong 400 px đầu; quyết xong tự sang thẻ kế, hoàn tác được trong
  5 giây.
- **Ba hàng gợi ý:**
  - **G1 — Hộp hạng mục + chế độ duyệt.** Gồm HD8; thêm `?the=`, phím `J`/`K`/`1–4`/`⌘↵`, hoàn tác 5 giây, ghi
    `mo_luc`/`quyet_luc`.
  - **G2 — Đáp án theo câu hỏi cho từng hạng mục.**
    - Đối chiếu: Bộ đọc / AI / Cả hai sai / Bài nhiều căn.
    - Bổ sung tin: hàng trước → sau, ✓/✗ từng trường.
    - Người: hai cột so, có liên kết hồ sơ.
    - Ghép căn: chỉ hàng khác nhau trước.
    - Chip lý do theo hạng mục.
    - Phần ✓/✗ từng trường cần đổi route decide, nên phần đó là T3.
  - **G3 — Máy rút thẻ trùng giá trị đang lưu** (khuôn HD3) **+ «Thẻ luật»** (e8, chờ Q6).
- **Tiêu chí:**
  - đo bằng `mo_luc`/`quyet_luc` trên 7 ngày;
  - trung vị giây/thẻ: H1 ≤ 5, H4 ≤ 6, H5 ≤ 12, H8 ≤ 30, H9 ≤ 45;
  - 0 thẻ chờ có mọi trường đã bằng giá trị đang lưu;
  - 100% phán quyết đối chiếu ghi rõ bên đúng;
  - hàng tồn 651 thẻ về dưới 60 thẻ trong 2 tuần.
- **Phụ thuộc:** gói A và C nằm trong G1 và G2. Nếu cắt G thì không cắt A và C riêng. Nên tách khỏi PL23 thành nấc 1
  của PL23.

**Thứ tự gợi ý:** E (nhanh, gỡ chữ sai) → G1 → G2 → G3 → B → D. F theo lộ trình đã có.

---

## (e) Phân tích sâu theo hạng mục duyệt (lượt 2, 07/11)

Mạnh yêu cầu thêm: phân tích từng hạng mục duyệt. Với mỗi hạng mục, một người bình thường cần UX/UI gì để quyết nhanh
và đi tiếp nhanh nhất, vì năng suất chính là số giây họ đứng ở mỗi màn cho tới khi quyết được.

**Cách đo lượt 2.**
- Tách 651 thẻ chờ thành hạng mục theo **câu hỏi mà người duyệt thật sự trả lời**, không theo `item_type`.
- So giá trị đề xuất với giá trị đang lưu trong `sale_offers`.
- Mở thẻ mẫu của từng hạng mục, đo vị trí bằng chứng trên màn (1440×900 và 375×812). Ảnh `hm-d-*.png`, `hm-m-*.png`.
- Nhịp gắn nhãn tính từ `eval_labels.labeled_at`.

### e0. Mô hình năng suất

Thời gian một thẻ gồm ba phần:

- **Tìm** = mở được thẻ cần làm. Hôm nay: đóng sheet → tìm hàng → bấm.
- **Hiểu** = đọc đủ bằng chứng để biết câu trả lời.
- **Ghi** = chọn đáp án → gõ lý do → bấm.

Audit 30/10 đo tổng là 52 giây/thẻ. Hiện trạng làm cả ba phần chậm:

- **Tìm.**
  - Không có đường dẫn tới một thẻ (`?the=`), không phím tắt, không tự sang thẻ kế.
  - Thẻ Ghép căn #105729 nằm ở **trang 33/33** khi không lọc: người duyệt phải bấm «Trang sau» 32 lần mới tới.
  - Hạng mục giá trị nhất (Ghép căn nuôi «Một Căn Nhà») bị chôn dưới 617 thẻ Bổ sung tin.
- **Hiểu.**
  - 0 liên kết trong mọi sheet đã đo (không tới tin, người, bài gốc).
  - Câu trích không được tô trong toàn văn.
  - Thẻ Ghép căn dài **2,2 màn** ở desktop và **4,6 màn** ở mobile, toàn văn bắt đầu ở y = 1038 px, dưới nếp gập.
- **Ghi.**
  - Lý do bắt buộc bằng gõ tự do: 20–60 phím mỗi thẻ.
  - Không có lý do soạn sẵn, không có cách hoàn tác.

Ba nguyên tắc dùng cho mọi hạng mục bên dưới:

1. **Câu hỏi – bằng chứng – đáp án nằm trong 400 px đầu.** Một dòng câu hỏi, câu trích đã tô, rồi các nút đáp án. Toàn
   văn, ảnh, siêu dữ liệu gập lại, mở khi cần.
2. **Một phím một quyết định.** Đáp án đánh số `1` `2` `3`, lý do soạn sẵn theo hạng mục (chip, cũng có số), `J`/`K` để
   đi tới và lùi. Không phải rời bàn phím.
3. **Đáp án đúng ngôn ngữ của câu hỏi.** Ví dụ «Bộ đọc đúng / AI đúng / Bài nhiều căn», không phải «Ghi phán quyết /
   Bỏ». Nhãn đáp án chính là lý do mặc định.

### e1. Bảng hạng mục

| # | Hạng mục (câu hỏi thật) | Thẻ chờ | Hiện nay: màn · nút | Bằng chứng chính có trên nếp gập? | Mục tiêu giây/thẻ |
|---|---|---:|---|---|---:|
| H1 | **Đối chiếu ý định**: bài là tin rao, cần mua/thuê, hay không phải tin rao? | 133 | 1 màn · «Ghi phán quyết / Bỏ / Để sau» | Có, nhưng đáp án không nói bên nào đúng | 3–5 |
| H2 | **Đối chiếu giá**: giá bộ đọc hay giá AI đúng? | 131 | 1–1,4 màn · như H1 | Có trích (trung vị 15 ký tự); không tô trong toàn văn | 4–6 |
| H3 | **Đối chiếu diện tích** | 10 | như H2 | như H2 | 4–6 |
| H4 | **Điền ô trống**: điền giá trị đề xuất vào trường đang trống? | 141 | 1 màn · «Áp dụng / Bỏ / Để sau» (cả thẻ) | Có giá trị đề xuất; **không** có chữ «đang trống» | 4–6 |
| H5 | **Ghi đè**: thay giá trị đang có bằng giá trị mới? | 155 | như H4 | **Không** hiện giá trị đang có, nên người duyệt không biết mình đang ghi đè | 8–12 |
| H6 | **Trùng giá trị đã có** (đề xuất = giá trị đang lưu) | 82 | như H4 | Không cần người | 0 (rút máy) |
| H7 | **Luật và AI khác nhau**: chọn bên nào? (giao với H4/H5) | 87 | 1–2 màn · chọn bên rồi «Áp dụng» | Có hai giá trị + căn cứ luật; căn cứ AI chỉ là tên tệp trace | 6–10 |
| H8 | **Gộp Người**: các tài khoản/SĐT này là một người? | 27 | 1–1,5 màn · «Gộp / Giữ tách / Hoãn» | Có bảng; **không** có chữ bài, không liên kết hồ sơ người | 15–30 |
| H9 | **Ghép căn**: hai tin là cùng một căn? | 7 | 2,2 màn (mobile 4,6) · «Cùng căn / Khác căn / Không chắc» | Bảng so có; ảnh và toàn văn dưới nếp gập | 30–45 |
| H10 | **Gắn nhãn S03** (màn khác: `/ops/labels`) | 316 chưa gắn | 24 ô × căn cứ | Bài và ảnh dính đầu | 90 (từ 220) |

H1+H2+H3 = 274 lượt đối chiếu trên 269 thẻ (5 thẻ có hai khối). H4+H5+H6 = 378 thẻ có trường đề xuất. Tổng thẻ Bổ sung
tin = 239 thẻ chỉ có đối chiếu + 378 = 617.

### e2. H1 — Đối chiếu ý định (133 thẻ)

**Số đo.**
- 123/133 thẻ là cùng một kiểu: bộ đọc nói «tin rao», AI nói «cần mua/thuê».
- 10 thẻ còn lại: AI nói «không phải tin rao».
- Câu trích trung vị 15 ký tự, p90 35 ký tự.

**Người thường cần**: câu trích (ví dụ «cần thuê gấp…»), dòng chứa nó và một dòng trước một dòng sau, tên nhóm.

**Đề xuất.**
- Câu hỏi một dòng: «Bài này là: tin rao · cần mua/thuê · không phải tin rao?». Ba đáp án `1` `2` `3` mang nhãn ý định
  trong `CONTEXT.md`.
- Bỏ khái niệm «bộ đọc/AI» khỏi mặt thẻ. Người chọn ý định đúng, máy tự suy ra bên nào đúng. Đáp án thành **nhãn đo**
  (mục tiêu của PL23) thay vì «phán quyết» mơ hồ.
- Toàn văn gập, câu trích tô vàng trong đoạn ±1 dòng.
- Gom thẻ theo nhóm: nhóm cùng kiểu bài thì người đọc nhanh dần.
- Lý do mặc định là nhãn đáp án; chỉ gõ khi muốn ghi thêm.
- Vì là phép đo (mục P0-2), chỉ cần **mẫu 30 thẻ/tuần**, không cần duyệt hết 133 thẻ.

**Mục tiêu**: 3–5 giây/thẻ, một phím.

### e3. H2/H3 — Đối chiếu giá và diện tích (141 thẻ)

**Số đo**: tỉ lệ giá AI/bộ đọc gom thành vài cụm rất rõ:

| AI so với bộ đọc | Số thẻ | Người đọc là hiểu ngay |
|---|---:|---|
| gấp 1.000 lần | 27 | Đơn vị tỷ/triệu bị nhân |
| nhỏ hơn 300–1.000 lần | 24 | Một bên đọc «tr» thành tỷ, hoặc ngược lại |
| gần nhau (0,85–1,2) | khoảng 10 | Hai giá trong bài (giá thấp và giá cao, hay hai căn) |
| khác hẳn | phần còn lại | Thường là **bài nhiều căn** (ví dụ #206667: bảng 5 căn thuê + 5 căn bán; bộ đọc lấy 4,50 tỷ, AI lấy 13 tr; cả hai «đúng» cho căn khác nhau) |

**Người thường cần**:
- hai giá trị **cùng một đơn vị** (ví dụ «4,50 tỷ · 0,013 tỷ») kèm một chữ «lệch ×1000»;
- câu trích tô trong bài;
- biết bài có nhiều dòng giá hay không (đếm số dòng có giá).

**Đề xuất.**
- Đáp án: `1` Bộ đọc đúng · `2` AI đúng · `3` Cả hai sai · `4` Bài nhiều căn.
- Đáp án `4` nối với PL18 (nhiều căn) và GT2, đưa bài sang hàng tách căn thay vì đóng.
- Đầu thẻ có chip tự sinh «Lệch ×1000», «Bài có 10 dòng giá».

**Mục tiêu**: 4–6 giây/thẻ. Riêng cụm ×1000 có thể dồn thành một lần quyết về **luật đơn vị** (xem e8).

### e4. H4/H5/H6 — Bổ sung tin: điền, ghi đè, trùng (378 thẻ)

**Số đo** (so giá trị đề xuất với `sale_offers` hiện tại):

| Trường | Đề xuất | Đang trống | Đã bằng giá trị đề xuất | Ghi đè giá trị khác |
|---|---:|---:|---:|---:|
| Loại hình | 340 | 34 | 164 | 142 |
| WC | 83 | 83 | 0 | 0 |
| Toà | 79 | 54 | 18 | 7 |
| Phòng ngủ | 62 | 3 | 47 | 12 |
| Đường | 6 | 6 | 0 | 0 |

Ở cấp thẻ:
- **82 thẻ** mọi trường đã bằng giá trị đang lưu: quyết hay không cũng không đổi gì (H6).
- **155 thẻ** có ít nhất một trường ghi đè giá trị đang có (H5).
- **141 thẻ** chỉ điền ô trống (H4).

Mẫu ghi đè lớn nhất là «Căn hộ → Nhà riêng» với 108 trường. Trong đó **78 trường do một luật từ khoá đọc tên nhóm**
(«nhà phố» trong tên nhóm → nhà riêng): cùng một căn cứ, lặp 78 lần.

**Lỗi UX đo được trên màn.**
- Thẻ **không hiện giá trị đang có**. Người duyệt thẻ ghi đè không biết mình đang đổi «Căn hộ» thành «Nhà riêng».
- «Áp dụng» là **tất cả hoặc không**. Thẻ #213472 đề xuất Loại hình = Nhà riêng (đúng, bài «nhà 6 tầng») cùng
  Đường = «Hoàng Mai». Hoàng Mai là tên quận, không phải đường, nên trường này sai. Người duyệt hoặc áp cả trường sai, hoặc
  bỏ cả trường đúng. Ô chọn từng bên hiện chỉ có cho trường xung đột.
- Căn cứ AI chỉ là «LLM qwen27b · trace …jsonl». Muốn biết vì sao phải tự dò toàn văn.

**Đề xuất.**
- H6: máy **rút** 82 thẻ trùng kèm lý do có tên «đã bằng giá trị đang lưu» (khuôn của HD3). Không đưa tới người.
- Mỗi trường là một hàng **trước → sau**: `Căn hộ → Nhà riêng`, `— → 2 WC`. Mỗi hàng có ✓/✗ riêng, mặc định ✓ cho điền ô
  trống, **không mặc định** cho ghi đè, buộc nhìn.
- Câu trích AI dùng (khi có) đặt ngay dưới hàng, tô trong toàn văn.
- Sắp hàng chờ: H5 (ghi đè, rủi ro cao) trước H4 (điền, rủi ro thấp).
- Nút một phím: `A` áp các hàng đang ✓, `X` bỏ cả thẻ.

**Mục tiêu**: H4 4–6 giây (đa số một trường, một phím), H5 8–12 giây.

### e5. H7 — Luật và AI khác nhau (87 thẻ)

**Màn hiện tại.**
- Hai ô (Theo luật / Theo AI) rồi ba nút «Chọn luật / Chọn AI / Bỏ cả hai», rồi phải bấm «Áp dụng»: **2 bấm + lý do**.
- Căn cứ luật đọc được ngay («từ khoá «chung cư» trong tên nhóm»). Căn cứ AI thì không.

**Đề xuất.**
- Chọn bên là quyết luôn: `1` luật, `2` AI, `3` bỏ cả hai. Không cần bấm «Áp dụng» thứ hai khi thẻ chỉ có trường xung đột.
- Đặt đoạn bài mà AI dựa vào (ví dụ «Bán nhà … 6 tầng») cạnh căn cứ luật, để so hai câu thay vì một câu với một tên tệp.

**Mục tiêu**: 6–10 giây/thẻ.

### e6. H8 — Gộp Người (27 thẻ)

**Số đo**: 12 thẻ «1 tài khoản · 2 SĐT», 11 thẻ «2 tài khoản · 1 SĐT», 4 thẻ lớn (3–7 tài khoản).

Người thường quyết gộp hay tách dựa vào:
- tên hai tài khoản có giống không;
- SĐT có phải số tổng đài của một sàn không (một số, nhiều người, nhiều khu);
- phong cách bài (chữ ký, mẫu bài) và khu vực rao có trùng không.

Thẻ hiện chỉ có bảng tài khoản/SĐT + «Tin mẫu» dạng `offer_<băm>`. **Không có chữ bài, không có khu vực, không có liên
kết** tới `/ops/people/[partyKey]`.

**Đề xuất.**
- Hai cột cạnh nhau, mỗi cột một tài khoản hoặc SĐT, cùng các hàng:
  - tên, số tin;
  - khu vực rao nhiều nhất;
  - hai dòng đầu của 2 bài gần nhất;
  - nhãn «Có thể là môi giới».
- Tô chữ trùng giữa hai cột (tên, chữ ký cuối bài).
- Thẻ lớn (3+ tài khoản) cho chọn từng hàng để gộp, không chỉ gộp hết hoặc tách hết.
- Liên kết «Mở hồ sơ» cho từng người.

**Mục tiêu**: 15–30 giây/thẻ.

### e7. H9 — Ghép căn (7 thẻ, giá trị cao nhất)

**Màn hiện tại** (#105729):
- Bảng so 11 hàng lên trước; ảnh và toàn văn hai tin nằm dưới. Desktop dài 2,2 màn, mobile 4,6 màn.
- Câu hỏi khó nhất (cùng căn?) cần nhìn ảnh và mô tả cùng lúc, mà hai thứ đó lại nằm xa nhau nhất.
- Hàng «Lệch» do làm tròn (P1-2) và điểm Stage B trên tiêu đề (P1-1) đánh lạc hướng.

**Đề xuất.**
- Bố cục hai cột Tin A | Tin B: ảnh đầu tiên → 5 hàng chốt → hai dòng đầu bài. Hiện **chỉ hàng khác nhau** trước, hàng
  khớp gập lại «8 hàng khớp».
- Tín hiệu loại trừ đặt lên đầu thành Alert, khi có: «khác loại hình», «khác toà», «diện tích lệch >10%». Thẻ #105729 là
  nhà tập thể so với chung cư, diện tích lệch 10,5%: người đọc một dòng là quyết «Khác căn».
- Hàng chờ đặt **Ghép căn lên đầu** (ít thẻ, giá trị cao, tuổi 8 ngày).

**Mục tiêu**: 30–45 giây/thẻ. Đây là hạng mục duy nhất đáng tốn thời gian đọc.

### e8. Quyết theo căn cứ: một quyết định cho cả loạt

Ba loạt thẻ có **cùng một căn cứ máy**:

- 78 thẻ có cùng luật từ khoá tên nhóm «nhà phố → nhà riêng»;
- 27 thẻ giá lệch đúng ×1000;
- 123 thẻ cùng mẫu «tin rao ↔ cần mua».

Duyệt từng thẻ trong các loạt này là bắt người làm lại một việc máy nên hỏi một lần: **luật này đúng không?**

Đề xuất một loại thẻ mới, **«Thẻ luật»**:
- Hiện căn cứ, số thẻ bị ảnh hưởng và 5 bài mẫu chọn ngẫu nhiên (có seed).
- Người quyết luật:
  - «Giữ luật»: các thẻ còn lại đi tiếp như đề xuất có căn cứ đã được người xác nhận;
  - «Bỏ luật»: trả lại cả loạt, và luật E1 được sửa qua migration hoặc commit có tên.
- Việc này khác «duyệt hàng loạt» (GD10, Mạnh đã loại): người không duyệt N thẻ mà sửa **một luật xác định** (luật 7
  cho phép), có mẫu làm bằng chứng.

Cần Mạnh xác nhận ranh giới này (câu hỏi Q6).

### e9. Điều hướng: đi nhanh giữa các thẻ

| Hiện nay | Đề xuất |
|---|---|
| Một bảng 651 dòng, hai bộ lọc thả xuống, mới nhất trước | **Hộp theo hạng mục**: cột trái liệt H1…H9, mỗi mục ghi số thẻ chờ, tuổi thẻ cũ nhất và giây/thẻ gần đây. Bấm một mục thì vào **chế độ duyệt** |
| Sheet đè trên bảng, quyết xong vẫn đứng ở thẻ cũ | **Chế độ duyệt** toàn khung: một thẻ, tiến độ «12/133», tự sang thẻ kế (HD8), tải trước thẻ kế |
| Không có đường dẫn tới thẻ | `/ops/review?the=<id>` và lọc theo hạng mục qua URL (slug phải thêm vào `CONTEXT.md`) |
| Không phím tắt | `J`/`K` (hoặc `↓`/`↑`) đi tới và lùi, `1`–`4` chọn đáp án, `R` vào ô lý do, `⌘↵` gửi, `?` hiện bảng phím. Phím chữ chỉ chạy khi tiêu điểm không ở ô nhập |
| Lý do gõ tay bắt buộc | Chip lý do soạn sẵn theo hạng mục (`Q`/`W`/`E`), nhãn đáp án là lý do mặc định. Ô tự do vẫn bắt buộc khi chọn «Cả hai sai» hay ghi đè |
| Không hoàn tác; sai thì phải chờ UI12 | **Hoàn tác 5 giây**: toast «Đã ghi #123 · Hoàn tác». Lệnh gửi lùi 5 giây ở trình duyệt, nên không đổi API. Nhờ vậy bỏ được bước «nghĩ lại» trước khi bấm |
| Không đo thời gian mỗi thẻ | Ghi `mo_luc` (lúc mở) và `quyet_luc` (lúc quyết) vào `ops_audit.detail`, để báo **giây/thẻ theo hạng mục** mỗi ngày (luật 11: đo trước khi dựng tiếp) |

### e10. H10 — Gắn nhãn S03 (màn `/ops/labels`)

**Số đo.**
- Trung vị **220 giây/thẻ** (tứ phân vị 111–407 giây), tính trên 50 thẻ ngày 05–06/11, **có nháp điền sẵn**.
- Biểu mẫu 24 ô, mỗi ô thêm 5 nút căn cứ và một ô «không suy ra được».
- Tần suất bài có nêu từng trường, trên 50 nhãn:

| Trường | Bài có nêu |
|---|---:|
| Ý định | 100% |
| Dự án | 90% |
| Phòng ngủ | 86% |
| Toà | 66% |
| Diện tích | 64% |
| WC | 58% |
| SĐT | 54% |
| Trục | 32% |
| Tên người bán | 30% |
| Tầng | 16% |

**Đề xuất.**
- **Biểu mẫu co theo ý định.**
  - «Không phải tin rao»: 1 ô rồi lưu (khoảng 10 giây).
  - «Cần mua/thuê»: 8 ô.
  - «Tin rao»: đủ ô.
- **Xếp ô theo tần suất.** Các trường bài hiếm nêu (Tầng, Trục, Tên) gom vào «Thêm», mặc định gập. Chân dính tính
  «đã điền» trên số ô đang hiện, không trên 24.
- **Bôi để điền.** Bôi chữ trong bài rồi bấm ô (hoặc nhấn phím số của ô): ô nhận giá trị, căn cứ tự đặt «Chữ». Đây là
  thao tác phổ biến nhất mà hôm nay phải gõ lại bằng tay.
- `Tab` đi tới ô kế, phím số chọn đáp án trong nhóm nút, `⌘↵` lưu rồi sang bài kế. Ảnh bài phóng to được ở cột trái dính.

**Mục tiêu**: 90 giây/thẻ cho tin rao, 10 giây cho bài không phải tin rao.

### e11. Kịch bản: hàng tồn hôm nay mất bao lâu

| Hạng mục | Thẻ | Hôm nay (52 giây/thẻ) | Sau đề xuất |
|---|---:|---:|---:|
| H6 trùng giá trị | 82 | 71′ | 0 (máy rút) |
| H1–H3 đối chiếu | 239 | 3 giờ 27′ | 30 thẻ mẫu × 5 giây = 3′ mỗi tuần |
| H4 điền ô trống | 141 | 2 giờ 2′ | 141 × 5 giây = 12′ |
| H5 ghi đè | 155 | 2 giờ 14′ | 77 × 10 giây + 1 thẻ luật (78 thẻ) ≈ 14′ |
| H8 Gộp Người | 27 | 23′ | 27 × 25 giây = 11′ |
| H9 Ghép căn | 7 | 6′ | 7 × 40 giây = 5′ |
| **Tổng** | **651** | **≈ 9 giờ 24′** | **≈ 45′** |

H7 (xung đột) nằm trong H4/H5 nên không cộng riêng. Số «sau đề xuất» là mục tiêu để đo lại bằng `mo_luc`/`quyet_luc`,
chưa phải số đo.

---

## (d) Câu hỏi cần Mạnh quyết

1. **Thẻ Đối chiếu (239 thẻ, chỉ ghi nhật ký):**
   - (a) rút khỏi Hàng duyệt, chuyển thành lát chấm mẫu (gói B) — em đề xuất;
   - (b) giữ trong Hàng duyệt nhưng tách bộ lọc và bỏ bắt lý do;
   - (c) giữ như nay.
2. **Lớp nháp ở màn Gắn nhãn:** sổ gắn nhãn 06/11 ghi hai hướng (đo mù, rồi «trợ lý điền nháp, Mạnh duyệt»). Màn có cần
   hiện nháp hoặc nhãn bạc như một lớp riêng để Mạnh duyệt, hay nháp vẫn điền qua trình duyệt như vòng 1?
3. **Thẻ gắn hai người khi chỉ có một người gắn:**
   - (a) tạm tắt 20% gắn hai người tới khi có người thứ hai — em đề xuất;
   - (b) giữ chờ người thứ hai;
   - (c) dùng nhãn bạc làm «người thứ hai» chỉ để đo, không trộn vào vàng.
4. **Lý do khi Hoãn hoặc Không chắc:** nới thành không bắt buộc (vẫn ghi audit)?
5. **Hàng tồn 617 thẻ Bổ sung tin** (tạo 30/10–07/11): duyệt tay dần sau gói A, hay trả lại hàng loạt các thẻ quá 7
   ngày để bộ đọc mới (PL30, ba model) sinh lại?

---

6. **«Thẻ luật» (e8):** quyết một lần cho cả loạt thẻ cùng một căn cứ luật E1 (ví dụ 78 thẻ «nhà phố» trong tên nhóm →
   nhà riêng), có 5 bài mẫu. Mạnh có coi đây là sửa luật xác định (được phép theo luật 7), khác với duyệt hàng loạt đã
   loại ở GD10, không?
7. **Hoàn tác 5 giây** thay cho hỏi lại trước khi quyết: lệnh gửi lùi 5 giây ở trình duyệt, không đổi API. Đồng ý dùng
   cho mọi hạng mục, kể cả Ghép căn?

## Phụ lục — câu đo (tái lập)

```sql
-- Thẻ theo loại × trạng thái, tuổi
SELECT item_type, status, count(*), round(avg(extract(epoch FROM now()-created_at)/86400)::numeric,1)
FROM review_queue GROUP BY 1,2;
-- Thẻ Bổ sung tin chờ: số trường, xung đột, chỉ đối chiếu
SELECT jsonb_array_length(evidence->'fields') nf, count(*),
       count(*) FILTER (WHERE evidence ? 'doi_chieu') doi_chieu
FROM review_queue WHERE item_type='agent_output' AND status='pending' GROUP BY 1;
-- Gắn nhãn: thẻ theo số người đã gắn
SELECT i.double_label, count(*) FILTER (WHERE n=0), count(*) FILTER (WHERE n=1), count(*) FILTER (WHERE n>=2)
FROM eval_label_items i LEFT JOIN LATERAL (SELECT count(DISTINCT labeler_id) n FROM eval_labels l
  WHERE l.item_id=i.item_id) x ON true WHERE lat='s03-theo-nhom' GROUP BY 1;
```

Ảnh (`research-local/soat-ops-0711/`): `d-light-*` (desktop sáng, 10 trang + 4 sheet), `d-dark-*`, `m-light-*`,
`m-dark-*` (375 px).
