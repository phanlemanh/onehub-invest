# Nhãn cổng Ops theo CONTEXT.md (ON12 · `ops-nhan-theo-context`) — thiết kế

Hàng ON12 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, nhóm `ops-khung`, hạng T2). Câu giao: «Người vận hành đọc
cổng Ops thấy nhãn theo CONTEXT.md, không chữ tiếng Anh hay mã thô, chi tiết kiểm chất lượng diễn giải tiếng Việt, tên
thị trường có dấu đầy đủ». Ngưỡng (`bat_khi`): «Quét chữ hiển thị của 7 trang Ops: 0 từ trong cột _Avoid_ của
CONTEXT.md, 0 mã thô DQ; nhãn sr-only của thanh bên tiếng Việt». Gốc OPS-17 (G6).

Chỉ đổi CHỮ hiển thị. Không đổi bố cục, truy vấn chọn dòng, màu hay component — trừ ba chỗ nêu tên ở §2.6.

## 1. Hiện trạng (đọc mã + DB local 24/10, main 6ce4b60)

Bảy trang: `/ops`, `/ops/collections`, `/ops/sources`, `/ops/deals`, `/ops/quality`, `/ops/review`, `/ops/design`, cộng
khung chung (`components/shell/ops-shell/**`, `PageHeader`, trạng thái lỗi/trống). Bản kê đầy đủ ~110 chuỗi lấy bằng
thước nháp ở §3; nhóm chính:

| Nhóm | Ví dụ đang thấy | Chỗ |
|---|---|---|
| Từ _Avoid_ của CONTEXT.md | «Review Queue», «Hàng chờ duyệt», «Offers», «offers có bait_gap», «Occupancy», «Market Score», «Điểm thị trường», «giá thật», «vải công khai», «Loại BĐS», «thành phố», «tỉnh/TP» | review, nav, quality, collections, deals, design, sources |
| Chữ tiếng Anh | «Heartbeat», «Uptime», «Probe trễ», «Allowlist lệch membership», «Lockdown», «Agent-turn», «Job», «Staging» (là nhãn CONTEXT — giữ), «Rotation», «market», «raw», «post», «mock», «offline», «Registry», «retired», «session», «cloud», «admin», «median», «crosswalk», «Universe», «LTM», «HITL», «audit», «Queue trống — không có item» | collections, quality, review, sources, deals, design |
| Mã thô từ dữ liệu | tên kiểm `truthful-coverage`, `enum-vocab:price_tier`; đối tượng `market_metrics`, `S01/hanoi`, `vn-tinh-an-giang`; chi tiết `our=0 s02_active=50(2026-09) universe=90 history=36m coverage=0.00% captured_age=1d`, `samples=420 avgF1=0.966 kind=1.00 …`; trạng thái nguồn `active/paused/retired`; loại hình `apartment/house…`; đề xuất AI `yes/no`; tên chỉ số `Occupancy/Listings`; `ourAreaId` `vn-hanoi` làm chữ link; cột «Thị trường» ở tổng quan in `hanoi`/`vn` | quality, sources, review, overview |
| Tên thị trường không dấu / bị cắt | `airdna_markets.name`: «Hanoi», «Ho Chi Minh City», «Quang Tr», «Binh Thu», «Phan RangaThap Cham»; ô bảng `truncate` mặc định của data-grid cắt tên dài | quality (bảng thị trường S02), collections (vòng thu S02) |
| sr-only tiếng Anh | `SidebarTrigger` (component đã cài) ghép cứng `<span class="sr-only">Toggle Sidebar</span>`; `Breadcrumb` mặc định `aria-label="breadcrumb"` | khung Ops, `PageHeader` |

Dòng log cuối của tác vụ, tên nhóm Zalo/Facebook, email, mã lỗi (digest) là dữ liệu do máy hay người đặt — không dịch.

## 2. Thiết kế

1. **Nhãn theo CONTEXT.md.** Mỗi chuỗi trong §1 đổi theo bảng §4. Khái niệm chưa có trong CONTEXT.md → thêm khối thuật ngữ
   (nhãn · code · định nghĩa · `_Avoid_` ghi chữ tiếng Anh cũ) cùng commit. Nhờ đó chữ cũ thành từ _Avoid_ và thước §3.1
   giữ nó không quay lại.
