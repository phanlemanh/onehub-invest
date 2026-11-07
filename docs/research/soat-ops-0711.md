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

### P1

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

**Thứ tự gợi ý:** E (nhanh, gỡ chữ sai) → A → C → B → D. F theo lộ trình đã có.

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
