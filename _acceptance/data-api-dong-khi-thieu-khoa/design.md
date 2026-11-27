# PB3 — data-api đóng khi thiếu khoá (thiết kế)

Giao: gs, XONG m5-2511-3 điều (4), 25/11: «Lỗ xác thực mở khi DATA_API_KEYS rỗng: cắt hàng PB3 data-api-dong-khi-thieu-khoa
(production thiếu danh sách khoá thì từ chối mọi lời gọi hoặc không khởi động; có test) — làm ngay sau HT19, trước HT20 …;
KHÔNG triển khai data-api lên Vercel khi PB3 chưa gộp.»

## 1. Hiện trạng

- `data-api/src/middleware/auth.ts` đọc `DATA_API_KEYS` MỘT lần lúc nạp module; danh sách rỗng → `next()` cho mọi đường
  («development mode»). Không có khái niệm môi trường: bản triển khai nào quên đặt khoá là API mở cho cả Internet.
- Hai lối vào: `src/index.ts` (Node server — Dockerfile, `npm start`, `npm run dev`) và `api/[...route].ts` (Vercel, nhập
  thẳng `src/app.ts`, KHÔNG đi qua `index.ts`). Kiểm lúc khởi động một mình không phủ Vercel.
- `Dockerfile` không đặt `NODE_ENV`; `docker-compose.yml` không truyền `DATA_API_KEYS`. Đoán «production» bằng
  `NODE_ENV=production` sẽ để bản Docker mở.
- Project Vercel `onehub-data-api` có `DATABASE_URL`, không có `DATA_API_KEYS` (gs-2511-1).

## 2. Luật mới — đóng mặc định

Môi trường **mở được** khi và chỉ khi `NODE_ENV` là `development` hoặc `test` VÀ không có biến `VERCEL`. Mọi môi trường
khác — `NODE_ENV=production`, `NODE_ENV` vắng hay giá trị khác, mọi bản trên Vercel kể cả preview — là **môi trường đóng**.

| Môi trường | Danh sách khoá (sau khi tách dấu phẩy, bỏ khoảng trắng, bỏ phần tử rỗng) | Hành vi |
|---|---|---|
| đóng | rỗng | mọi `/v1/**` → 503 `{error:{code:"AUTH_NOT_CONFIGURED",message}}`, không gọi handler, không truy vấn DB; `/health` → 503 `{status:"misconfigured",error:{…}}`; `/openapi.json` → 200 (tài liệu tĩnh, không dữ liệu); `index.ts` không khởi động (thoát 1, thông điệp ghim) |
| đóng | có khoá | như hôm nay: thiếu/sai khoá 401, đúng khoá (Bearer hoặc `X-API-Key`) qua; `/health`, `/openapi.json` không cần khoá |
| mở | rỗng | như hôm nay: không xác thực (dev, test) |
| mở | có khoá | như hôm nay: xác thực bằng khoá |

- Đọc `process.env` ở MỖI lời gọi (hàm `authConfig()` nhỏ), không chốt lúc nạp module: biến đặt sau khi nạp vẫn có hiệu
  lực, và test đổi môi trường giữa các ca không phải nạp lại module.
- Thông điệp không bao giờ chứa giá trị khoá; chỉ nêu tên biến và cách sửa.
- `npm run dev` đặt `NODE_ENV=development` trong script (cú pháp POSIX) để dev cục bộ vẫn chạy không khoá.
- `docker-compose.yml` truyền `DATA_API_KEYS: ${DATA_API_KEYS:?set_api_keys}` — thiếu thì compose từ chối dựng.

## 3. Vì sao đóng mặc định, không «đoán production» (Hỏi-1)

Lối gs nêu là «production thiếu khoá thì từ chối». Có hai cách đọc «production»:

- **(khuyên) đóng mặc định:** chỉ hai giá trị `NODE_ENV` khai rõ là dev/test mới mở. Quên đặt `NODE_ENV` ở bản Docker hay
  một máy chủ trần → đóng. Giá: test HT19 (`data-api/test/dong-ba-route.test.ts`) đang dựa vào «không khoá là mở», phải
  thêm đúng một dòng `process.env.NODE_ENV = "test"`; hồ sơ HT19 có thể phải ghim lại bằng máy sau khi PB3 gộp.
- **(lối khác) chỉ đóng khi `NODE_ENV=production` hoặc có `VERCEL`**, thêm `ENV NODE_ENV=production` vào Dockerfile:
  không chạm test HT19. Giá: chạy `node dist/index.js` ở chỗ không đặt `NODE_ENV` thì API vẫn mở — đúng lớp lỗi «mở khi
  quên cấu hình» mà hàng này sinh ra để đóng.

## 4. Lối vào

- `src/middleware/auth.ts`: `authConfig()` → `{ moDuoc, khoa[] }`; middleware theo bảng §2.
- `src/index.ts`: trước `serve()`, môi trường đóng mà khoá rỗng → `console.error(<thông điệp ghim>)`, `process.exit(1)`.
- `api/[...route].ts`: không đổi — lớp middleware đã đóng mọi lời gọi.

## 5. Test và phép đo

- `data-api/test/auth-dong.test.ts` (DB thử `db/db-thu.sh oneinvest_suite_dapi`, cùng cách HT19): ma trận môi trường ×
  khoá × đường gọi `app.fetch` trực tiếp; bọc `pool.query` để đếm truy vấn (ca đóng phải 0); ca khởi động sinh tiến trình
  con `node --import tsx src/index.ts` với cổng ngẫu nhiên, đo mã thoát + stderr + cổng không mở.
- Probe `pha.mjs`: chép `data-api/` sang thư mục tạm, thay `auth.ts`, `index.ts` bằng bản ở base (`git merge-base HEAD
  origin/main`), chạy test → PHẢI đỏ, và tên ca đỏ phải gồm đúng các ca ghim (đối chứng chiều đỏ).
- Probe `pham-vi.mjs`: tệp đổi trong ranh giới; diff test HT19 chỉ một dòng thêm; không `package-lock.json`; không tên
  nguồn thật trong `data-api/` (bộ lấy tên `scripts/lib/tier-a-source-names.mjs`, không in tên).

## 6. Ngoài phạm vi

So khoá bằng phép so thời gian hằng (`timingSafeEqual`); giới hạn tần suất; khoá theo khách hàng, phạm vi quyền; xoay
khoá; đặt khoá thật trên Vercel (việc triển khai riêng, sau khi PB3 gộp, có lời gs); đổi `api/[...route].ts`.
