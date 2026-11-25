---
schema_version: 1
feature: data-api đóng khi thiếu khoá (PB3) — môi trường không khai rõ là dev/test mà danh sách khoá API rỗng thì từ chối mọi lời gọi dữ liệu và bản Node không khởi động
slug: data-api-dong-khi-thieu-khoa
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, docs]
status: approved
design_doc: _acceptance/data-api-dong-khi-thieu-khoa/design.md
approved_by: Mạnh
approved_at: 2026-11-25
---

# Acceptance Contract: data-api-dong-khi-thieu-khoa

## Context

`data-api/` là API công khai (đi kho public). Lớp xác thực `src/middleware/auth.ts` coi danh sách khoá `DATA_API_KEYS`
rỗng là «chế độ dev» và cho mọi lời gọi qua, bất kể đang chạy ở đâu. Project Vercel `onehub-data-api` hiện không có biến
khoá (gs-2511-1), nên lần triển khai nào chạy được sẽ mở dữ liệu cho cả Internet. gs giao hàng này trong XONG m5-2511-3
điều (4): production thiếu danh sách khoá thì từ chối mọi lời gọi hoặc không khởi động, có test; làm sau HT19, trước HT20;
không triển khai data-api lên Vercel khi hàng này chưa gộp.

Hai lối vào: `src/index.ts` (Node — Docker, `npm start`, `npm run dev`) và `api/[...route].ts` (Vercel, nhập thẳng
`src/app.ts`). Kiểm lúc khởi động không phủ Vercel, nên hàng làm cả hai lớp: middleware đóng mọi lời gọi, `index.ts` không
khởi động. Luật môi trường: bảng `design.md` §2 — chỉ `NODE_ENV` ∈ {`development`, `test`} và không có biến `VERCEL` là
môi trường mở; mọi môi trường khác (kể cả `NODE_ENV` vắng) là môi trường đóng (Hỏi-1).

Căn cứ: gs XONG m5-2511-3 điều (4) (kênh điều phối, 25/11 04:32Z) · ADR-0007 (data-api công khai) · `design.md`.

## Criteria

- AC-1: Given môi trường đóng — từng ca `NODE_ENV=production`; `NODE_ENV` vắng; `NODE_ENV=staging` (giá trị lạ);
  `NODE_ENV=development` kèm `VERCEL=1`; `NODE_ENV=test` kèm `VERCEL=1` — và danh sách khoá rỗng theo từng dạng (biến vắng;
  chuỗi rỗng; chỉ dấu phẩy và khoảng trắng `" , ,"`), When gọi MỌI đường `/v1/**` đăng ký trong `app` (đọc từ bảng route của
  app, tham số đường thay bằng giá trị mẫu — không liệt kê tay; số đường đếm được phải lớn hơn 5, tức có cả đường chi tiết),
  mỗi đường có và không có header khoá, Then mỗi lời gọi trả 503 với thân `{error: {code: "AUTH_NOT_CONFIGURED", message}}`
  (`message` là chuỗi không rỗng), số truy vấn DB phát ra trong ca = 0; `/health` trả 503 với `status` = `misconfigured`;
  `/openapi.json` trả 200.
- AC-2: Given môi trường mở (`NODE_ENV=development` và `NODE_ENV=test`, không `VERCEL`) và danh sách khoá rỗng, When gọi
  `/v1/markets` không header khoá, Then 200 như hôm nay (đối chứng dương: dev và test không gãy).
- AC-3: Given danh sách khoá có hai khoá, ở cả môi trường đóng (`NODE_ENV=production`) lẫn mở, When gọi `/v1/markets` không
  header, với khoá sai, với khoá đúng qua `Authorization: Bearer`, với khoá thứ hai qua `X-API-Key`, và gọi `/health`,
  `/openapi.json` không header, Then 401 `UNAUTHORIZED`, 401, 200, 200, 200, 200 — hành vi hôm nay giữ nguyên.
- AC-4: Given biến môi trường đổi giữa hai lời gọi trong cùng tiến trình (khoá rỗng → có khoá → rỗng, môi trường đóng),
  When gọi `/v1/markets` sau mỗi lần đổi, Then trạng thái theo đúng biến lúc gọi (503 → 401 → 503) — middleware đọc biến ở
  mỗi lời gọi, không chốt lúc nạp module.
- AC-5: Given tiến trình con `node --import tsx src/index.ts` với cổng trống, When khởi động ở môi trường đóng (`NODE_ENV=production`
  và `NODE_ENV` vắng — ca Docker), khoá rỗng, Then tiến trình thoát mã khác 0 trong 10 giây, stderr chứa NGUYÊN câu thông điệp
  ghim (hằng xuất từ `auth.ts`, test đọc lại hằng đó), và cổng không nhận kết nối; đối chứng: cùng lệnh với khoá đặt, và ở
  `NODE_ENV=development` không khoá, tiến trình lắng nghe cổng và `/health` trả 200.
- AC-6: Given khoá cấy là chuỗi canh riêng, When chạy các ca AC-1, AC-3, AC-5, Then không thân trả về, stdout hay stderr
  nào chứa chuỗi canh đó (thông điệp chỉ nêu tên biến, không nêu giá trị).
