# Tạm đóng `/api/v1/deals` — chỉ token ops hoặc phiên ops (AU2)

Hồ sơ: `_acceptance/deals-api-tam-dong/` · Hàng lộ trình: AU2 (`docs/plan/lo-trinh.json`) · Đợt 0 «Cầm máu».

## Vì sao

Audit 23/10 P7: `GET /api/v1/deals` công khai trên prod trả 30 deal, 29 là tin mock của S03. Audit Q3 khuyến nghị
«đóng ngay (yêu cầu token ops); quyết công khai lại sau khi Invest có độ chắc»; Mạnh gõ `build` cho hàng này ở thẻ
khởi tạo đợt `dot0-cam-mau` — đó là câu trả lời Q3. Trang `/deals` đã vào `/ops/deals` từ PR #3; API là cửa
công khai cuối cùng còn phát tin giả.

## Làm gì

1. Thêm hàm `canCallOpsApi(req, getUser)` vào `app/src/lib/ops-access.ts` — cùng luật mà 5 route `/api/v1/ops/*`
   đang chép tay:
   - `Authorization: Bearer <OPS_API_TOKEN>` đúng từng ký tự → cho qua, KHÔNG gọi `getUser` (không chạm DB phiên);
   - `OPS_API_TOKEN` đọc lúc GỌI (không chụp lúc nạp module); trống/thiếu → nhánh bearer luôn sai (chặn `Bearer `
     rỗng và `Bearer undefined`);
   - còn lại → `canAccessOps(await getUser())` (role `ops`/`admin` hoặc email trong `OPS_EMAILS`; khách, phiên
     hết hạn, role `user` → không).
   Hàm nhận `getUser` làm tham số để test gọi được ngoài request của Next (không có `cookies()`).
2. `app/src/app/api/v1/deals/route.ts`: dòng đầu của `GET` gọi `canCallOpsApi(req, getSessionUser)`; sai →
   `401 {"error":"unauthorized"}` (đúng khuôn các route ops), TRƯỚC `pool.query`. Đúng → truy vấn và khuôn
   phản hồi giữ nguyên từng khoá. Docstring đổi «public API» thành «tạm đóng — chỉ ops» kèm điều kiện mở lại.
3. Kiểm tĩnh: `scripts/check-deals-api.mjs` xuất `checkDealsRoute(src)` — route phải gọi `canCallOpsApi` và lời gọi
   ấy đứng trước `pool.query`; `check-portal-compliance.mjs` (đã nằm trong làn ghim lại) gọi hàm này trên cây thật.
   Kiểm là quan hệ, không chỉ chữ có mặt: bỏ dòng import khi tìm; lời gọi phải là `if (!(await canCallOpsApi(…)))`
   mà thân trả `status: 401`, đứng trước `pool.query`. Chế độ `mutation` dựng năm bản trong bộ nhớ từ mã thật: bản
   nguyên phải ĐẠT; bốn bản đột biến — bỏ cổng (giữ dòng import), dời cổng xuống sau truy vấn, gọi không `await`,
   gọi mà không trả 401 — phải TRƯỢT với thông điệp ghim.
4. Test đơn vị `app/tests/deals-api-guard.test.tsx` (làn `app_ui`, node:test + tsx như `zalo-media.test.tsx`):
   ma trận người gọi × kết quả của `canCallOpsApi`.
5. Smoke sống `scripts/smoke-deals-api.mjs` trên app đang chạy (khuôn `smoke-portal-compliance.mjs`: phiên tạm
   `*.verify.test`, xoá trong `finally`): khách 401 không lộ dữ liệu, bearer sai 401, bearer đúng 200, phiên
   `user` 401, phiên hết hạn 401, phiên `ops` 200. Token lấy từ env `OPS_API_TOKEN`, thiếu thì đọc
   `app/.env.local`; vẫn thiếu → TRƯỢT có tên (không bỏ qua lặng). Cờ `--chi-doc` chỉ chạy ca khách + bearer, không
   tạo phiên, không chạm DB — dùng đo prod sau deploy ở S5 (`BASE_URL=https://onehub-invest.vercel.app`).
7. Hỏi-2 ở Cổng Phạm vi: phiên ops có được qua không. Bản nháp theo khuyến nghị (bearer + phiên); chọn «chỉ bearer»
   thì hàm cổng bỏ nhánh phiên và AC-4 đổi thành «phiên ops → 401».
6. ROADMAP §2 as-built + §4: ghi `/api/v1/deals` đang tạm đóng và điều kiện mở lại.

## Không làm

- Không gom 5 route `/api/v1/ops/*` về hàm mới — việc của NT4 (sổ bề mặt API), làm chung một lượt cho mọi route.
- Không đụng `/api/v1/offers` (cùng lỗ mock) — NT4 phủ theo đúng chế độ AU2.
- Không cờ env mở lại API — mở lại khi PL2 đã rút tin mock là quyết riêng, hàng riêng (LUAT đợt, ghi chú AU2).
- Không xử lý project Vercel cũ `app` (vẫn phục vụ `/api/v1/deals` bản 22/10) — audit Q2, việc của Mạnh.
- Không đụng data-api `/v1/deals` — chưa có bản chạy (audit P11), thuộc AH2.
- Không thêm `WWW-Authenticate` (RFC 6750) — các route ops hiện không có; NT4 chuẩn hoá chung.

## Rủi ro và đảo ngược

Merge vào `main` → Vercel deploy prod → API đóng với người gọi công khai ngay. Không có người gọi nào trong kho
(grep `api/v1/deals` chỉ ra tài liệu); người gọi ngoài kho (nếu có) nhận 401. Đảo bằng `git revert` một commit.

## Đặc tả UX

Bỏ — hàng không chạm UI (entry `descope` «bỏ đặc-tả-UX» trong `decisions.jsonl`).
