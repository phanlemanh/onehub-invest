---
schema_version: 1
feature: Người vận hành đọc cổng Ops thấy nhãn theo CONTEXT.md, không chữ tiếng Anh hay mã thô, chi tiết kiểm chất lượng diễn giải tiếng Việt, tên thị trường có dấu đầy đủ
slug: ops-nhan-theo-context
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
approved_by: Mạnh
approved_at: 2026-10-24
design_doc: docs/superpowers/specs/2026-10-24-ops-nhan-theo-context-design.md
lo_trinh_ma: ON12
---

# Acceptance Contract: ops-nhan-theo-context

## Context

Hàng ON12 (OPS-17, gốc G6). Cổng Ops còn chữ trong cột _Avoid_ của CONTEXT.md (`Review Queue`, `Offers`, `Occupancy`,
`Market Score`…), chữ tiếng Anh («Heartbeat», «Job», «Lockdown»…), mã thô từ dữ liệu (tên kiểm `truthful-coverage`, chi
tiết `our=0 s02_active=…`, `active/retired`, `apartment`), tên thị trường S02 không dấu hoặc cụt («Quang Tr»), và nút
thanh bên mang sr-only «Toggle Sidebar». «Bảy trang Ops» = `/ops`, `/ops/collections`, `/ops/sources`, `/ops/deals`,
`/ops/quality`, `/ops/review`, `/ops/design`. Phạm vi quét tĩnh, danh sách giữ tiếng Anh, bảng nhãn cũ → mới và luật
«từ tiếng Anh» viết trước ở design doc §2.2, §3.1, §4. Hỏi-1…Hỏi-3 ở sổ; tiêu chí viết theo lối khuyến nghị.

## Criteria

- AC-1: Given CONTEXT.md (mọi dòng `_Avoid_` trừ cụm trong `_Allow_`) và danh sách tệp quét tĩnh viết trước ở design doc
  §3.1 (tệp lib quét một phần ghim theo tên hàm), When thước đọc cây cú pháp lấy mọi chuỗi hiển thị (text JSX, thuộc tính và
  khoá object hiển thị, `metadata.title`, chuỗi trong biểu thức con JSX; trừ `className`) — kể cả chuỗi trong `<code>`,
  `<kbd>` —, Then không chuỗi nào chứa một từ _Avoid_, và danh sách tệp đã quét in ra bằng đúng danh sách viết trước (thiếu
  tệp → đỏ nêu tệp); chiều đỏ: ba bản sao — tiêu đề `/ops/review` lại là `Review Queue`, mục thanh bên lại là
  `Hàng chờ duyệt`, chữ `Heartbeat` bọc trong `<code>` — mỗi bản thước báo đúng tệp, dòng và từ.
- AC-2: Given cùng phạm vi (trừ chữ trong `<code>`, `<kbd>`) và danh sách giữ tiếng Anh viết trước (từ ASCII trong nhãn in
  đậm của CONTEXT.md; mã `S0x`, `P0–P2`, `L1–L4b`; viết tắt và tên riêng ở design doc §2.2), When thước tách token chữ
  ASCII từ hai chữ cái trở lên không phải âm tiết tiếng Việt không dấu, Then không còn token nào ngoài danh sách giữ; ma
  trận phân loại viết trước — `Heartbeat`, `Job`, `market`, `offline`, `hanoi`, `hcmc` → báo; «Tin», «Xem», «thu»,
  «Listing», «Staging», «S02», «QR», «L4b», «Hà Nội», «Hồ Chí Minh», «24h», «m²», «tr/m²» → không báo —; chiều đỏ: bản
  sao thêm `Uptime 24h` và `title="Toggle"` → thước báo cả hai.
- AC-3: Given khung Ops, When render thật `OpsHeader` và `PageHeader` có đường dẫn, Then nút mở thanh bên có chữ sr-only
  «Mở hoặc gập thanh bên», đường dẫn mang `aria-label` tiếng Việt, và markup không chứa `Toggle Sidebar` hay
  `aria-label="breadcrumb"`; đối chứng: render `SidebarTrigger` của component đã cài thì phép đo thấy `Toggle Sidebar`
  (phép đo phân biệt được).
