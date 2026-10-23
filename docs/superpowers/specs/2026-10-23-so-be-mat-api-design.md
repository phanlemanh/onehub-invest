# Sổ bề mặt API — mọi route API khai một chỗ, chỉ trả đúng thứ sổ cho phép (NT4)

Hồ sơ: `_acceptance/so-be-mat-api/` · Hàng lộ trình: NT4 (`docs/plan/lo-trinh.json`) · Đợt 0 «Cầm máu», dãy P1, sau AU2.

## Vì sao

AU2 đóng `/api/v1/deals` nhưng `/api/v1/offers` vẫn công khai và đọc cùng bảng `sale_offers` lẫn tin mock. Beacon
`user-events` trả 401 cho mọi khách (nhiễu log, lỗi đỏ trong console). `/api/zalo-media` cho admin tải được ảnh QR đăng
nhập Zalo nằm ở `/tmp/openclaw/openclaw-zalouser-qr-*.png` — ai cầm phiên admin là quét QR đăng nhập được tài khoản thu.
Không có chỗ nào nói route nào được công khai, nên route mới đọc `sale_offers` có thể lọt mà không ai thấy.

## Làm gì

1. **Sổ** `app/src/lib/api-surface.ts` — `API_SURFACE: ApiSurfaceEntry[]`, mỗi route một dòng: `route` (đường URL),
   `methods`, `mode`, `note`. Chế độ (đóng):
   - `public` — ai cũng gọi được (asset-stats, listings, markets);
   - `ops` — bearer `OPS_API_TOKEN` hoặc phiên ops (deals, offers qua `canCallOpsApi`; mọi route `/api/v1/ops/*` qua
     nhánh bearer + `canAccessOps`/`isAdmin` — audit chặt hơn sổ: phiên phải là admin);
   - `ops-session` — chỉ phiên ops, KHÔNG nhánh bearer (hôm nay chưa route nào);
   - `admin` — chỉ role admin, KHÔNG nhánh bearer (zalo-media);
   Nguyên tắc: sổ rộng bằng hoặc hơn mã — mã không bao giờ cho người gọi mà sổ không cho (S4-r1: 5 route khai
   `ops-session` và audit khai `admin` thực ra nhận bearer → khai lại `ops`, bộ kiểm cấm nhánh bearer ở hai chế độ chỉ-phiên);
   - `session-or-noop` — có phiên thì ghi, khách thì 204 không làm gì (user-events).
2. **Kiểm tĩnh** `scripts/check-api-surface.mjs` — hàm thuần `checkApiSurface({ entries, files })` (`files` = map đường
   tương đối → mã nguồn của mọi `route.ts` dưới `app/src/app/api` và mọi module nằm trong **bao đóng import bắc cầu** của
   chúng — cả `@/lib/...` lẫn import tương đối `./x`, `../x`, đi tới khi hết) trả danh sách vi phạm có tên:
   - route trên đĩa chưa có dòng sổ («chưa khai trong sổ») / dòng sổ trỏ route không còn («sổ trỏ route không còn») /
     phương thức export khác sổ («phương thức lệch sổ»);
   - route mà bao đóng import nhắc `sale_offers` lại khai `public` («đọc sale_offers mà sổ khai public»);
   - chế độ khác cổng trong mã: `ops` phải có `canCallOpsApi` hoặc cặp `bearerOk`+`canAccessOps` («chế độ ops mà mã thiếu
     cổng»); `ops-session` phải có `canAccessOps` («chế độ ops-session mà mã thiếu canAccessOps»); `admin` phải có
     `isAdmin` trong bao đóng («chế độ admin mà mã không có isAdmin»); `session-or-noop` phải trả `status: 204` khi không có
     phiên («chế độ session-or-noop mà khách không nhận 204»);
   - route dùng `canCallOpsApi`: dùng lại `checkDealsRoute` của AU2 (có `await`, trả 401, trước `pool.query`) — thông điệp
     «cổng ops (canCallOpsApi) chạy trước pool.query».
   CLI `static` đo cây thật (in «sổ bề mặt API: N/N route khớp sổ»); `mutation` dựng từ mã thật một bảng đột biến viết
   trước, mỗi bản phải trượt ĐÚNG thông điệp ghim của nó, bản nguyên phải đạt:

   | # | Bản hỏng | Thông điệp ghim |
   |---|---|---|
   | M1 | thêm route mới chưa khai | chưa khai trong sổ |
   | M2 | sổ giữ dòng của route đã xoá | sổ trỏ route không còn |
   | M3 | route export thêm POST mà sổ chỉ khai GET | phương thức lệch sổ |
   | M4 | route public mới truy vấn `sale_offers` trực tiếp | đọc sale_offers mà sổ khai public |
   | M5 | route public import `@/lib/x`, `x` truy vấn `sale_offers` | đọc sale_offers mà sổ khai public |
   | M6 | như M5 nhưng `x` import `./y`, `y` truy vấn `sale_offers` | đọc sale_offers mà sổ khai public |
   | M7 | offers bỏ cổng | cổng ops (canCallOpsApi) chạy trước pool.query |
   | M8 | offers gọi cổng không `await` | cổng ops (canCallOpsApi) chạy trước pool.query |
   | M9 | offers gọi cổng mà không trả 401 | cổng ops (canCallOpsApi) chạy trước pool.query |
   | M10 | offers truy vấn trước cổng | cổng ops (canCallOpsApi) chạy trước pool.query |
   | M11 | route `ops` khuôn bearer mất `canAccessOps` | chế độ ops mà mã thiếu cổng |
   | M12 | route `ops-session` dựng mới thiếu `canAccessOps` | chế độ ops-session mà mã thiếu canAccessOps |
   | M13 | route `admin` (zalo-media) mất `isAdmin` | chế độ admin mà mã không có isAdmin |
   | M14 | beacon bỏ nhánh 204 | chế độ session-or-noop mà khách không nhận 204 |
   | M15 | route `admin` (zalo-media) thêm nhánh bearer | chế độ admin mà mã nhận bearer OPS_API_TOKEN |
   | M16 | route `ops-session` dựng mới có nhánh bearer | chế độ ops-session mà mã nhận bearer OPS_API_TOKEN |

   Đột biến không áp được lên mã hiện tại là TRƯỢT có tên (không im). `check-portal-compliance.mjs` (làn ghim lại) gọi
   `checkApiSurface` trên cây thật.
