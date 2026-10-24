# Ops chỉ hiện mã nguồn (ON7 · `ops-nhan-ma-nguon`) — design

Hàng ON7 của `docs/plan/lo-trinh.json` (dãy P2 đợt `dot0-cam-mau`, chuỗi ADR-0014 AU13 → ON7 → NT2 → ON22). Luật đã
chốt: tên nguồn thật là tầng A, «ngoài `/ops/sources` chỉ mã `S0x` kèm vai trò» (AGENTS.md luật 6; Mạnh 24/10 Câu 2).
Hàng phải xong trước NT2 — bộ soát tầng A của NT2 đỏ ngay nếu nhãn job còn tên thật.

## Hiện trạng (quét S1, tên thật đọc từ `source_registry` local, KHÔNG in ra)

- Chữ hiển thị mang tên thật ở 9 tệp trong phạm vi: `components/ops/collections-tables.tsx` (tiêu đề cột, tiêu đề
  bảng nhóm), `collections/attention-list.tsx` (cảnh báo kênh đứt, im lặng, trạng thái rỗng), `collections-tiles.tsx`
  (ô KPI + neo `#nhom-…`), `collections-view.tsx` (id neo), `pipe-panels.tsx` (tiêu đề ống, cảnh báo, LỆNH đăng nhập lại
  kênh và tên job launchd), `sync-activity.tsx` (nhãn chế độ), `quality-tables.tsx` + `app/ops/quality/page.tsx` (tiêu
  đề cột, chú thích, tên chỉ số của nhà cung cấp), `design/catalog-samples.tsx`.
- Nhãn job viết cứng tên thật ở HAI nơi: `pipeline/push-ops-facts.mjs` `scheduler()` (lên cloud qua payload facts) và
  `app/src/lib/collections-queries.ts` `readSchedulerStatus()` nhánh local. `id` job cũng mang tên thật (chỉ dùng làm
  khoá hàng của lưới — không nơi nào khác đọc).
- «Dòng log cuối» của job (`lastLine`) là dữ liệu chạy — dòng log có thể chứa tên nguồn, lên cloud nguyên văn.
- Còn lại là định danh trong mã (tên biến, kiểu, tệp, bảng SQL, đường log) — không hiện cho người vận hành; repo
  public đã chứa chúng. Không đổi.

## Cách làm

1. **Nhãn nguồn một nơi** — `app/src/lib/source-labels.ts`: `sourceLabel(code, roles)` → `«S02 · Hiệu chuẩn»` (vai trò
   = `label_vi`), vắng vai trò → mã trần `S02`. `getSourceRoles()`: local đọc `SELECT code, label_vi FROM
   source_registry`; cloud không có bảng này (sự cố 24/10) → lấy `code`/`label_vi` từ `facts.sourceRuns` (máy thu đã đẩy
   sẵn); không có cả hai → `{}` (trang vẫn dựng, hiện mã trần). Trang `/ops/collections` và `/ops/quality` đọc vai trò
   một lần rồi truyền xuống component; component không viết cứng vai trò.
2. **Chữ hiển thị** trong 9 tệp trên dùng `sourceLabel(...)`. Mẫu: «S02 · Hiệu chuẩn — market», «Ống S03 · Cộng đồng»,
   «Điểm thị trường S02 · Hiệu chuẩn» (thay tên chỉ số của nhà cung cấp). Neo `#nhom-…` đổi thành `#nhom-s03`.
3. **Kênh S03 đứt / heartbeat trễ:** cảnh báo thôi in lệnh đăng nhập lại và tên job launchd (cả hai mang tên thật); thay
   bằng liên kết «Đăng nhập lại ở Nguồn dữ liệu» tới `/ops/sources` — đúng nơi đã có hộp kết nối QR và được hiện tên
   thật (`components/ops/sources/zalo-accounts.tsx`). Mẫu chữ «… ở Nguồn dữ liệu» đã có trong `attention-list.tsx`.