- AC-7: Given bản sao `data-api/` với `src/middleware/auth.ts` và `src/index.ts` thay bằng bản ở merge-base với `main`,
  When chạy bộ test của hàng trên bản sao, Then tệp test vẫn nạp được (có ít nhất một tên ca PB3 trong đầu ra), bộ test đỏ,
  và tập ca đỏ gồm ít nhất các ca ghim của AC-1, AC-4, AC-5 (chiều đỏ có thật — thước không xanh trên bản mở cũ); trên cây
  thật cùng lệnh xanh.
- AC-8: Given nhánh sau hàng, When soát, Then (a) mọi tệp đổi nằm trong ranh giới: `data-api/src/middleware/auth.ts`,
  `data-api/src/index.ts`, `data-api/package.json` (chỉ script `dev`), `data-api/test/auth-dong.test.ts`,
  `data-api/test/dong-ba-route.test.ts` (chỉ thêm đúng một dòng đặt `NODE_ENV` = `test`), `data-api/README.md`,
  `data-api/CLAUDE.md`, `data-api/.env.example`, `data-api/docker-compose.yml`, `_acceptance/data-api-dong-khi-thieu-khoa/**`,
  đúng các khoá `executors.*.dapi_khoa*` thêm vào `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`; không
  `package-lock.json`; (b) mọi tệp test của `data-api/test/` chạy chung một lượt trên DB thử đều xanh (kể cả test HT19 sau
  dòng `NODE_ENV`); (c) toàn cây `data-api/` không có tên nguồn thật (bộ lấy tên `scripts/lib/tier-a-source-names.mjs`,
  không in tên); (d) `npm run typecheck` trong `data-api/` thoát 0.
- AC-9: Given tài liệu sau hàng, When đọc, Then `README.md` (bảng biến môi trường + mục Authentication) và `.env.example`
  nói đúng luật mới — chỉ `NODE_ENV` development/test mở được khi không khoá, nơi khác thiếu khoá thì 503 và bản Node không
  khởi động; `docker-compose.yml` truyền `DATA_API_KEYS` dạng bắt buộc (`${DATA_API_KEYS:?…}`); `CLAUDE.md` mô tả
  `auth.ts` đúng luật mới; không câu nào còn nói «trống = tắt auth» vô điều kiện (judgment).

## Coverage

Quét hình thái làm tay trong bước thiết kế: không gian là tích có hạn, liệt kê đủ được.

- Trục A — môi trường: `production` · vắng · giá trị lạ (`staging`) · `development` · `test` · `VERCEL` đặt kèm `development`
  · `VERCEL` đặt kèm `test` — mỗi giá trị một ca riêng ở AC-1/AC-2 [thước CE: hàm `authConfig()` — mọi nhánh của nó có ca]
- Trục B — danh sách khoá: biến vắng · chuỗi rỗng · chỉ dấu phẩy/khoảng trắng · một khoá · hai khoá
- Trục C — đường: mọi đường `/v1/**` đọc từ bảng route của app · `/health` · `/openapi.json`
- Trục D — cách gửi khoá: không header · sai · `Bearer` · `X-API-Key`
- Trục E — lối vào: middleware (phủ cả Vercel vì `api/[...route].ts` nhập thẳng `app.ts`) · `index.ts` khởi động
- Trục F — vật ngoài mã: tài liệu · compose · phạm vi · tên nguồn thật · typecheck
- Trục G — lớp đo: chiều đỏ trên bản cũ (AC-7) · không lộ giá trị khoá (AC-6) [CE chưa kiểm chứng]
- Ô bỏ có tên: so khoá thời gian hằng, giới hạn tần suất, Dockerfile — Out of scope.

## Đường đo

Không có `opportunity.md` (hàng nền an toàn, không ngưỡng UAT).

## Out of scope

- So khoá bằng phép so thời gian hằng (`timingSafeEqual`) — lỗ khác loại, hàng riêng nếu gs cần.
- Giới hạn tần suất, khoá theo khách hàng, phạm vi quyền, xoay khoá.
- Đặt khoá thật trên Vercel và triển khai — việc vận hành riêng sau khi hàng gộp, có lời gs; khoá không vào kho, kênh.
- Đổi `api/[...route].ts`, `vercel.json`, `Dockerfile` — lớp middleware đã đóng mọi lối vào; Dockerfile không cần
  `NODE_ENV` vì môi trường vắng `NODE_ENV` đã là môi trường đóng.
- App `/api/v1/**` (khoá của đội vận hành) — ngoài data-api.

## Notes

- Đổi hành vi có chủ đích: bản chạy nào hôm nay dựa vào «không khoá là mở» mà không đặt `NODE_ENV=development|test` sẽ
  nhận 503. Trên kho: `npm run dev` được sửa để đặt `NODE_ENV=development`; test HT19 thêm một dòng `NODE_ENV = "test"`.
- Hỏi-1 (chỉ người có — khẩu vị rủi ro): đóng mặc định (khuyên) hay chỉ đóng khi `NODE_ENV=production`/`VERCEL` (lối khác:
  không chạm test HT19, nhưng máy chủ trần quên đặt `NODE_ENV` vẫn mở). Chi tiết `design.md` §3.
- Hồ sơ HT19 có eval chạy `data-api/test/dong-ba-route.test.ts`; sau khi hàng này gộp, hồ sơ HT19 có thể phải ghim lại bằng
  máy (lượt làn, không đổi kết quả) — việc của làn gộp, báo gs cùng lúc mở PR.