3. **`/api/v1/offers`** — dòng đầu `GET`: `if (!(await canCallOpsApi(req, getSessionUser))) return 401` như AU2; docstring
   bỏ «Public», ghi tạm đóng cùng lý do và điều kiện mở lại của AU2.
4. **Beacon** `POST /api/v1/user-events` — khách → `new NextResponse(null, { status: 204 })`, không ghi gì; có phiên giữ
   nguyên. (Client không biết mình đăng nhập chưa vì cookie `oi_session` là httpOnly — chặn phía server là lối duy nhất
   không phải truyền trạng thái xuống mọi trang.)
5. **`/api/zalo-media`** — tên tệp QR đăng nhập do chính app đặt: `app/src/lib/zalo-admin.ts` `qrFile()` →
   `/tmp/openclaw/openclaw-zalouser-qr-<acc>.png`. Tách tiền tố thành hằng xuất `LOGIN_QR_PREFIX` + hàm `isLoginQrFile(p)`
   trong `zalo-admin.ts` (bên viết), `qrFile()` dùng chính hằng ấy; `sendImage` của zalo-media gọi `isLoginQrFile` ở CẢ
   hai lớp (tên chữ và đích sau `realpath`, chặn symlink tên vô hại) → 403. Test dựng tệp QR bằng chính `loginQrPath()`
   của bên viết (round-trip), không gõ tay tên. Giữ nguyên hai gốc staging.
   **Người xem QR hợp lệ:** luồng đăng nhập Zalo ở /ops (`/api/v1/ops/zalo/login`) đọc tệp QR bằng `readFile` trong
   `zalo-admin.ts` `readQr()` rồi trả base64 — không đi qua `/api/zalo-media`, nên chặn QR ở zalo-media không chạm luồng
   đăng nhập. Không có trang nào trỏ QR qua zalo-media (grep `zalo-media?` chỉ ra `/ops/deals` ảnh tin và loader snapshot).
6. **Vá Ngoài-1 của AU2** — `scripts/smoke-deals-api.mjs` gọi `assertLocalDatabaseUrl` (từ `scripts/dev-ops-account.mjs`)
   ở đầu nhánh có ghi DB, trước mọi lời gọi HTTP; `--chi-doc` không đổi.
7. **Smoke** `scripts/smoke-api-surface.mjs` trên app đang chạy (rào `assertLocalDatabaseUrl`, phiên tạm `*.verify.test`,
   dọn trong `finally`): offers khách / bearer sai / role user → 401 với thân đúng `{"error":"unauthorized"}`, bearer / role
   ops → 200 khuôn `{generatedAt, kind, count, rows}`; beacon khách → 204 thân rỗng, có phiên (user tạm) → 200 và đúng
   một dòng `user_events` của CHÍNH user tạm (lọc theo `user_id`, xoá sau); zalo-media admin: ảnh thử tên QR (dựng bằng
   tiền tố của bên viết) → 403, ảnh thử thường → 200, symlink tên thường trỏ QR → 403. Cờ `--chi-doc`: chỉ HTTP, không DB —
   offers khách 401 + bearer 200 — dùng đo prod sau deploy.
8. **Người gọi máy trong kho** — `scripts/audit-all.sh` mục «PUBLIC APIs» đang chờ `/api/v1/offers` không token trả 200:
   đổi thành hai dòng — khách → 401 (đạt), bearer `CTOKEN` → 200 (đạt); chuyển offers khỏi nhóm «PUBLIC».
9. **Tài liệu** — `docs/architecture/portals.md` thêm mục «Sổ bề mặt API»: sổ ở đâu, năm chế độ, luật thêm route mới.

## Không làm

- Không gom 5 route `/api/v1/ops/*` về `canCallOpsApi` — đường `app/src/app/api/v1/ops/**` là T3 (`_acceptance/config.yaml`
  `t3_paths`); sổ chỉ ĐỌC chúng và bắt lệch chế độ. Gom là hàng riêng.
- Không `WWW-Authenticate` (RFC 6750) — chưa có người gọi máy nào cần.
- Không đo bảng khác ngoài `sale_offers` cho luật «không công khai» — bảng tầng A khác (users, sessions, review_queue)
  không route public nào đọc hôm nay; mở rộng khi có.
- Không sửa test độ nhạy Ngoài-2 của AU2 — hồ sơ đã ký, không ai yêu cầu.

## Rủi ro và đảo ngược

Merge = Vercel prod đóng `/api/v1/offers` với người gọi công khai ngay (khó-đảo nhẹ; `git revert`). Người gọi duy nhất trong kho là
`scripts/audit-all.sh` (mục 8). Beacon đổi 401 → 204 cho khách: không mất dữ liệu (khách vốn không ghi được).

## Đặc tả UX

Bỏ — hàng không chạm màn hình (entry `descope` «bỏ đặc-tả-UX»).
