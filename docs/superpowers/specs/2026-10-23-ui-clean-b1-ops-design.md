# Đợt B1 — dọn cổng Ops theo chuẩn ReUI: thiết kế

Ngày: 2026-10-23 · Chủ: Mạnh · Hồ sơ: `_acceptance/ui-clean-b1-ops/` (T2) · Nhánh: `claude/ui-clean-b1-ops-c5a53a`
Nguồn: spec `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md` mục 5 B1 · plan
`docs/superpowers/plans/2026-10-22-ui-standards-reui.md` Phần B · skill `reui` + `onehub-ui`.

## 1. Việc và phạm vi

Cổng Ops còn 60 mục baseline lint (7 file) và nhiều chỗ tự vẽ tay mà lint không bắt (panel
`div rounded-lg border`, chip tự viền, `setMsg("✓/❌")`, `window.confirm`). Đợt này đưa cả cổng
về đúng khuôn đã có trong danh mục, không đổi dữ liệu, query hay API.

**Trong phạm vi:** `app/src/app/ops/{page,collections,quality,review,sources,design}/page.tsx`
và `app/src/components/ops/*` (review-card, source-groups-admin, zalo-accounts,
collections-tables, quality-tables), thêm file mới cùng thư mục. Hai sửa nhỏ của luật lint:
`no-raw-controls` miễn `<input type="hidden">`; `no-native-dialogs` bỏ qua `confirm` khai báo
cục bộ (dùng scope).

**Ngoài phạm vi:** `ops/deals` (chưa có ở nhánh này; B5), `shell/nav.tsx`, `dau-tu/**`,
`investment-simulator.tsx`, đổi style/brand, đổi query/API, trạng thái tải/trống đầy đủ cho mọi
vùng (B4), `PageHeader`/`StatTiles` tự thân (B2).

## 2. Cách chọn khuôn