- AC-4: Given ma trận chi tiết viết trước — mỗi khuôn của bên ghi (`vi phạm: N`, `dòng toàn NULL: N`, `slug rỗng/lệch: N`,
  `7 ngày gần: X vs 7 ngày trước: Y`, `median ADR A vs B`, `snapshot cuối … (N ngày, SLO N)`, `chưa có snapshot`,
  `our=… s02_active=…(kỳ) universe=… history=…m coverage=…%|n/a captured_age=…d|n/a`, `0 giá trị ngoài vocabulary
  (a|b)`, `N giá trị ngoài vocabulary, ví dụ: X`, `N/M offers có loại hình`, `samples=…  avgF1=… <trường>=…`,
  `samples=0`, `chưa có crosswalk S02 nào`) cùng khuôn cũ `snapshot mới X vs trước Y (±d)` và `S02_active=` —, mọi tên kiểm
  của bên ghi và mọi dạng đối tượng (`market_metrics`, `listing_stats`, `areas`, `sale_offers[:S0x]`, `S0x/<mã>`, mã khu
  vực, `<mã thị trường>`, `all`, `regex`, `llm`), When gọi `dqCheckName`, `dqEntityLabel`, `dqDetail`, Then ra đúng câu
  tiếng Việt viết trước, không còn `\w+=` hay tên kiểm thô; khuôn lạ → chuỗi gốc kèm «(chưa diễn giải)»; mỗi khuôn trong ma
  trận còn tìm thấy trong tệp bên ghi của nó (đổi khuôn ở pipeline → ca đỏ nêu tệp).
- AC-5: (cross-layer) Given DB local, When nạp mọi dòng `dq_check_results` 7 ngày qua và bảng tên khu vực bằng ĐÚNG hàm nạp mà
  `/ops/quality` dùng rồi render thật bảng kiểm chất lượng (chỉ đọc), Then mọi tên kiểm, đối tượng và chi tiết đã diễn
  giải: không «(chưa diễn giải)», không `\w+=`, không tên kiểm thô, không mã khu vực `vn-…`; ca đọc in số dòng và số loại
  kiểm đã đo.
- AC-6: (cross-layer) Given DB local, When nạp thị trường S02 bằng `getAirdnaMarkets`, vòng thu bằng `readRotationPreview`
  và tên khu vực bằng hàm nạp của trang rồi render bảng thị trường S02 cùng vòng thu S02, Then mỗi thị trường S02 có tên
  tiếng Việt có dấu đầy đủ (không còn `Quang Tr`, `Binh Thu`, `Phan RangaThap Cham`, `Hanoi`, `Ho Chi Minh City`), cột
  «Khu vực của ta» hiện tên khu vực thay mã `vn-…` (link giữ nguyên), vòng thu không in `#<mã S02>`; mã chưa có trong từ
  điển → tên gốc kèm «(chưa có tên Việt)» (ma trận viết trước) và ca DB local báo mã đó.
- AC-7: (cross-layer) Given ma trận giá trị thô viết trước — trạng thái nguồn (`active`, `paused`, `completed`, `retired`,
  mã lạ), loại hình (6 giá trị + lạ), loại tin, độ tin trích xuất, đề xuất AI (`yes`, `no`), tên chỉ số hiệu chuẩn, mã
  thị trường độ tươi (`hanoi`, `hcmc`, `vn`, mã lạ) —, When gọi các bảng nhãn, rồi nạp bằng hàm nạp thật của trang
  (`getCoverageOverview`, danh mục nguồn, `getAirdnaComparison`) trên DB local và render danh mục nguồn, thẻ duyệt, cột thị
  trường tổng quan, Then ra nhãn tiếng Việt viết trước (thị trường bỏ tiền tố `Thành phố`/`Tỉnh`: `hanoi` → «Hà Nội»,
  `vn` → «Toàn quốc»); mã lạ → nhãn chung kèm mã trong `<code>`; mọi giá trị đang có trên DB local có nhãn.
- AC-8: Given app chạy TỪ worktree đang kiểm với DB local và một phiên admin tạm (tạo và xoá trong cùng lượt), When smoke
  GET 7 trang Ops và lấy chữ hiển thị từ HTML (text node kể cả sr-only, `title`, `aria-label`, `alt`, `placeholder`; bỏ
  `<script>`, `<style>`), Then cả 7 trang trả 200 và: (a) 0 từ _Avoid_ (kể cả trong `<code>`, `<kbd>`); (b) 0 từ tiếng Anh
  ngoài danh sách giữ (ngoài `<code>`, `<kbd>`); (c) 0 tên kiểm của bên ghi và 0 khuôn `\w+=\S` (kể cả trong `<code>`);
  (d) không `Toggle Sidebar`; (e) 0 mã khu vực `vn-…`, 0 token `vn` viết thường đứng riêng, 0 token snake_case; (f) 0 dấu
  dự phòng «(chưa diễn giải)», «(chưa có tên Việt)», «Loại thẻ khác», «Trường khác»; mỗi trang in danh sách chuỗi trong
  `<code>` của nó; chiều đỏ: chạy cùng bộ lọc trên HTML viết trước chứa `Review Queue`, `Heartbeat`, `truthful-coverage`,
  `our=0`, `<span class="sr-only">Toggle Sidebar</span>`, `vn-tinh-an-giang`, một ô chỉ chứa `vn`,
  `<code>Hàng chờ duyệt</code>` và «(chưa diễn giải)» → báo đủ chín mục.