2. **Danh sách giữ tiếng Anh (đóng).** Một từ ASCII trên chữ hiển thị được phép khi: (a) là từ trong nhãn in đậm của
   CONTEXT.md (máy rút: Listing, Snapshot, Staging, Canonical, ADR, RevPAR, Finder, Insight, Pipeline…); (b) là mã có khuôn:
   `S0x`, `P0–P2`, `L1–L4b`, cổng `:8009`; (c) nằm trong danh sách viết trước: viết tắt `SLO`, `KPI`, `QR`, `PN`, `WC`,
   `VN`, `AI`, `F1`, `tr` (triệu), `GMT` (múi giờ, ON8), `alt` (phím tắt thông báo) và tên riêng `Zalo`, `Facebook`, `OpenClaw`, `Kev`, `Ops` (trong «Cổng Ops»). Token một
   chữ cái (đơn vị `h` của «24h», `m` của «m²») không xét. Chữ tiếng Anh trong `<code>`/`<kbd>` (tên tệp, khoá cấu hình,
   tên component ở `/ops/design`, dòng nhật ký) không tính ở luật tiếng Anh — nhưng luật _Avoid_, tên kiểm và dấu dự phòng
   vẫn soi bên trong `<code>`; chữ tiếng Anh cũ thành `_Avoid_` (§2.1) nên bọc `<code>` không lách được.
3. **Diễn giải kiểm chất lượng** (`app/src/lib/dq-labels.ts`, thuần, không truy vấn): `dqCheckName(check)`,
   `dqEntityLabel(entity, areaNames)`, `dqDetail(check, detail)`. Tên kiểm và đối tượng tra bảng; chi tiết đọc theo khuôn
   CỦA BÊN GHI (`pipeline/sql/450_dq_checks.sql`, `dq-truthful-coverage.mjs`, `dq-enum-vocab.mjs`,
   `scripts/bench-extraction.mjs`) và khuôn cũ còn trong 7 ngày (`snapshot mới X vs trước Y (±d)`, `airdna_active=` đã che
   thành `S02_active=`), ra câu tiếng Việt, ví dụ:
   - `our=0 s02_active=50(2026-09) universe=90 history=36m coverage=0.00% captured_age=1d` → «Tự thu 0 · S02 đang hoạt
     động 50 (09/2026) · đã mua 90 · lịch sử 36 tháng · độ phủ 0,00% · số tham chiếu 1 ngày tuổi»;
   - `samples=420 avgF1=0.966 kind=1.00 priceVnd=0.99 …` → «420 mẫu · F1 trung bình 0,966 · loại tin 1,00 · giá 0,99 …»;
   - `0 giá trị ngoài vocabulary (P0|P1|P2)` → «0 giá trị ngoài danh sách cho phép (P0, P1, P2)»; giá trị enum đọc qua
     cùng bảng loại hình/loại tin/độ tin ở §2.5.
   Khuôn chưa biết → hiện chuỗi gốc trong `<code>` kèm «(chưa diễn giải)» — không đoán, và phép đo DB local (AC-5) báo
   tên kiểm đó. Không sửa pipeline: đổi tên ở bên ghi không đổi được dòng cũ trong 7 ngày; ON9 cũng chốt «đổi ở app».
   Phần chọn dòng và nhãn trạng thái của bảng là của ON9 — hàng này chỉ chạm cột Kiểm, Đối tượng, Chi tiết.
4. **Tên thị trường có dấu.** `app/src/lib/market-names.ts`: `s02MarketName(airdnaId, vendorName)` tra từ điển theo
   `airdna_id` (43 mã hiện có, tên tỉnh/địa danh có dấu đầy đủ; tên S02 cắt cụt «Quang Tr», «Binh Thu», «Phan RangaThap
   Cham» viết lại đúng); mã chưa có trong từ điển → tên gốc kèm «(chưa có tên Việt)» và phép đo DB local báo mã đó.
   `marketNameOf(code, areaNames)` đổi mã thị trường/khu vực (`hanoi`, `vn-tinh-an-giang`, `vn`) sang `areas.name` bỏ
   tiền tố «Thành phố »/«Tỉnh » («Hà Nội», «An Giang»; `vn` → «Toàn quốc») — tránh chữ _Avoid_ «thành phố» và gọn ô.
   Từ điển S02: «Ho Chi Minh City» → «Hồ Chí Minh», «Vung Tau City» → «Vũng Tàu». Bảng tên khu vực nạp bằng một hàm
   (`getAreaNames()` trong `ops-queries.ts`) mà mọi trang Ops dùng chung. Dùng ở: bảng thị trường S02 (cột tên + cột «Khu vực của ta» hiện tên thay
   slug, link giữ nguyên), vòng thu S02 (bỏ `#airdna_id`), cột «Thị trường» và ô tổng quan, đối tượng kiểm chất lượng.
   Ô tên thị trường và ô chi tiết kiểm được xuống dòng (lớp `whitespace-normal` qua `meta` của cột — không đổi component).