Thứ tự của `onehub-ui/loop.md`: danh mục trước, MCP sau. Bảng "Một loại UI, một cách làm" đã
phủ ba loại lớn của Ops: **bảng → `InsightGrid`**, **KPI → `StatTiles`**, **đầu trang →
`PageHeader`** — dùng lại, không cài block mới (luật danh mục: "Có sẵn bản chuyển thể thì dùng
lại bản đó"). Các vùng danh mục chưa có thì chọn mẫu chính chủ:

| Vùng | Khuôn chọn | Ứng viên đã xét | Vì sao |
|---|---|---|---|
| Xác nhận xoá nhóm / gỡ tài khoản Zalo | `c-alert-dialog-5` (Destructive Delete) — `ui/alert-dialog` | `c-dialog-7` (dialog phá huỷ) | ReUI: xác nhận phá huỷ là `AlertDialog` (backdrop không đóng); `c-dialog-7` là Dialog, click ngoài đóng được |
| Form thêm nhóm thu | `c-dialog-1` (Basic, form 2 trường) — `ui/dialog` + `ui/field` + `ui/select` + `ui/input` | form inline như hiện tại | ReUI Owners: modal form là `Dialog`; form inline hiện là `div rounded-lg border` tự vẽ |
| Bật/tắt nhóm | `ui/switch` `size="sm"` (mẫu `c-switch-4`) | `Toggle`, Button đổi chữ | ReUI: on/off là Switch; Toggle Group dành cho chọn view |
| Ô lọc + nút tải lại trên bảng nhóm Zalo | `InputGroup` + nút ghost đặt ở `actions` của `OpsSection` ngay trên bảng (ý đồ của `c-data-grid-23`: toolbar sát bảng) | sửa `InsightGrid` thêm slot `actions` trong FrameHeader | `InsightGrid` dùng chung với cổng Invest công khai (`/yield`, `/listing`); B1 không đụng component chung (phản biện gap-probe P0) |
| Thông báo kết quả thao tác | `sonner` (`toast`), `Toaster` đã gắn ở `providers.tsx` | `setMsg` + `<p>` | ReUI Owners: toast = sonner |
| Cảnh báo trạng thái (máy thu offline, kênh Zalo đứt) | `reui/alert` variant warning | Badge dài | Trạng thái có câu giải thích + lệnh sửa → Alert; Badge chỉ cho nhãn ngắn |

**Không sửa `InsightGrid`.** Toolbar của bảng nhóm Zalo nằm ở `actions` của `OpsSection`; lúc tải nhóm thì hiện `Skeleton` theo dáng bảng thay cho lưới (không cần prop `isLoading`). Cổng Invest không đổi một dòng.

Ghi chú công cụ: MCP reui đã nối ở dự án (`claude mcp list`: Connected) nhưng **chưa nạp vào phiên
này** (bật sau khi phiên mở). Tra cứu đi đường dự phòng chính chủ: chỉ mục `reui.io/llms.txt`,
trang `.md` của từng component (whenToUse/whenNotToUse/agentNotes) và mã nguồn mẫu free ở
`reui.io/r/styles/base-nova/<tên>.json`. API đọc từ file đã cài trong `components/ui`,
`components/reui`. Không cài gì mới (mọi primitive cần dùng đã có).

## 3. Từng trang (kế hoạch 7 dòng ReUI)

Mọi trang: Surface operational · Container Frame-led · Density dense (`size="sm"` cho control) ·
Motion none (phần đã cài tự lo) · gốc `flex flex-col gap-6` · `PageHeader` là phần tử đầu tiên,
breadcrumb `Vận hành › <trang>`, tiêu đề trùng nhãn nav, mô tả 1 mệnh đề. States: giữ trạng thái
đang có; vùng nào thay mới thì có trống/tải/lỗi tối thiểu (đầy đủ ở B4).

| Trang | Archetype | Vùng (trên → dưới) |
|---|---|---|
| `/ops` Tổng quan | Table-backed management | PageHeader (stats: số nguồn, số quá hạn) → `InsightGrid` "Độ tươi theo nguồn" (Mã · Vai trò · Thị trường · Snapshot cuối · Tuổi · SLO · Trạng thái = Badge `success-light`/`destructive-light`/`outline`); dòng SLO vào `footnote` |
| `/ops/collections` Thu thập | Table-backed management | PageHeader (stats: số nguồn, ngày, "máy thu N′ trước") → Alert warning khi máy thu > 30′ → `InsightGrid` Sức khoẻ nguồn → `InsightGrid` Lockdown (Lớp · Kiểm · Trạng thái Badge; description = watchdog + agent-turn) → mục "Hôm nay" = `StatTiles` 4 ô + dòng phễu cổng 7 ngày → Frame "Ống Zalo" (Badge trạng thái + Alert warning khi kênh đứt, kèm lệnh) → Frame "Rotation AirDNA" (Badge outline mỗi market) → FlowTable → ZaloGroupsTable (link "Nguồn dữ liệu" vào footnote) → SchedulerTable. **Sửa lỗi bố cục:** hết section lồng trong khối tiêu đề |
| `/ops/quality` Chất lượng dữ liệu | Table-backed management | PageHeader **đầu trang** (sửa h1 giữa trang) → mục "Thước giá & 3 tầng" = `StatTiles` → `InsightGrid` DQ checks (Kết quả = Badge `success-light`/`warning-light`/`destructive-light`) → Độ phủ trung thực → Hiệu chuẩn từng thị trường → AirDNA toàn quốc (3 bảng giữ nguyên) |
| `/ops/review` Hàng chờ duyệt | Frame stack | PageHeader (stats: chờ / đã duyệt / từ chối) → mỗi mục một `ReviewCard` = Frame: FrameHeader (tiêu đề + Badge AI + Badge điểm B) · FramePanel lý do AI (`Alert` với icon `BotIcon`, bỏ 🤖) · FramePanel 2 tin đặt cạnh nhau (lưới nhãn/giá trị, số qua `lib/format`) · FrameFooter 3 nút `Button` size sm: "Cùng căn" (primary) · "Khác căn" (outline) · "Không chắc" (ghost), icon lucide; kết quả bằng toast. Hết hàng chờ → `Empty` |
| `/ops/sources` Nguồn dữ liệu | Frame stack | PageHeader → `InsightGrid` Registry (Trạng thái = Badge) → mục "Tài khoản Zalo" (OpsSection): hàng điều khiển (Select tài khoản · "Đăng nhập QR" · "Gỡ" → AlertDialog · Input id mới + "Thêm") → khối QR (Skeleton khi đang sinh) → OpsSection "Nhóm của <tk>" (actions = ô lọc + Tải lại) chứa `InsightGrid` (Đang bật = Switch; xung đột = Switch disabled + chữ "ở <tk>"); đang tải = Skeleton dáng bảng; lỗi = Alert destructive + Thử lại → mục "Nhóm thu thập": mỗi nguồn một `InsightGrid` (Nhóm · Bài · Trạng thái Badge · Bật Switch · Xoá ghost → AlertDialog), nút "Thêm nhóm" → form theo Hỏi-5 (khuyên Dialog `c-dialog-1`; lối khác: form inline trong Frame) |
| `/ops/design` Thư viện thiết kế | Frame stack | PageHeader → mỗi dòng của "Một loại UI, một cách làm" một mục: tên loại + component + bản mẫu sống (StatTiles, InsightGrid, PageHeader, Badge trạng thái, PageError, Empty, Skeleton). Bỏ 5 import từ `components/examples/` và chữ thuật ngữ dev ("skill reui", ".claude", "Gallery") |

Mục có tiêu đề (không phải Frame) dùng một component nhỏ `ops/ops-section.tsx`: `<section>` +
`h2 text-sm font-semibold tracking-tight` + mô tả `text-xs` + `actions` bên phải. Lý do: tránh
Frame lồng Frame khi một mục chứa nhiều `InsightGrid` (ReUI: "never a Frame inside a Frame").

## 4. Hợp đồng API giữ nguyên

Không đổi endpoint, method hay khoá body. Máy chụp danh sách này từ code **trước** khi sửa
(`scripts/ui-standards/b1-api-snapshot.json`) và so lại sau khi sửa (E7).

| File | Gọi |
|---|---|
| review-card | `POST /api/v1/ops/review/{id}/decide` body `{status}` |
| source-groups-admin | `POST /api/v1/ops/source-groups` body `{action:"toggle"|"delete"|"add", sourceCode, groupKey, enabled?, purge?, name?}` |
| zalo-accounts | `GET /api/v1/ops/zalo/accounts` · `POST` body `{id}` · `DELETE` body `{id}` · `GET /api/v1/ops/zalo/groups?account=&refresh=` · `POST /api/v1/ops/zalo/groups` body `{accountId, groupId, enabled}` · `GET/POST/DELETE /api/v1/ops/zalo/login` · `GET /api/v1/ops/collections?days=1` (cloud) |

Hành vi giữ nguyên: xoá nhóm có bài thì vẫn xoá kèm bài (purge), AlertDialog nói rõ số bài sẽ
mất; gỡ tài khoản "default" vẫn không có nút; bất biến 1 nhóm – 1 tài khoản vẫn khoá nút.

## 5. Ảnh bằng chứng và dữ liệu tầng A

`/ops/sources` hiện tên nguồn thật (tầng A); `/ops/collections` và `/ops/sources` hiện tên nhóm
Zalo; `/ops/review` hiện nội dung tin. Ảnh evidence được commit và đẩy lên GitHub (repo private)
→ dữ liệu rời máy. Cách che (mặc định an toàn, chờ Mạnh xác nhận ở Hỏi-1):

- Code đánh dấu mọi ô tầng A bằng thuộc tính `data-tier-a` (tên thật ở registry, tên nhóm Zalo,
  tên/nhóm/khoá nhóm thu, nội dung + địa chỉ tin ở review-card). Thuộc tính không đổi giao diện.
- `scripts/ui-standards/mask-tier-a.js` (chạy trong trang trước khi chụp) thay chữ trong mọi
  `[data-tier-a]` bằng `███` giữ độ dài gần đúng, rồi tự kiểm: `document.body.innerText` không còn
  chuỗi nào trong danh sách tên thật lấy từ DB local (`source_registry.real_name`, tên nhóm Zalo).
- Evidence ghi `masked: true` + số phần tử đã che cho từng ảnh.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: nav Ops → trang → đọc PageHeader (tiêu đề + số tóm tắt) → bảng/khung bên dưới → thao tác (duyệt, bật/tắt, thêm, xoá) → toast xác nhận, bảng cập nhật (điểm ra: cùng trang).
- Biên: hàng chờ duyệt rỗng; cloud (Vercel) không có bảng `source_groups`/quản trị Zalo; tài khoản chưa đăng nhập Zalo (0 nhóm); nhóm đã bật ở tài khoản khác (khoá).
- Lỗi & quay lại: API trả lỗi → toast lỗi nêu việc hỏng, trạng thái lạc quan quay lại (toggle); tải nhóm Zalo lỗi → Alert trong bảng + "Thử lại"; xoá/gỡ → AlertDialog, "Huỷ" là đường quay lại.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Tổng quan | biết nguồn nào quá hạn SLO | nav / Thu thập |
| Thu thập | biết hôm nay dữ liệu chảy vào gì, máy có chạy không | nav / Nguồn dữ liệu |
| Chất lượng dữ liệu | đối chiếu số tự thu với AirDNA | nav / trang khu vực (Invest) |
| Hàng chờ duyệt | phán quyết từng cặp tin | URL (nav ở B5) / cùng trang |
| Nguồn dữ liệu | quản trị nguồn: tài khoản Zalo, nhóm thu | nav / Thu thập |
| Thư viện thiết kế | xem mẫu UI dùng chung | nav / — |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-review-empty | Hàng chờ duyệt | `Empty` "Không có mục chờ duyệt" + 1 dòng | quay lại Tổng quan |
| ST-review-deciding | Hàng chờ duyệt | 3 nút disabled trong lúc gửi | chờ |
| ST-review-error | Hàng chờ duyệt | toast lỗi nêu lý do API | bấm lại |
| ST-sources-delete-confirm | Nguồn dữ liệu | AlertDialog "Xoá nhóm?" + số bài sẽ xoá | Huỷ / Xoá |
| ST-sources-add | Nguồn dữ liệu | form thêm nhóm (Dialog hoặc inline theo Hỏi-5): nguồn, URL/key, tên | Lưu / Huỷ |
| ST-zalo-groups-loading | Nguồn dữ liệu | Skeleton dáng bảng thay chỗ bảng nhóm | chờ |
| ST-zalo-groups-error | Nguồn dữ liệu | Alert destructive + "Thử lại" | Thử lại |
| ST-zalo-groups-empty | Nguồn dữ liệu | dòng trống của bảng: "Chưa thấy nhóm — đăng nhập QR rồi tải lại" | Đăng nhập QR |
| ST-zalo-qr-pending | Nguồn dữ liệu | Skeleton ô QR "đang sinh QR" | chờ / Huỷ |
| ST-collections-offline | Thu thập | Alert warning "máy thu có thể offline" | kiểm máy thu |
| ST-zalo-channel-down | Thu thập | Alert warning + lệnh đăng nhập lại kênh | chạy lệnh |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- 390px: không cuộn ngang trang; bảng cuộn ngang trong Frame của nó; PageHeader xếp dọc; hàng điều khiển Zalo xuống dòng.
- Form thêm nhóm: "Lưu" bị chặn khi thiếu URL/key hoặc tên (như hiện tại), lỗi báo bằng toast.
- Switch có `aria-label` theo tên nhóm; nút xoá dạng icon có `aria-label`.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| PageHeader | dùng | khung đầu trang chung (danh mục) |
| InsightGrid | dùng | bảng chung (danh mục); không sửa vì dùng chung với Invest |
| StatTiles | dùng | KPI chung (danh mục) |
| AlertDialog / Dialog / Switch / Select / Input / Field / Empty / Skeleton / Alert / Button / Badge | dùng | primitive đã cài |
| OpsSection | tạo | tiêu đề mục chứa nhiều Frame, tránh Frame lồng Frame |
| CoverageTable, FeedHealthTable, LockdownTable, DqChecksTable, RegistryTable, ZaloGroupsGrid | ghép | cột riêng của từng bảng, đều qua InsightGrid |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: (ii) — cổng Ops là bảng điều khiển vận hành có nav cố định; IA trang đã chốt ở `docs/architecture/portals.md` và `routes.md`, đợt này không đổi IA, chỉ đổi khung từng trang.
<!-- UX-SPEC-TEMPLATE>>> -->