- AC-9: Given CONTEXT.md, When đọc các khối thuật ngữ mới của hàng này (ít nhất «Khoá an toàn», «Lượt máy tự trả lời»,
  «Bộ canh», «Tín hiệu sống», «Danh sách cho phép», «Tác vụ», «Bài», «Máy chủ»), Then mỗi khối có nhãn · code · định nghĩa ·
  `_Avoid_` ghi chữ tiếng Anh cũ trên cổng Ops, định nghĩa khớp nghĩa vận hành đang dùng ở design doc §4. (judgment)
- AC-10: Given cột tên thị trường (bảng thị trường S02, độ phủ tham chiếu, tổng quan) và cột chi tiết kiểm chất lượng, When
  render thật bảng, Then không phần tử nào trong cả cây con của ô các cột đó (kể cả `td`) mang `truncate`,
  `whitespace-nowrap` hay `text-ellipsis`, và phần tử chứa chữ cho phép xuống dòng; đối chứng: một cột khác của cùng bảng
  vẫn có `truncate` ở đúng vị trí đó (phép đo phân biệt được).

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Trục: {chữ viết trong mã: _Avoid_ (AC-1), tiếng Anh (AC-2),
sr-only khung (AC-3)} · {chữ từ dữ liệu: kiểm chất lượng ma trận (AC-4) + DB thật (AC-5), tên thị trường (AC-6), giá trị
thô khác (AC-7)} · {trang chạy thật 7 trang (AC-8)} · từ vựng (AC-9) · cắt chữ (AC-10). Biên: khuôn chi tiết cũ còn trong 7
ngày, khuôn lạ, mã thị trường lạ, giá trị enum lạ, âm tiết tiếng Việt không dấu trùng chữ ASCII.

## Đường đo

- «Quét chữ hiển thị của 7 trang Ops: 0 từ _Avoid_, 0 mã thô DQ; sr-only thanh bên tiếng Việt» — smoke trang chạy thật
  `scripts/smoke-ops-nhan.mjs` · AC-8; thước tĩnh giữ trạng thái cây · AC-1, AC-2, AC-3.

## Out of scope

- Cổng Invest (`/vn/**`, `/listing/**`, …) — hàng này chỉ cổng Ops.
- Chọn dòng và nhãn trạng thái của bảng kiểm chất lượng (ON9); cấu trúc và số của vùng Hiệu chuẩn (ON10); cột trạng thái
  trên điện thoại 390px (ON13); bố cục hàng duyệt (UI1); số S02 trên trang Thu thập (ON6).
- Nội dung dòng nhật ký tác vụ, tên nhóm Zalo/Facebook, email, mã lỗi — dữ liệu, không dịch.
- Đổi tên kiểm hay khuôn chi tiết ở pipeline (chung tệp với NT7).
- Chữ ở nhánh chỉ có trên máy chủ (cloud) mà DB local không dựng được — thước tĩnh AC-1/AC-2 phủ chữ viết trong mã; chữ
  từ dữ liệu cloud không đo (hạn chế có tên).

## Notes

- Phép đo DB chỉ đọc; phiên admin tạm của smoke tạo và xoá trong cùng lượt (khuôn `smoke-portal-compliance.mjs`).
- Luật «từ tiếng Anh» dựa trên âm tiết tiếng Việt không dấu: chữ tiếng Anh trùng một âm tiết hợp lệ (vd «map», «can»)
  không bị báo, và token một chữ cái (đơn vị `h`, `m` của m²) không xét — hạn chế có tên.
- Chữ tiếng Anh trong `<code>`/`<kbd>` (tên tệp, khoá cấu hình, tên component ở `/ops/design`, dòng nhật ký) không tính ở
  luật (b); luật _Avoid_, tên kiểm và dấu dự phòng vẫn soi bên trong — chữ tiếng Anh cũ thành `_Avoid_` qua AC-9 nên bọc
  `<code>` không lách được.