5. **Giá trị thô từ dữ liệu** qua bảng nhãn: trạng thái nguồn (`active` «Đang dùng», `paused` «Tạm dừng», `completed`
   «Đã xong», `retired` «Đã ngừng»), loại hình (`apartment` «Căn hộ», `house` «Nhà riêng», `land` «Đất», `room` «Phòng»,
   `commercial` «Mặt bằng», `unknown` «Chưa rõ»), loại tin (`sale` «Bán», `rent_lt` «Cho thuê»), độ tin trích xuất
   (`high/medium/low` «cao/trung bình/thấp»), đề xuất AI (`yes` «cùng căn», `no` «khác căn»), tên chỉ số hiệu chuẩn
   («ADR», «Công suất», «Listing»), loại thẻ duyệt và tên trường chưa có nhãn → «Loại thẻ khác» / «Trường khác» kèm mã
   trong `<code>`.
6. **Ba chỗ đổi cấu trúc nhỏ**: (a) `OpsHeader` thôi dùng `SidebarTrigger` — `Button` + `useSidebar().toggleSidebar` với
   `<span className="sr-only">Mở hoặc gập thanh bên</span>` (component đã cài ghép cứng chữ tiếng Anh, children không đè
   được; không sửa tệp vendor); (b) `PageHeader` truyền `aria-label="Đường dẫn trang"` cho `Breadcrumb`; (c) mô tả lớp
   khoá an toàn thành câu tiếng Việt ở cả bên đọc (`getLockdownStatus`) và bên ghi số đẩy lên cloud
   (`scripts/lib/ops-local.mjs`) — S3: bỏ ý hiện khoá cấu hình trong `<code>` vì khuôn số đẩy lên cloud không có trường đó.
7. Tiêu đề `/ops/review` thành «Hàng duyệt» (metadata + h1). Bố cục trang để UI1.

## 3. Phép đo

1. **Thước tĩnh chữ hiển thị** (`app/tests/ops-nhan/visible-strings.ts` + `scripts/lib/ops-nhan.mjs`): đọc cây cú pháp
   TypeScript của danh sách tệp ĐÓNG, viết trước trong test (khai triển từ các mẫu dưới tại thời điểm viết; mẫu khai triển
   ra tệp mới mà danh sách chưa có → ca đỏ nêu tệp):
   - trọn tệp: `src/app/ops/**/*.{ts,tsx}`, `src/components/ops/**/*.{ts,tsx}`, `src/components/shell/ops-shell/*`,
     `src/components/shell/nav.tsx`, `src/components/page/*`, `src/components/states/*`, `src/lib/dq-labels.ts`,
     `src/lib/market-names.ts`, `src/lib/ops-labels.ts`, `src/lib/source-labels.ts`, `src/lib/freshness.ts`;
   - một phần, ghim theo tên hàm: `collections-queries.ts` (`readSchedulerStatus`, `readRotationPreview`),
     `ops-queries.ts` (`getLockdownStatus`), `queries.ts` (`getAirdnaComparison`), `freshness.ts` (`fmtOverdue`,
     `fmtAge`, `sloSummaryText`, `LOCAL_ONLY_TEXT` — S3: tệp có SQL nên chỉ quét hàm dựng chữ). Chuỗi hiển thị = text JSX; giá
   trị chuỗi/template của thuộc tính `title`, `aria-label`, `alt`, `placeholder`, `label`, `description`, `footnote`,
   `header`; giá trị các khoá `title`, `label`, `description`, `footer`, `footnote`, `header`, `metric`, `desc`,
   `schedule`, `message` trong object; chuỗi trong biểu thức con JSX (`{"…"}`, `? :`, `??`, `||`); `metadata.title`. Trừ:
   bên trong `<code>`/`<kbd>`, `className`. Hai luật: (a) 0 từ _Avoid_ (rút từ CONTEXT.md, so khớp không phân biệt hoa
   thường theo ranh giới từ, trừ cụm `_Allow_`); (b) 0 từ tiếng Anh ngoài danh sách giữ §2.2 — «từ tiếng Anh» = token chỉ
   chữ ASCII không phải âm tiết tiếng Việt viết không dấu (luật âm tiết: phụ âm đầu + vần tiếng Việt).
