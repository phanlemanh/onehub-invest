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

## 2. Cách chọn khuôn — chỉ đạo 2026-10-23: dùng block Solutions + app shell

Mạnh chốt (qua phiên điều phối, nguyên văn): «Vì trang Ops của chúng ta gần với dev ops và ai ops
bên cạnh lựa chọn app shell phù hợp với IA … Nên tôi đề xuất sử dụng các block/component của nó».
Nguồn khảo sát: nhóm `solutions/dev-ops` (6 block), `solutions/ai-ops` (9), `solutions/agents`
(10, do `app-shell-10` chỉ sang cho "approval inbox"), `application/app-shell` (36). Mỗi ứng viên
đọc bestFor / whenNotToUse / agentNotes ở bản `.md` của block (cùng nội dung `get_block` của MCP)
và so bằng ảnh thumbnail chính chủ (`reui.io/thumbnails/blocks/<tên>-light.webp`). MCP reui chưa
nạp vào phiên này (Hỏi-4) nên đi bản sao công khai; ảnh so sánh lưu ở
`_acceptance/ui-clean-b1-ops/figures/thumbs-*.png`.

### 2a. App shell của cổng Ops

| Ứng viên | Hợp ở đâu | Vướng ở đâu | Kết luận |
|---|---|---|---|
| **`app-shell-36` Observability Console** | Sidebar chia nhóm (Giám sát / Xử lý / Quản trị), lọc nav ⌘F, một header chung, thân trang tự do — đúng IA 7 trang phẳng của Ops | Bộ chuyển workspace và ghim trang là tính năng mẫu → chuyển thành bộ chuyển cổng Invest ↔ Ops; bỏ ghim (không lưu được) | **Khuyên** |
| `app-shell-26` Security Scope Console (IA cũ chọn) | Mật độ cao, section pills + nút chạy | Thân là cây scope kéo-thả, cần dữ liệu phân cấp nguồn → thành phố → phường mà Ops chưa có; inventory đã ghi "drag-to-reorder … more than Ops needs" | Lối khác |
| `app-shell-10` AI Agents Console | Subnav Agents/Tools/Runs, công tắc tự làm mới | Thẻ dự án + hạn mức chi tiêu không có dữ liệu thật | Loại |
| `app-shell-27` Route Search Sidebar | Lọc route, không top bar | Cùng cây scope như 26 | Loại |