4. **Che tên trong dữ liệu chạy:** bộ che `maskSourceNames(text, names)` thay mỗi tên thật (đọc `code, real_name` từ
   `source_registry` local) bằng mã `S0x` — không phân biệt hoa thường, bỏ dấu, theo ranh giới từ (tên ngắn ba ký tự
   không trúng giữa từ), kèm biến thể bỏ khoảng trắng. Hai bản: `pipeline/lib/mask-source-names.mjs` (push-ops-facts) và
   `app/src/lib/mask-source-names.ts` (readSchedulerStatus local) — app không được import pipeline (app/CLAUDE.md).
   Một bảng ca dùng chung chứng hai bản cho cùng kết quả. **Đóng chặt:** danh sách tên rỗng (DB không tới được,
   `source_registry` rỗng) → trả `null`, không trả chuỗi gốc. Ở `push-ops-facts`, DB chết thì `client.connect()` ném
   trước khi dựng payload (AU13 AC-4 đã chứng) nên không có payload nào đi; ở `readSchedulerStatus` local, DB chết →
   `lastLine: null`.
5. **Nhãn + id job:** cả hai nơi đổi sang nhãn mã («S02 · Hiệu chuẩn — toàn quốc (rotation 6 market)», «S01 · Tự thu —
   Hà Nội», «Smoke S01 · Tự thu») và id trung tính (`s02-daily`, `s01-weekly`, `s01-smoke`); `lastLine` qua bộ che.
   `push-ops-facts.mjs` thêm `ONEINVEST_ROOT` (vắng thì đường cũ) để phép đo chạy bước thật trên cây log tạm.
6. **Thước:**
   - Render (`app/tests/ops-nhan-ma-nguon.test.tsx`): `CollectionsView` với dữ liệu mẫu bật mọi nhánh (đứt kênh,
     heartbeat trễ, im 24h, lệch allowlist, nhóm im > 72h) và một lượt «mọi thứ lành» (trạng thái rỗng); trang
     `/ops/quality` thật trên DB local; trang `/ops/collections` thật ở chế độ cloud (lược đồ tạm không có
     `source_registry`) với facts là ĐÚNG payload `push-ops-facts` thật vừa đẩy trong cùng ca (vòng kín bên ghi → bên
     đọc). Quét chữ + giá trị thuộc tính (`title`, `aria-label`, `href`, `alt`) của HTML; mỗi `href="#…"` phải có đúng một
     `id` khớp trong cùng HTML.
   - Tĩnh (`scripts/check-portal-compliance.mjs` mục mới): chữ hiển thị (JSX text, giá trị thuộc tính JSX, giá trị
     thuộc tính đối tượng tên `label/title/description/detail/header/footnote/placeholder`) trong
     `components/ops/**` (trừ `sources/`), `app/ops/quality`, `app/ops/collections` — bắt nhánh render không phủ; template
     literal và chuỗi trong `{…}` của JSX cũng quét. Ma trận viết trước `scripts/fixtures/ops-tier-a-matrix.json` (mã ·
     tệp · dòng mọi chỗ chữ hiển thị ở cây gốc 460e61a, dựng ở S3 TRƯỚC khi sửa component): bộ quét chạy trên các tệp cây
     gốc phải ra đúng ma trận — không thiếu, không thừa. Đối chứng dương: thấy ≥ 1 chỗ ở `components/ops/sources/`.
   - Payload (`pipeline` test): chạy `push-ops-facts.mjs` thật, `INGEST_URL` trỏ máy chủ thu tạm, `HOME` và
     `ONEINVEST_ROOT` là cây tạm có log mang tên thật, `DATABASE_URL` là DB local (chỉ đọc). Quét MỌI giá trị chuỗi của
     payload bắt được, miễn đúng hai đường có tên: `zaloGroups[].name` (tầng C) và `zaloAccounts[]` (NT2).
   - Danh sách tên cho mọi thước: `scripts/lib/tier-a-source-names.mjs` rút `real_name` từ các câu `INSERT INTO
     source_registry` trong `db/migrations/` đã commit (không viết cứng, chạy được ở CI không DB). Thước báo vi phạm bằng
     mã `S0x` + tệp:dòng, KHÔNG in tên.