2. **Smoke trang chạy thật** (`scripts/smoke-ops-nhan.mjs`): app dev chạy TỪ worktree (tự bật `next dev` cổng trống khi
   không có `BASE_URL`), DB local, phiên admin tạm (tạo/xoá như `smoke-portal-compliance.mjs`); GET 7 trang, lấy chữ
   hiển thị từ HTML (text node kể cả sr-only, `title`, `aria-label`, `alt`, `placeholder`; bỏ `<script>`, `<style>`,
   `<code>`, `<kbd>` chỉ ở luật b) → (a) 0 _Avoid_, (b) 0 tiếng Anh ngoài danh sách giữ, (c) 0 tên kiểm của bên ghi và
   khuôn `\w+=\S`, (d) không «Toggle Sidebar», (e) 0 mã khu vực `vn-…`, `vn` thường đứng riêng, token snake_case, (f) 0 dấu
   dự phòng («(chưa diễn giải)», «(chưa có tên Việt)», «Loại thẻ khác», «Trường khác»); in danh sách chuỗi `<code>` từng
   trang. Đây là phép đo đúng ngưỡng `bat_khi`. Dữ liệu do người hay máy đặt (tên nhóm, nội dung tin, tên người bán,
   email, mã tài khoản, tên nguồn thật ở `/ops/sources`, dòng nhật ký, lý do AI viết) nằm trong phần tử
   `translate="no"` và smoke bỏ qua (§6, hợp đồng OOS-3); nhãn giao diện vẫn do thước tĩnh §3.1 soi.
3. **Ma trận viết trước** cho `dq-labels.ts`, `market-names.ts`, bảng giá trị thô; khuôn bên ghi đo bằng cách tìm chuỗi
   khuôn trong chính tệp bên ghi (đổi khuôn ở pipeline → ca đỏ nêu tệp).
4. **Trên DB local (chỉ đọc)**: mọi dòng `dq_check_results` 7 ngày qua có tên kiểm + chi tiết diễn giải được; mọi dòng
   `airdna_markets` có tên Việt; mọi giá trị `source_registry.status`, `sale_offers.property_type` có nhãn.
5. **Render** (`renderToStaticMarkup`): `OpsHeader` (sr-only tiếng Việt, không «Toggle Sidebar»), bảng kiểm chất lượng,
   bảng thị trường S02, vòng thu S02, cột thị trường tổng quan.

## 4. Bảng nhãn (cũ → mới)