Invest giữ `app-shell-30` (PortalShell) không đổi. Ops có shell riêng `components/shell/ops-shell/`
(chuyển thể `app-shell-36`); `ops/layout.tsx` đổi lớp bọc, **giữ nguyên** hai dòng chặn quyền
(`getSessionUser` + `canAccessOps`). Nav Ops khai ở `shell/nav.tsx` (khoá đã gỡ sau PR #3), thêm
`/ops/review`. Header của shell giữ nút mở sidebar; breadcrumb nằm ở `PageHeader` của từng trang
(một kiểu đầu trang cho hai cổng — không sửa `PageHeader`).

### 2b. Trang → block

| Trang | Block chọn | Lý do (1 dòng) | Phần bỏ / giữ data-grid |
|---|---|---|---|
| `/ops` Tổng quan | **`solution-dev-ops-5`** SLO Error Budgets | Độ tươi theo nguồn × thị trường là bài SLO: ô tóm tắt "đạt N/M" + lưới mục tiêu có tab Đạt / Quá hạn / Chưa có | Bỏ biểu đồ đốt ngân sách + công tắc loại sự cố (chưa có chuỗi SLI theo ngày) |
| `/ops/collections` Thu thập | **`solution-dev-ops-6`** Data Connections + vùng lưới job của **`solution-dev-ops-1`** Cron Jobs | Sức khoẻ nguồn = connection health; luồng 7 ngày = biểu đồ sync activity; "cần chú ý" = nguồn trễ SLO / nhóm im / lớp lockdown hỏng; launchd = lưới cron job | Bỏ cột "20 lần chạy gần nhất" và bộ sửa cron (không có dữ liệu, không sửa lịch từ web) |
| `/ops/sources` Nguồn dữ liệu | **`solution-ai-ops-2`** Provider Connections (tài khoản Zalo) + lưới "All connections" của **`solution-dev-ops-6`** (nhóm thu S05/S06) | Hàng tài khoản có trạng thái + công tắc + "Connect" = đăng nhập QR; nhóm thu = kết nối có công tắc đồng bộ, nhóm theo nguồn | Registry mã nguồn giữ `InsightGrid` (bảng thuần cột riêng — whenNotToUse của nhóm Dev Ops) |
| `/ops/quality` Chất lượng | **không block Solutions** — giữ `InsightGrid` + `StatTiles` | dev-ops-5 cần chuỗi SLI theo ngày; hiệu chuẩn AirDNA là các bảng cột riêng → whenNotToUse "single table on your own columns: use Data Grid" | Toàn trang |
| `/ops/review` Hàng chờ duyệt | **`solution-agents-5`** Action Approval Inbox | Hàng chờ phán quyết con người cho đề xuất AI: lưới hàng chờ + sheet xem payload (2 tin) + Duyệt / Từ chối (lý do) | Làm SAU khi `feat/enrich-qua-de-xuat` vào main |
| `/ops/deals` Căn giá tốt | ngoài B1 (đợt B5) — ứng viên nhóm `data-grid/base` | Bản ghi nghiệp vụ (tin rao) → whenNotToUse của Dev Ops chỉ sang Base blocks | Không làm ở B1 |
| `/ops/design` Thư viện | không block — trang trưng bày | Trưng bày mẫu dùng chung + các block đã chọn ở bảng này (link xem trước) | — |

**Hệ quả cho luật "một loại UI, một cách làm" (G4):** trong các trang theo block Solutions, ô KPI
và lưới là của chính block (chuyển thể chỉ đổi dữ liệu/chữ/prop), không thay bằng `StatTiles` /
`InsightGrid`. Catalog ghi ngoại lệ có tên: *"Cổng Ops, trang theo block Solutions: KPI và lưới
theo block"*. Không có `<table>` hay `useTable` tự dựng ngoài bản chuyển thể block hoặc `InsightGrid`.

**Điều kiện cài:** block Pro cài bằng `npx shadcn@latest add @reui/<tên>` cần `REUI_LICENSE_KEY`
trong `app/.env.local`. Ở worktree này CLI báo thiếu biến (Hỏi-6).

## 3. Từng trang (kế hoạch 7 dòng ReUI)

Mọi trang: Surface operational · Container Frame-led (block Solutions đều dựng trên Frame) ·
Density dense · Motion none (phần đã cài tự lo) · `PageHeader` là phần tử đầu tiên, breadcrumb
`Vận hành › <trang>`, tiêu đề trùng nhãn nav. States: theo block (Empty/Skeleton của block); vùng
không có trong block thì tối thiểu như bảng trạng thái mục Đặc tả UX.

| Trang | Archetype | Vùng (trên → dưới) |
|---|---|---|
| `/ops` | Dashboard grid | PageHeader → hàng ô của dev-ops-5 (mục tiêu đạt / quá hạn / nguồn chưa có / tuổi lớn nhất) → lưới mục tiêu dev-ops-5 (Mã · Vai trò · Thị trường · Snapshot cuối · Tuổi · SLO · Trạng thái), tab theo trạng thái |
| `/ops/collections` | Dashboard grid | PageHeader → Alert warning khi máy thu > 30′ → hàng ô dev-ops-6 (nguồn khoẻ, bản ghi 24h, nhóm Zalo hoạt động, lỗi/trễ) → biểu đồ sync activity (luồng 7 ngày theo nguồn) + danh sách "cần chú ý" → lưới kết nối dev-ops-6 = sức khoẻ nguồn → lớp lockdown (danh sách cần chú ý hoặc lưới kiểm) → Ống Zalo + Rotation AirDNA (Frame) → lưới nhóm Zalo → lưới job dev-ops-1 (launchd). **Sửa lỗi bố cục:** hết section lồng trong khối tiêu đề |
| `/ops/quality` | Table-backed management | PageHeader **đầu trang** (sửa h1 giữa trang) → `StatTiles` thước giá → `InsightGrid` DQ checks (Badge trạng thái) → 3 bảng AirDNA giữ nguyên |
| `/ops/review` | Table-backed management | PageHeader → agents-5: ô tóm tắt (chờ / đã duyệt / từ chối) → lưới hàng chờ → sheet chi tiết (2 tin cạnh nhau, lý do AI, điểm B) với Duyệt / Từ chối / Hoãn — sau enrich |
| `/ops/sources` | Frame stack | PageHeader → `InsightGrid` Registry → ai-ops-2: hàng tài khoản Zalo (trạng thái, số nhóm, công tắc, "Đăng nhập QR" = dialog Connect, Gỡ → AlertDialog) → lưới nhóm của tài khoản đang chọn (công tắc, khoá khi thuộc tài khoản khác) → dev-ops-6 lưới nhóm thu theo nguồn (công tắc, xoá → AlertDialog, thêm theo luồng tạo của block) |
| `/ops/design` | Frame stack | PageHeader → mỗi dòng "Một loại UI" một mục mẫu sống → bảng block Solutions đã chọn (tên + trang dùng + link xem trước). Bỏ import `components/examples/` và chữ thuật ngữ dev |

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
| ST-sources-add | Nguồn dữ liệu | luồng tạo kết nối của dev-ops-6, rút gọn còn nguồn, URL/key, tên | Lưu / Huỷ |
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
| InsightGrid / StatTiles | dùng | trang không có block Solutions khớp (quality, registry); không sửa vì dùng chung với Invest |
| StatTiles | dùng | KPI chung (danh mục) |
| AlertDialog / Dialog / Switch / Select / Input / Field / Empty / Skeleton / Alert / Button / Badge | dùng | primitive đã cài |
| app-shell-36 → ops-shell | dùng (chuyển thể) | shell riêng cho Ops, nav nhóm |
| solution-dev-ops-5 / -6 / -1, solution-ai-ops-2, solution-agents-5 | dùng (chuyển thể) | bảng 2b |
| DqChecksTable, RegistryTable | ghép | bảng thuần qua InsightGrid |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: (i) đã xem 36 app-shell + 25 block Solutions của ReUI (ảnh thumbnail): console vận hành của ReUI đều là sidebar nhóm + trang bảng điều khiển; Ops giữ 7 trang phẳng theo `portals.md`, chỉ đổi shell và khung trang.
<!-- UX-SPEC-TEMPLATE>>> -->