7. **Từ vựng:** `CONTEXT.md` thêm thuật ngữ «Nhãn nguồn» (nhãn · code `sourceLabel` · không slug · định nghĩa · _Avoid_
   tên nguồn thật ngoài `/ops/sources`).

## Không làm

- `/ops/sources` giữ nguyên (nơi duy nhất hiện tên thật). `/ops/deals` ngoài ngưỡng của hàng (đã có mục 5 của
  `check-portal-compliance`).
- Đổi tên định danh trong mã, tên bảng, đường log.
- Khoá JSON của payload facts (`zaloGroups`, `zaloFlow`, `zaloAccounts`) — chờ Hỏi-1.
- Tên tài khoản thu trong payload (`zaloAccounts[].name`, giữ như tầng A) — NT2 soát mọi đường lên cloud.
- Tên nhóm S03 — tầng C từ 24/10 (sửa đổi ADR-0007), không che.

## Hỏi-1 (chỉ người có)

Ngưỡng «payload facts: 0 tên nguồn thật» đo trên GIÁ TRỊ hay cả KHOÁ JSON? Máy khuyên: giá trị — khoá là tên trường
(như tên bảng `stg_*` trong repo public), không hiện cho ai; đổi khoá cần app trên Vercel và máy thu đổi cùng lúc, bộ đọc
nhận cả hai trong lúc giao thời. Lối khác: đổi khoá ngay vòng này — thêm một ca giao thời và một bộ đọc kép.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: người vận hành mở `/ops/collections` → đọc ô KPI, ống S03, bảng job, nhóm → mọi chỗ nói về nguồn là «S0x ·
  vai trò» (điểm ra: không đổi).
- Biên: cloud không có `source_registry` và facts chưa có `sourceRuns` → nhãn là mã trần «S03».
- Lỗi & quay lại: kênh S03 đứt → cảnh báo «Kênh S03 · Cộng đồng đứt» + liên kết «Đăng nhập lại ở Nguồn dữ liệu» →
  `/ops/sources` (quay lại bằng nav).

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/collections` | Xem máy thu có đang chạy đúng | nav Ops / `/ops/sources` khi kênh đứt |
| `/ops/quality` | Đối chiếu số tự thu với nguồn hiệu chuẩn | nav Ops / — |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-collections-lanh | `/ops/collections` | Trạng thái rỗng «Nguồn trong hạn, lockdown đủ lớp, kênh S03 · Cộng đồng kết nối.» | Không cần làm gì |
| ST-collections-kenh-dut | `/ops/collections` | Cảnh báo đỏ «Kênh S03 · Cộng đồng đứt» + liên kết tới Nguồn dữ liệu | Bấm liên kết, đăng nhập lại bằng QR |
| ST-collections-khong-vai-tro | `/ops/collections` | Nhãn mã trần «S03» | Không cần làm gì |
| ST-quality-lanh | `/ops/quality` | Cột «S02 · Hiệu chuẩn — …» | Đọc đối chiếu |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Chỉ đổi chữ và một liên kết; không đổi bố cục, kích thước, màu.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `Alert`, `Badge`, `DataGridColumnHeader` có sẵn | dùng | chỉ đổi chuỗi truyền vào |
| Liên kết tới `/ops/sources` | dùng (`next/link` như các liên kết Ops khác) | không thêm component |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: trang hiện có là bảng điều khiển; vòng này không đổi cấu trúc — luồng hiển nhiên, không tra mẫu.
<!-- UX-SPEC-TEMPLATE>>> -->