| Cũ | Mới | Ghi chú |
|---|---|---|
| Review Queue · Hàng chờ duyệt · Queue trống — không có item… · chờ review | Hàng duyệt · Hàng duyệt trống — không có thẻ chờ phán quyết · chờ duyệt | CONTEXT «Hàng duyệt» |
| Phán quyết con người (HITL) … ghi audit | Người phán quyết — máy đề xuất, bạn quyết. Mọi quyết định được ghi nhật ký. | |
| Offers tầng P1 · Kiến trúc 3 tầng giá | Tin rao giá nội bộ (P1) · Ba bậc giá | CONTEXT «Bậc giá» |
| N offers có bait_gap | N tin có chênh giá câu | CONTEXT «Chênh giá câu» |
| Offers (cột) · offer vào DB · offer (parse) | Tin rao · tin rao vào kho · tin rao (đã đọc) | |
| post raw · Post thật · Post mock · Vào raw | bài thô · Bài thật · Bài thử · Vào bảng thô | thêm thuật ngữ «Bài» |
| Occupancy · Listings (chỉ số) | Công suất · Listing | |
| Market Score · Chưa có Market Score · Điểm thị trường S02 | Điểm S02 · Chưa có điểm S02 | `_Avoid_` Market Score |
| Thị trường S02 toàn quốc — chọn thành phố tự thu tiếp theo… crosswalk | … chọn thị trường tự thu tiếp theo … kiểm bảng nối | |
| S02 — active · Universe đã mua · crosswalk · discovery · timeseries · LTM | S02 — đang hoạt động · Số đã mua · bảng nối · mẫu dò · chuỗi tháng · 12 tháng qua | |
| Lockdown · Lockdown & hạ tầng thu · lockdown phải giữ 0 | Khoá an toàn · Khoá an toàn & hạ tầng thu · khoá an toàn phải giữ 0 | thêm thuật ngữ «Khoá an toàn» |
| Agent-turn hôm nay | Lượt máy tự trả lời hôm nay | thêm thuật ngữ |
| Watchdog | Bộ canh | thêm thuật ngữ |
| Heartbeat 15′ cuối · Chưa có heartbeat · Uptime 24h · Probe trễ | Tín hiệu sống 15′ cuối · Chưa có tín hiệu sống · Thời gian sống 24h · Dò trễ | thêm «Tín hiệu sống» |
| Allowlist lệch membership · allowlist | Danh sách cho phép lệch nhóm tham gia · danh sách cho phép | thêm «Danh sách cho phép» |
| Rotation S02 kế tiếp · N market · Không còn market nào | Vòng thu S02 kế tiếp · N thị trường · Không còn thị trường nào | |
| Job · Dòng log cuối · Agent tự chạy — log … probe dịch vụ KeepAlive | Tác vụ · Dòng nhật ký cuối · Tự chạy — nhật ký lần cuối và dò dịch vụ chạy liên tục | thêm «Tác vụ» |
| Agent ingest :9210 · Kev gate :8009 · Collector :9210 · Smoke S01 (detect đổi markup) · rotation 6 market · discovery + listing + finalize · +jitter · KeepAlive | Cổng nhận tin :9210 · Cổng Kev :8009 · Thử nhanh S01 (phát hiện đổi khuôn trang) · vòng 6 thị trường · dò + listing + chốt số · lệch ngẫu nhiên · Chạy liên tục | |
| Máy thu có thể offline · kick · gate · hook · group id · map tên · parse | Máy thu có thể mất kết nối · bị mời ra · cổng · móc nhật ký · mã nhóm · ghép tên · đọc | |
| local · cloud · admin · sync · session · Id · app Zalo | máy thu · máy chủ · quản trị · đồng bộ · phiên đăng nhập · Mã · ứng dụng Zalo | thêm «Máy chủ» |
| Registry mã nguồn · Mã retired … mini-ADR | Danh mục mã nguồn · Mã đã ngừng không tái sử dụng; đổi nhãn công khai phải có quyết định kiến trúc | |
| Nhóm Facebook (Apify) · Tỉnh/TP Chợ Tốt · Mã tỉnh/TP · vd danang | Nhóm Facebook · Thị trường Chợ Tốt · Mã thị trường · vd: mã trên Chợ Tốt | |
| median · giá thật · vải công khai | trung vị · giá giao dịch · giá công khai | CONTEXT |
| Loại BĐS · Theo LLM · Chọn LLM · Luật và LLM khác nhau | Loại hình · Theo AI · Chọn AI · Luật và AI khác nhau | |
| Kết quả DQ check gần nhất — enum-vocab … | Kết quả kiểm chất lượng gần nhất — từ vựng giá trị và các kiểm khác | |
| Độ tươi dữ liệu theo nguồn (mã SPL) | Độ tươi dữ liệu theo nguồn (mã nguồn) | |
| Trong portal, nhấn … | Trong cổng, nhấn … | |

## 5. Hỏi và lựa chọn

- **Hỏi-1 — phạm vi «tiếng Anh».** Khuyến nghị: mọi từ tiếng Anh trên chữ hiển thị 7 trang, theo danh sách giữ §2.2,
  thước đòi 0. Lối khác: chỉ từ _Avoid_ + mục OPS-17 nêu tên — rẻ hơn, nhưng còn «Heartbeat», «Uptime», «Job»… và câu giao
  «không chữ tiếng Anh» chưa đạt.
- **Hỏi-2 — nhãn mới ở §4.** Khuyến nghị dùng bảng như soạn; anh sửa ô nào thấy khác. Nhãn mới vào CONTEXT.md cùng commit.
- **Hỏi-3 — thị trường S02 của tỉnh đã sáp nhập** (Bắc Giang, Bến Tre, Côn Đảo…). Khuyến nghị: giữ đúng thị trường của S02
  bằng tên có dấu (cột «Khu vực của ta» đã cho thị trường mới). Lối khác: gộp về tên tỉnh mới — mất thông tin S02 chia gì.
- Máy quyết (căn cứ ở sổ): diễn giải DQ ở app, không sửa pipeline; tên S02 bằng từ điển trong app theo `airdna_id` (thêm
  cột tên Việt ở DB cần migration — thành T3, không đáng cho 43 dòng); `OpsHeader` tự dựng nút thay `SidebarTrigger`.

## 6. Ngoài phạm vi

- Cổng Invest; chọn dòng + nhãn trạng thái bảng kiểm (ON9); cấu trúc và số của vùng Hiệu chuẩn (ON10); cột trạng thái
  trên điện thoại (ON13); bố cục hàng duyệt (UI1); số S02 trên trang Thu thập (ON6).
- Nội dung dòng nhật ký, tên nhóm, email, mã lỗi — dữ liệu, hiện trong `<code>` hoặc nguyên văn.
- Đổi tên kiểm hay khuôn chi tiết ở pipeline (chung tệp với NT7).
