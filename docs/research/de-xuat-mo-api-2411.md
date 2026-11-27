# Đề xuất mở API dữ liệu (24/11) — bản chuyển cho GS

> Trạng thái: **ĐỀ XUẤT**, chưa phải kế hoạch chung. Mạnh trả lời «Theo khuyến nghị» cho tám câu ngày 24/11/2026 trên M5,
> nhưng nói rõ: «các hạng mục đã thảo luận nó chỉ là đề xuất trước khi Điều phối Mac Mini chưa đồng ý thì nó chưa được
> thành kế hoạch chung». Chuyển nguyên văn lên nhánh này ngày 27/11 theo lời GS (GS chưa nhận bản này khi bàn giao).
> Phần I là khung nghiên cứu (`saas-api-khung-2411.md` của nhánh `docs/saas-api-khung-2411`, commit `3071e9bcf`, chưa
> đẩy trước đây). Phần II là bản nháp quyết định kiến trúc kèm theo — **bỏ số ADR** (số 0018 trùng với một nháp khác);
> chỗ nhắc «ADR-0018» trong hai phần đọc là «nháp ADR mở API», số do GS cấp khi nhận.

---

# Phần I — Khung API dữ liệu kiểu SaaS

# Chuẩn hoá thành dịch vụ API kiểu SaaS — khung, đánh giá, đề xuất

> Ngày 2026-11-24 · Trạng thái: **đề xuất** — Mạnh trả lời «Theo khuyến nghị» cho cả tám câu (§7 và §9.6), và nêu cùng ngày:
> đây là đề xuất, Điều phối Mac mini đồng ý thì mới thành kế hoạch chung. Bản gom thành quyết định đề xuất nằm ở
> `docs/adr/0018-api-du-lieu-la-san-pham.md` (số tạm); chưa có gì được ghi vào ROADMAP §3, `AGENTS.md` hay lộ trình. Tệp này
> là căn cứ, giữ nguyên chữ lúc trình.
> Yêu cầu của Mạnh (24/11): «chuẩn hoá dịch vụ như là một công ty SaaS với dịch vụ về API để một số ứng dụng có thể sử dụng,
> ví dụ lấy được danh sách căn sau khi hoàn chỉnh và công khai, giúp một số CRM bất động sản nhập mã số căn trong danh bạ thì
> enrich data về».
> Căn cứ đã đọc: `docs/product/FRAMING.md`, ROADMAP §1 và §3 (mục 23, 25, 27, 38, 48, 54, 55), ADR-0007 §3 (DCA), ADR-0014,
> ADR-0015, ADR-0016, ADR-0017, `docs/architecture/portals.md` §10, `data-api/`, `app/src/lib/api-surface.ts`,
> `docs/plan/lo-trinh.json` (DN4, DA13, EN4, AH2).
> Giới hạn: máy viết tệp này không có DB máy thu, nên mọi con số dưới đây chép từ ROADMAP kèm ngày đo, không đo lại.

## 1. Khung (framing)

### 1.1 Bài toán nói bằng một câu

Biến **danh bạ nhà** của OneHub (dự án → phân khu → toà → trục → căn, mỗi giá trị có căn cứ) thành một **dịch vụ định danh
và làm giàu dữ liệu bất động sản** mà phần mềm khác gọi được, có hợp đồng ổn định, có khách hàng, có hạn mức và có điều khoản.

### 1.2 Sản phẩm đổi vai

| | Hôm nay | Sau khi chuẩn hoá |
|---|---|---|
| Sản phẩm | Hai cổng (Invest, Ops); API là phụ phẩm của cổng | Dữ liệu qua API là sản phẩm lõi; cổng Invest, Quỹ hàng, CRM là khách của cùng API |
| Khách | Nhà đầu tư đọc màn hình | Thêm: đội phần mềm (CRM, sàn, ứng dụng họ onehub, agent) gọi bằng máy |
| Lời hứa | «Số trên màn đúng» | «Mã căn này là căn nào, thuộc tính gì, chắc tới đâu, đo lúc nào» và lời hứa đó không đổi shape |
| Đơn vị bán | Không bán | Lượt tra, gói dữ liệu, thoả thuận kết nối |

Điều này khớp FRAMING §1 («bản ghi gốc: số nhà, mã căn; các trường là phần làm giàu») và ROADMAP §3 mục 28 («danh bạ là định
danh nhà»). Nó cũng đúng nguyên tắc ADR-0017 §3: «đội của mình là một công ty như mọi công ty».

### 1.3 Ba việc khách cần làm (job)

| # | Việc của khách | Ví dụ Mạnh nêu | Thứ phải có |
|---|---|---|---|
| J1 | **Lấy danh mục**: cây dự án → toà → căn đã hoàn chỉnh và công khai | «lấy được danh sách căn» | Liệt kê có phân trang, lọc, đồng bộ phần thay đổi |
| J2 | **Tra và làm giàu theo mã**: có mã căn, nhận về hồ sơ căn | «CRM nhập mã số căn thì enrich data về» | Khớp mã (kể cả viết lệch), trả hồ sơ kèm độ chắc |
| J3 | **Giữ tươi**: căn đã lấy về thay đổi thì được báo | (hệ quả của J1, J2) | Dòng thay đổi và webhook |

Ngoài ba việc này, các bề mặt đã có (chỉ số thị trường, tin rao công khai, tra hồ sơ người bán của EN4) là dữ liệu đi kèm, không
phải lý do khách đến.

### 1.4 Tham chiếu

Mô hình gần nhất là «từ điển nhà» của Beike (đã là tham chiếu của mục 28), các API hồ sơ bất động sản kiểu ATTOM, CoreLogic ở
Mỹ, và RESO Web API về hợp đồng dữ liệu. Phần này viết từ hiểu biết chung, chưa khảo sát lại thị trường Việt Nam trong lượt này;
câu «chưa ai ở Việt Nam làm» là giả thuyết cần kiểm ở chặng 0.

### 1.5 Thế nào là thành công, thế nào là hỏng

- **Thành công**: một CRM ngoài đội nhập mã căn của một dự án đã phủ và nhận đúng hồ sơ ở ≥ 90% lượt tra; ba ứng dụng gọi thật
  hằng tuần; không lần nào tầng A, S02 hay bảng `stg_*` đi qua API.
- **Hỏng dù chạy được**: API trả dữ liệu mà không nói độ chắc và mốc đo; khách cào sạch danh bạ rồi đi; dựng xong nền tảng
  SaaS (thanh toán, cổng nhà phát triển) trước khi có khách; việc này cắt ngang đường găng MS1–MS5.

## 2. Hiện trạng

### 2.1 Đã có, dùng lại được

| Thứ | Ở đâu | Giá trị cho API |
|---|---|---|
| Khoá mờ bền cho toà, trục, căn (`bld_`, `stk_`, `unt_`), UPI, bí danh mã nguồn, vòng đời gộp, tách, nghỉ | ADR-0016 §3–§4, migration 082 | Đúng thứ một API định danh cần: mã không đổi, có bí danh, có sự kiện |
| Mọi thuộc tính là phát biểu có căn cứ; thang bậc B0–B5 | ADR-0013, FRAMING §3.4 | Trả kèm độ chắc và bậc: khác biệt so với dữ liệu rao vặt |
| Nguyên tắc SaaS: cơ chế ở kiến trúc, chính sách ở thoả thuận; lớp dữ liệu có trần; một API có phiên bản; webhook có ký | ADR-0017 §3–§4 | Dùng nguyên cho sản phẩm API, không phát minh lại |
| Hợp đồng API: OpenAPI trước, `/api/v1`, quyền theo scope, token máy tách người | ADR-0007 §3 | Đã là luật; ADR này ghi «API đọc công khai là ADR riêng» |
| Sổ bề mặt API, kiểm ở CI; công cụ MCP theo sổ | `app/src/lib/api-surface.ts`, `mcp-tools.json` | Cơ chế quản bề mặt có sẵn |
| Bộ soát tầng A, danh sách cột được lên cloud | `pipeline/sync-cloud.mjs` (`CLOUD_ALLOW`, `gatePii`) | Cửa ra đã có rào |
| Module API độc lập (Hono), có bản công khai | `data-api/` | Chỗ đứng tự nhiên của dịch vụ |

### 2.2 Khoảng trống

| # | Khoảng trống | Số đo, căn cứ |
|---|---|---|
| G1 | **Danh bạ căn chưa lên cloud.** Mọi bảng toà, trục, căn và thuộc tính căn ghi «chỉ local» | DN4 `danh-ba-len-cloud` mới có `opportunity.md`, chưa mở vòng |
| G2 | **Danh bạ sâu nhưng hẹp.** Căn có thuộc tính tập trung ở danh mục một chủ đầu tư (S16) và hai dự án S08 | 84.822 căn có thuộc tính trên 111.331 căn có bí danh S16 (19/11); Ocean Park 1: 318 căn, Grand Park: 1.417 căn từ S08 (07/11) |
| G3 | **Hồ sơ căn mới có nửa danh mục.** Nửa thị trường theo căn (tin đang rao, lịch sử giá, hạng giá cấp toà) chưa có | 15/11: 0 tin S03 gắn toà (mốc MS3 chưa đạt) |
| G4 | **Quyền đưa dữ liệu ra ngoài chưa chốt** cho ba loại: mã căn S16 lấy bằng đăng nhập («chưa có lời», mặc định nội bộ, không lên cloud); tin rao từng tin cho bên thứ ba dùng lại; SĐT người bán theo lô | Mục 48, mục 54 Q-C; ADR-0017 «Còn mở» (rà Luật Bảo vệ dữ liệu cá nhân) |
| G5 | **Chưa có lớp khách hàng.** Xác thực của `data-api` là một danh sách khoá trong biến môi trường: không khách, không scope, không hạn mức, không đo lượt dùng | `data-api/src/middleware/auth.ts` |
| G6 | **Hai bề mặt API trùng nhau**, shape khác nhau | `app/src/app/api/v1/*` (4 route công khai) và `data-api/src/routes/*` (5 nhóm) |
| G7 | **`data-api` chưa có bản chạy thật** | Chân trời AH2: hoãn, chờ dữ liệu sạch |
| G8 | **Chưa có phần «công ty»**: điều khoản dùng API, tài liệu cho nhà phát triển, cam kết độ sẵn sàng, nhật ký thay đổi, kênh hỗ trợ | — |
| G9 | **Luật dữ liệu chưa có chỗ cho tài khoản khách API.** Luật 6 xếp «hồ sơ người dùng app» vào tầng A, không rời máy thu; khách API thì phải sống trên cloud | AGENTS.md luật 6 |

## 3. Phân tích

### 3.1 «API kéo» có trái ADR-0017 và ADR-0015 không

ADR-0017 §5 viết «Invest đẩy, không ai chọc vào Invest». Dịch vụ API là kiểu khách kéo. Hai điều này không trái nhau nếu tách
rõ: khách gọi vào **bản chiếu trên cloud**, còn bản chiếu do máy thu tính sẵn rồi đẩy lên, đúng mẫu ADR-0014. Không lời gọi nào
của khách tới được máy thu. Kết nối với Quỹ hàng khi đó thành một khách của cùng dịch vụ, hoặc giữ dạng đẩy theo lô như một
cách giao hàng thứ hai của cùng hợp đồng.

### 3.2 Lớp dữ liệu có trần

Dùng lại ý «lớp dữ liệu có trần» của ADR-0017 §3. Mỗi khoá API chỉ mở tới lớp mà thoả thuận của khách cho phép.

| Lớp | Gồm | Căn cứ quyền | Đề xuất trần |
|---|---|---|---|
| L0 Danh mục | Dự án, phân khu, toà, trục, căn; thuộc tính căn; chủ đầu tư, pháp lý, bàn giao; giá chủ đầu tư và quỹ căn S08 | Mục 38: thông tin dự án là công khai | Mở cho mọi khoá, có hạn mức |
| L1 Thị trường tổng hợp | Trung vị, dải giá theo phường, dự án, toà × loại căn; hạng giá | Tự tính từ tin; riêng chỉ số tổng hợp của S06, S07 theo mục 27 | Gói trả tiền |
| L2 Tin rao từng tin | Giá, ngày, loại, căn được gắn; không đường dẫn gốc, không tên nguồn | Mục 25 cho hiện trên cổng mình; cho bên thứ ba dùng lại thì **chưa có lời** | Theo thoả thuận, sau khi rà pháp lý |
| L3 Liên hệ người bán | Tên, SĐT của đúng một tin | Tầng C; cổng chỉ trả khi bấm «Xem số» | Từng tin một, có đếm; không trả theo lô |
| L4 Mã căn và thuộc tính lấy bằng đăng nhập (S16) | — | Mục 48: mặc định nội bộ | Chờ Mạnh (§7 câu 3) |
| Không bao giờ | Tầng A, S02, số S02, bảng `stg_*`, đường dẫn bài gốc, ảnh gốc, ngày sinh và giới tính, giấy tờ người mua | Luật 5, 6 | — |

### 3.3 Ba phương án chỗ đứng

| | A. Thêm route vào `app/api/v1` | B. Nâng `data-api/` thành dịch vụ | C. Sản phẩm riêng, kho riêng (mẫu Quỹ hàng) |
|---|---|---|---|
| Cách làm | Next.js trên Vercel phục vụ luôn API khách | Hono đọc bản chiếu cloud; thêm lớp khách hàng tối thiểu | Kho riêng tư, DB riêng; Invest là bên cung cấp qua một loại kết nối |
| Được | Nhanh nhất; sổ bề mặt có sẵn | Module đã độc lập, đã có bản công khai, đúng vai «máy đọc qua API»; tách ra sau này dễ | Luật dữ liệu khách hàng tách hẳn; giá, hợp đồng, thanh toán ở kho riêng tư; đúng ADR-0017 |
| Mất | Trộn sản phẩm cổng với sản phẩm API; nhịp phát hành, hạn mức, sự cố dính nhau; tài khoản khách API nằm trong DB Invest | Lớp khách hàng phải tránh thư mục công khai; vẫn chung kho với Invest | Thêm một kho, một DB, một đường đồng bộ cho đội một đến hai người; dựng trước khi có khách là trái luật 11 |
| Hợp khi | Chỉ phục vụ cổng của mình | Khách đầu là ứng dụng trong nhà và vài đối tác thử | Có khách ngoài trả tiền, cần hợp đồng và cách ly |

Phương án bị loại sớm: **chỉ giao theo lô** (tệp hoặc webhook, không có tra cứu). Nó không đáp ứng J2, vì CRM cần câu trả lời
ngay lúc người dùng gõ mã căn.

## 4. Đánh giá

| Tiêu chí | Mức | Vì sao |
|---|---|---|
| Giá trị với khách | Cao | Mã căn là thứ môi giới đang giữ (FRAMING D3); CRM nhập mã mà tự điền diện tích, phòng ngủ, hướng, mặt bằng, giá chủ đầu tư là tiết kiệm thấy ngay |
| Khớp chiến lược | Cao | Đúng «bản ghi gốc», đúng mục 28, đúng nguyên tắc ADR-0017; mở chiều ngược «xác nhận danh mục» từ CRM về danh bạ |
| Dữ liệu sẵn sàng cho J1, J2 | Trung bình | Sâu ở một chủ đầu tư và hai dự án, chưa rộng; chưa lên cloud (G1, G2) |
| Dữ liệu sẵn sàng cho phần thị trường theo căn | Thấp | Phụ thuộc MS3, MS4 (G3) |
| Nền tảng sẵn sàng | Thấp | Chưa có khách hàng, hạn mức, bản chạy thật (G5–G8) |
| Rủi ro pháp lý | Thấp ở L0, L1; cao ở L2–L4 | G4 |
| Rủi ro phân tán | Cao nếu làm sớm và rộng | Đội nhỏ, sáu mốc đang chạy; lớp API mỏng, giá trị nằm ở danh bạ |
| Rủi ro bị cào sạch | Trung bình | Chặn bằng hạn mức, điều khoản, và «tra theo mã, không liệt kê» cho lớp nhạy |

**Kết luận đánh giá.** Hướng đi đúng và nên chốt ngay ở mức hợp đồng. Việc dựng thì phải đi sau dữ liệu: lớp API chỉ là
phần mỏng, còn thứ khách mua là độ phủ và độ đúng của danh bạ. Vì vậy thứ nên làm sớm là **đóng khung hợp đồng** (để mọi
hàng danh bạ sắp làm đều ra đúng shape sẽ bán), không phải dựng nền tảng SaaS.

## 5. Đề xuất giải pháp

### 5.1 Chỗ đứng: B trước, C khi có điều kiện

Nâng `data-api/` thành **OneHub Data API**, thiết kế theo nguyên tắc của C ngay từ đầu (hợp đồng có phiên bản, lớp dữ liệu có
trần, thoả thuận là đối tượng), để lúc tách không phải viết lại. Tách thành sản phẩm và kho riêng khi **một trong ba** điều
xảy ra: có khách ngoài trả tiền đầu tiên; cần lưu hợp đồng, hoá đơn của khách; hoặc lớp khách hàng buộc phải có mã riêng tư.

### 5.2 Kiến trúc

```
Máy thu (local)                          Cloud                                   Khách
────────────────                         ─────                                   ─────
pipeline → danh bạ, metrics
   │  bước «bản chiếu API» (tính sẵn)
   │  bộ soát ở cửa ra: tầng A, S02,
   │  stg_*, lớp L4
   ▼
   đẩy một chiều ───────────────►  bảng bản chiếu có phiên bản
                                   (hồ sơ dự án, toà, căn; tra bí danh;
                                    thị trường theo toà; dòng thay đổi)
                                             │
                                             ▼
                                   OneHub Data API  (data-api, Hono)
                                   khoá → khách → scope theo lớp → hạn mức → đếm lượt
                                   REST /v1 + OpenAPI 3.1 · MCP · hộp thư đi → webhook có ký
                                             │
                                             ▼
                          cổng Invest · Quỹ hàng · CRM họ onehub · CRM đối tác · agent
```

- **Mặt dữ liệu**: bảng phẳng tính sẵn theo đúng hợp đồng, máy thu đẩy lên (luật 10; ADR-0014). API không tính gì nặng lúc gọi.
- **Mặt điều khiển**: khách, khoá (lưu dạng băm), scope theo lớp L0–L3, thoả thuận, đếm lượt, nhật ký. Chặng 1 dùng lại
  mẫu token máy có scope đã có (`kiemTokenMay`, ADR-0015 §2). Chặng 2 dùng một dịch vụ quản khoá và hạn mức có sẵn, không tự
  viết phần đo lượt và thanh toán.
- **Một bề mặt**: `app/api/v1` công khai dần chuyển thành khách của Data API hoặc đọc cùng bản chiếu; không thêm route công
  khai mới ở `app/` cho việc này (đóng G6).
- **Hạ tầng**: giữ Vercel và Supabase đang dùng; không thêm hạ tầng mới ở chặng 1 (luật 11).

### 5.3 Hợp đồng API v1

| Nhóm | Đường | Trả gì |
|---|---|---|
| Danh mục (J1) | `GET /v1/projects`, `/v1/projects/{id}`, `/v1/projects/{id}/buildings` | Dự án, phân khu, toà; chủ đầu tư, pháp lý, bàn giao |
| | `GET /v1/buildings/{id}`, `/v1/buildings/{id}/units` | Toà, trục, danh sách căn có phân trang |
| | `GET /v1/units/{id}` | Hồ sơ căn: thuộc tính, tầng, trục, toà, dự án, phường, UPI, bậc B3–B5 |
| Tra và làm giàu (J2) | `POST /v1/units/resolve` | Nhận mã căn kèm dự án hoặc toà (hoặc chuỗi tự do), trả căn khớp, cách khớp, độ chắc; mơ hồ thì trả danh sách ứng viên, không đoán. Gọi theo lô tới 100 mã |
| Thị trường theo căn | `GET /v1/units/{id}/market` | Dải giá và trung vị của toà × loại căn, hạng giá, tin đang rao gắn ở mức sâu nhất biết được, lịch sử giá |
| Giữ tươi (J3) | `GET /v1/changes?since=…`, webhook | Sự kiện gộp, tách, nghỉ; thuộc tính đổi; tin mới trên căn khách theo dõi |
| Nói thật độ phủ | `GET /v1/coverage` | Mỗi dự án có bao nhiêu toà, căn, ở bậc nào, đo lúc nào |
| Đã có | `/v1/markets`, `/v1/asset-stats`, `/v1/listings` | Giữ, đưa về cùng hợp đồng |

Luật của hợp đồng:

1. **Mã bền.** Mã công khai là khoá mờ (`unt_…`) và UPI. Căn bị gộp vẫn tra được và trỏ sang căn mới. Mã không bao giờ dùng lại.
2. **Mỗi giá trị kèm căn cứ.** Từng trường trả `value`, `basis` (xác minh · suy ra · chưa biết), `as_of`. Không trình bày suy
   đoán như sự thật (FRAMING §3.2 chiều 6).
3. **Tên theo RESO** cho field và enum (luật 3); đường dẫn tiếng Anh.
4. **Chỉ thêm, không phá.** Trong `/v1` chỉ thêm trường. Đổi phá vỡ đi qua ADR, ra `/v2`, giữ bản cũ ít nhất sáu tháng.
5. **Không tên nguồn.** Ra ngoài chỉ có loại căn cứ («danh mục chủ đầu tư», «tin rao», «người xác nhận»), không tên nguồn thật,
   không đường dẫn gốc.
6. **Không tìm thấy thì nói không tìm thấy**, kèm lý do (dự án chưa phủ, mã không khớp), để khách biết là thiếu phủ hay gõ sai.

### 5.4 Phần «công ty SaaS»

| Mảng | Chặng 1 (trong nhà) | Chặng 2 (đối tác thử) | Chặng 3 (thương mại) |
|---|---|---|---|
| Khách và khoá | Token máy có scope, cấp tay | Khách tự tạo và xoay khoá; scope theo lớp | Nhiều khoá mỗi khách, phân vai |
| Hạn mức, đo dùng | Trần cứng theo khoá | Đếm lượt theo khách, theo đường | Tính tiền theo lượt hoặc theo gói |
| Tài liệu | OpenAPI + một trang hướng dẫn | Trang tài liệu, khoá thử với dữ liệu mẫu, SDK sinh từ OpenAPI | Trang trạng thái, nhật ký thay đổi công khai |
| Cam kết | Không | Mốc đo ghi trên từng phản hồi; mục tiêu p95 dưới 300 ms cho tra mã | Cam kết độ sẵn sàng theo gói |
| Pháp lý | — | Điều khoản dùng API, phạm vi dùng lại, ghi nguồn; rà Luật Bảo vệ dữ liệu cá nhân | Hợp đồng, phụ lục xử lý dữ liệu |
| Thoả thuận | Bản ghi tay | Thoả thuận là đối tượng: lớp nào, hiệu lực, ai duyệt; tắt là dừng | Điều khoản riêng cho L2, L3 |
| Gói và giá | — | Miễn phí trong thời gian thử | Ba gói: Danh mục · Làm giàu · Đối tác (mức giá chốt sau số đo chặng 2) |

### 5.5 Lộ trình và thước

| Chặng | Việc | Điều kiện vào | Xong khi (số đo được) |
|---|---|---|---|
| 0 — Đóng khung | ADR-0018 «API dữ liệu là sản phẩm»; bảng lớp dữ liệu; bản nháp OpenAPI v1; kiểm giả thuyết thị trường bằng ba cuộc nói chuyện với đội CRM | Mạnh chốt §7 | ADR được duyệt; ba đội CRM xác nhận họ sẽ gọi `resolve` |
| 1 — Trong nhà | Bản chiếu danh bạ lên cloud (chính là DN4, mở rộng thêm căn); `projects`, `buildings`, `units`, `resolve`, `coverage` trên `data-api`; bản chạy thật (mở AH2); khách đầu là một ứng dụng họ onehub | DN4 qua Cổng Phạm vi; DDL cloud có lời Mạnh | Trên một bảng hàng thật của sàn thử: tỉ lệ `resolve` đúng ≥ 90% ở dự án đã phủ; 0 dòng tầng A, S02, `stg_*` trong bản chiếu (bộ soát đỏ khi cấy) |
| 2 — Đối tác thử | Lớp khách hàng, hạn mức, tài liệu, khoá thử, `changes` và webhook, `units/{id}/market`; điều khoản | Chặng 1 đạt; MS3 đạt (mới có thị trường theo căn); rà pháp lý xong cho lớp sẽ mở | Ba ứng dụng ngoài đội gọi thật mỗi tuần trong bốn tuần liền |
| 3 — Thương mại | Gói, thanh toán, cam kết, trang trạng thái; tách sản phẩm riêng nếu chạm điều kiện ở §5.1 | Có khách đồng ý trả tiền | Khách trả tiền đầu tiên |

**Với đường găng hiện tại.** Chặng 0 chỉ là tài liệu, làm song song được. Chặng 1 không mở dãy mới cắt ngang MS1–MS5: phần
nặng của nó là DN4, vốn đã nằm trong mốc MS5. Việc thêm là chỉnh phạm vi DN4 để bản chiếu ra đúng shape hợp đồng, cộng một
hàng nhỏ cho các đường API.

## 6. Việc phải tránh

- Dựng thanh toán, cổng nhà phát triển, cam kết độ sẵn sàng trước khi có khách thứ nhất (luật 11).
- Cho khách hay cloud gọi vào máy thu (ADR-0015).
- Mở L2, L3 cho bên thứ ba trước khi rà pháp lý; trả SĐT theo lô.
- Đưa lớp khách hàng, giá, hợp đồng vào thư mục `data-api/` đang được đẩy nguyên sang kho công khai.
- Thêm route công khai thứ hai cho cùng dữ liệu ở `app/api/v1`.

## 7. Năm câu cần Mạnh chốt

| # | Câu | Khuyến nghị | Vì sao là việc của Mạnh |
|---|---|---|---|
| 1 | Chỗ đứng | **B trước, C khi chạm điều kiện §5.1** | Chiến lược sản phẩm |
| 2 | Khách đầu tiên | **Ứng dụng họ onehub trước** (Quỹ hàng hoặc CRM của đội), rồi tới hai, ba CRM đối tác | Thứ tự thị trường |
| 3 | Mã căn và thuộc tính S16 lấy bằng đăng nhập (L4) | **Cho tra theo mã, không cho liệt kê**: khách phải tự có mã mới nhận được hồ sơ; không đường nào trả cả danh sách | Đảo mặc định «chỉ nội bộ, không lên cloud» của mục 48 và 54 |
| 4 | Tin rao từng tin và SĐT cho bên thứ ba | **L2 chỉ mở theo thoả thuận, sau rà pháp lý; L3 từng tin một, không theo lô** | Rủi ro pháp lý và quan hệ với nguồn |
| 5 | Tài khoản khách API | **Sống trên cloud, là dữ liệu của mặt điều khiển, không thuộc tầng A**; ghi thành sửa đổi luật 6 trong ADR-0018 | Sửa luật an toàn cần lời riêng |

## 8. Bước kế sau khi chốt

1. Viết ADR-0018 và ghi ROADMAP §3 (mục mới), kèm bảng lớp dữ liệu của §3.2.
2. Viết bản phạm vi `docs/plan/pham-vi-api-du-lieu-*.md`, cắt hàng bằng `/acceptance-gate:cat-luot`; chỉnh phạm vi DN4.
3. Nháp `docs/api/` OpenAPI v1 cho các đường ở §5.3.

## 9. Bổ sung 24/11 — việc thứ tư: luồng tin mới và hot (J4)

> Ý của Mạnh (24/11): «danh sách những tin đăng mới và hot cũng là điều mà các công ty môi giới, cá nhân môi giới đang mong
> đợi, đây là API họ rất quan tâm, giống như dòng feed luồng thị trường». Nhu cầu là nhận định của Mạnh về thị trường; lượt
> này chưa kiểm bằng phỏng vấn hay số đo.

### 9.1 Đọc lại ý này

Thứ môi giới cần không phải «danh sách bài đăng» mà là **dòng sự kiện thị trường theo căn**: căn nào vừa lên thị trường, căn
nào vừa giảm giá, căn nào đang được nhiều người rao, căn nào rẻ hơn nhóm của nó. Với họ tốc độ là tiền: ai thấy hàng mới trước
thì dẫn khách trước. Hôm nay họ lấy thứ này bằng cách lướt hàng chục nhóm.

Ý này không mở hướng mới. Nó là mặt API của những thứ đã chốt: tin nhóm khép hiện công khai và độ tươi tính bằng phút (FRAMING
D4), mọi tin rao là công khai (mục 25), S03 là nguồn lõi (mục 51), một căn một dòng (MS4), căn giá tốt theo vị trí (mục 42, 48).

So với J1–J3: J1–J3 bán cho đội làm phần mềm, số khách ít; J4 bán cho mọi sàn và mọi môi giới, số khách nhiều và nhu cầu
hằng ngày. J4 kéo khách; danh bạ (J1–J3) là thứ làm J4 sạch hơn một nhóm chat, vì nhờ danh bạ mới gom được trùng và định vị
được căn.

### 9.2 «Mới» và «hot» phải định nghĩa được

| Sự kiện | Nghĩa | Phụ thuộc |
|---|---|---|
| Mới lên thị trường | Lần đầu thấy căn này được rao, không phải bài đăng lại | Gom trùng (MS4) |
| Đổi giá | Cùng căn, cùng người, giá khác | Lịch sử giá theo căn (mục 41) |
| Đăng lại | Bài mới cho căn đã có | Gom trùng |
| Ngừng rao | Không thấy lại quá 21 ngày | Đã có (migration 085) |

«Hot» không nên là một điểm số kín. Trả từng tín hiệu kèm lý do đọc được:

| Tín hiệu | Lý do trả kèm | Có chưa |
|---|---|---|
| Giá tốt | «rẻ hơn X% so với N căn cùng toà, cùng loại» | Cấp phường có; cấp dự án, toà theo MS2, MS3 |
| Vừa giảm giá | «giảm Y% so với lần rao trước» | Theo MS4 |
| Nhiều người cùng rao | «K người đăng trong 7 ngày» | Theo MS4 |
| Cầu đang khớp | «M yêu cầu cùng dự án, cùng số phòng trong 7 ngày» | Bảng Yêu cầu (mục 43), mới ở Ops |
| Hàng hiếm | «chỉ còn P căn cùng toà, cùng loại đang rao» | Theo MS3 |

Rủi ro riêng của «hot»: giá mồi. Căn rẻ bất thường phải mang nhãn «Cần xác minh» như hàng CG7 đã định (rẻ quá 35%), nếu
không luồng hot thành nơi phát tán giá ảo.

### 9.3 Điều kiện dữ liệu

| Điều kiện | Vì sao | Hiện trạng (ngày đo) |
|---|---|---|
| Độ trễ từ lúc đăng tới lúc ra luồng, tính bằng phút | Sản phẩm bán tốc độ; lời hứa chính là độ tươi | Chưa đo; từng đứt 34 giờ không ai biết (13–14/11); mốc MSV |
| Gom trùng | Thiếu thì luồng là bài đăng lại, tệ hơn nhóm chat | Ô «gom cụm» S03 bằng 0 (15/11); mốc MS4 |
| Định vị dự án, toà | Thiếu thì không lọc được, không so giá được | Đích MS1 từ 90% tin có dự án; MS3 chưa đạt |
| Chi phí đọc tin | Mỗi bài qua model; trần 20 USD mỗi ngày (mục 34) | Mở rộng nguồn thì phải tính lại trần |

Bốn điều kiện này trùng đúng các mốc đang chạy. J4 không thêm đường găng mới, nhưng nó biến MSV và MS4 từ việc nội bộ thành
lời hứa với khách.

### 9.4 Rủi ro

1. **Quyền dùng lại nội dung nguồn.** Kiểm 03/11 (mục 27): điều khoản của S06 và S07 cấm dùng nội dung cho mục đích thương
   mại và cấm tạo sản phẩm phái sinh khi không có văn bản cho phép. Luồng thương mại vì vậy không được mang tin S06 từng tin.
   Lõi của luồng là tin nhóm cộng đồng (S03, S05) và hàng do sàn tự đưa vào.
2. **Mất nguồn lõi.** Tin nhóm thu bằng tài khoản là thành viên nhóm. Một sản phẩm thương mại phát lại tin nhóm cho bên
   ngoài có thể khiến quản trị nhóm loại tài khoản thu. Đây là rủi ro lớn nhất, vì mất S03 là mất cả đường ống.
3. **Liên hệ người đăng.** Luồng không có cách liên hệ thì vô dụng với môi giới, còn trả SĐT theo lô thì thành kho số điện
   thoại để bán (Luật Bảo vệ dữ liệu cá nhân). Cần một đường ở giữa: tên trên sự kiện, số lấy từng tin, có đếm, có hạn mức.
4. **Vòng lặp tự ô nhiễm.** Khách lấy luồng rồi tự đăng lại vào nhóm; bài ấy lại được thu về. Luật 8 không bị phạm (hệ
   thống của mình không gửi), nhưng nguồn bị nhiễu. Chặn bằng gom trùng và điều khoản cấm đăng lại tự động.
5. **Lệch với FRAMING §2.1.** FRAMING ghi «gom vào, không phát ra; OneHub Invest là nơi hiển thị». Luồng API cho ứng dụng
   khác hiển thị là một bước ra khỏi câu đó. Hệ thống vẫn không đăng hộ vào kênh nào, nhưng FRAMING cần sửa và Mạnh duyệt.
6. **Môi giới cá nhân không gọi API.** Họ cần màn hình và thông báo, không cần khoá API. Bán API cho cá nhân là nhầm kênh.

### 9.5 Đề xuất

- **Một sản phẩm, hai bề mặt.** Công ty môi giới có CRM: API luồng. Môi giới cá nhân: trang «Mới và hot» trên cổng Invest,
  có bộ lọc lưu được. Thông báo đẩy tới cá nhân là việc sau, và mọi đường gửi qua S03 cần lời riêng của Mạnh.
- **Hợp đồng.** `GET /v1/feed?since=<con trỏ>` kèm lọc theo dự án, toà, loại, dịch vụ, khoảng giá; bộ lọc đăng ký nhận qua
  webhook. Đây là cùng cơ chế với `changes` của §5.3, ở mức thị trường. Loại sự kiện: `new_to_market`, `price_changed`,
  `relisted`, `withdrawn`. Mỗi sự kiện mang căn hoặc toà hoặc dự án ở mức sâu nhất biết được, giá, giá/m², các tín hiệu hot
  kèm lý do, số người cùng rao, mốc đăng, mốc thấy lần đầu, độ chắc. Không tên nhóm, không tên nguồn, không đường dẫn gốc.
- **Bán độ tươi.** Luồng trễ 24 giờ mở rộng rãi; luồng theo phút là gói trả tiền. Đây là cách các dịch vụ dữ liệu thị trường
  vẫn phân gói, và nó giảm rủi ro số 2: phần mở rộng rãi không cạnh tranh trực tiếp với nhóm.
- **Nguồn dài hạn là hàng tự đưa vào.** Sàn dùng Quỹ hàng chủ động phát hàng vào luồng theo thoả thuận (loại kết nối «kênh
  đăng» của ADR-0017). Tin thu từ nhóm là cầu nối giai đoạn đầu, không phải nền móng.
- **Thứ tự.** Dùng trong nhà trước: trang luồng trên Ops rồi Invest, đội mình giao dịch trên đó (FRAMING D2), đo độ trễ và
  tỉ lệ trùng. API luồng cho bên ngoài vào chặng 2 của §5.5, cùng điều kiện rà pháp lý.

Thước của J4: p50 và p95 số phút từ lúc đăng tới lúc ra luồng; tỉ lệ sự kiện «mới lên thị trường» bị người chấm là đăng lại;
tỉ lệ sự kiện có dự án; tỉ lệ tín hiệu hot được môi giới chấm là đúng.

### 9.6 Ba câu thêm cho Mạnh

| # | Câu | Khuyến nghị |
|---|---|---|
| 6 | Nguồn của luồng bán ra ngoài | **Chỉ tin nhóm cộng đồng và hàng sàn tự đưa vào; không tin S06 từng tin** tới khi có văn bản cho phép. Tin nhóm ra ngoài đội chỉ sau khi rà pháp lý |
| 7 | Liên hệ trên luồng (sửa câu 4) | **Tên người đăng nằm trên sự kiện; SĐT lấy từng tin, có đếm, có hạn mức theo khoá**; không đường nào trả số theo lô |
| 8 | Bề mặt đầu tiên | **Trang «Mới và hot» cho đội mình dùng trước**, API luồng cho công ty môi giới ở chặng 2; sửa FRAMING §2.1 cho khớp |

---

# Phần II — Nháp quyết định kiến trúc (không số)

# ADR-0018: API dữ liệu là sản phẩm — OneHub Data API đọc bản chiếu trên cloud, dữ liệu ra ngoài theo lớp có trần

Ngày: 2026-11-24 · Trạng thái: **đề xuất** — chưa là kế hoạch chung. Mạnh trả lời «Theo khuyến nghị» cho cả tám câu của
`docs/research/saas-api-khung-2411.md` §7 và §9.6; cùng ngày Mạnh nêu: các hạng mục này là đề xuất, Điều phối Mac mini (chịu
trách nhiệm lộ trình) đồng ý thì mới thành kế hoạch chung. Số 0018 là số tạm, Điều phối Mac mini cấp số khi nhận ·
Sửa đổi kèm theo, **chưa áp** (nguyên văn ở Phụ lục): ADR-0007 §3 (API đọc công khai), luật 6 của `AGENTS.md` (tài khoản
khách API), ROADMAP §3 mục 48 và mục 54 Q-C (mã căn S16 lấy bằng đăng nhập), `docs/product/FRAMING.md` §2.1 · Liên quan:
ADR-0011 (RESO-first), ADR-0013 và ADR-0016 (căn, danh bạ), ADR-0014 và ADR-0015 (cloud không với vào máy thu), ADR-0017
(nguyên tắc SaaS, kết nối có thoả thuận)

> **Đọc tệp này thế nào.** Viết ở phiên điều phối máy M5, ngoài đợt đang chạy. Chưa có gì ở đây được ghi vào ROADMAP §3,
> `AGENTS.md`, FRAMING hay `docs/plan/lo-trinh.json`. Chữ «Mạnh chốt» trong thân bài nghĩa là «Mạnh đã chọn phương án này
> cho bản đề xuất»; luật hiện hành của kho vẫn là luật đang có, kể cả luật 6 và mục 48, 54 Q-C.

> Lời Mạnh (24/11): «Tôi muốn chuẩn hoá dịch vụ như là một công ty SaaS với dịch vụ về API để một số ứng dụng có thể sử dụng,
> ví dụ như lấy được danh sách căn sau khi hoàn chỉnh và công khai, giúp một số CRM bất động sản có thể nhập mã số căn trong
> danh bạ thì có thể enrich data về». Và: «danh sách những tin đăng mới và hot cũng là điều mà các công ty môi giới, cá nhân
> môi giới đang mong đợi, đây là API họ rất quan tâm, giống như dòng feed luồng thị trường».

## Bối cảnh

ADR-0007 §3 đặt API theo hướng «dùng trong nhà trước» và ghi rõ: API đọc công khai là một ADR riêng, không mặc định. ADR này
là ADR đó.

Khung, số đo hiện trạng, ba phương án chỗ đứng và bảng đánh giá nằm ở `docs/research/saas-api-khung-2411.md`. Ba điểm làm nền:

- Danh bạ vật thể (ADR-0016) đã có đúng thứ một API định danh cần: khoá mờ bền, UPI, bí danh mã nguồn, vòng đời gộp và tách,
  mọi thuộc tính là phát biểu có căn cứ. Nhưng mọi bảng toà, trục, căn còn «chỉ local».
- `data-api/` là module API độc lập, có bản công khai, xác thực bằng một danh sách khoá trong biến môi trường; chưa có khách
  hàng, scope, hạn mức, bản chạy thật.
- Lớp API là phần mỏng. Thứ khách mua là độ phủ và độ đúng của danh bạ, và độ tươi của tin.

## Quyết định đề xuất

Phần **Mạnh chốt** là tám câu đã trả lời cho bản đề xuất này. Phần **Thiết kế** là hướng đã trình cùng lúc; chi tiết chốt lại ở Cổng Phạm vi của
từng hàng.

### 1. Chỗ đứng (câu 1 — Mạnh chốt)

- `data-api/` được nâng thành **OneHub Data API**, sản phẩm API của OneHub. Nó ở trong kho này cho tới khi chạm điều kiện tách.
- Tách thành sản phẩm và kho riêng tư theo mẫu ADR-0017 khi **một trong ba** điều xảy ra: có khách ngoài trả tiền đầu tiên;
  cần lưu hợp đồng, hoá đơn của khách; lớp khách hàng buộc phải có mã riêng tư.
- Thiết kế theo nguyên tắc của ADR-0017 §3–§4 ngay từ đầu để lúc tách không viết lại: cơ chế ở kiến trúc, chính sách ở thoả
  thuận; lớp dữ liệu có trần; thoả thuận là một đối tượng; một API có phiên bản; webhook có ký.

### 2. Khách đầu tiên (câu 2 — Mạnh chốt)

Ứng dụng họ onehub trước (Quỹ hàng hoặc CRM của đội), rồi hai đến ba CRM đối tác. Đội của mình là một khách như mọi khách:
không cửa riêng.

### 3. Bốn việc của khách

| # | Việc | Bề mặt |
|---|---|---|
| J1 | Lấy danh mục: cây dự án → toà → căn đã hoàn chỉnh và công khai | Liệt kê có phân trang, lọc |
| J2 | Tra và làm giàu theo mã căn | `units/resolve`, hồ sơ căn kèm độ chắc |
| J3 | Giữ tươi dữ liệu đã lấy | Dòng thay đổi, webhook |
| J4 | Luồng thị trường: căn mới lên, đổi giá, đang hot | Dòng sự kiện theo căn; trang «Mới và hot» |

### 4. Mặt dữ liệu: bản chiếu trên cloud, máy thu đẩy (Thiết kế)

- Khách gọi vào **bản chiếu trên cloud**: bảng phẳng tính sẵn theo đúng hợp đồng, do máy thu tính rồi đẩy lên (luật 10,
  ADR-0014). API không tính gì nặng lúc gọi.
- **Không lời gọi nào của khách hay của cloud tới được máy thu** (ADR-0015). «Invest đẩy, không ai chọc vào Invest» của
  ADR-0017 §5 giữ nguyên: thứ khách kéo là bản chiếu, không phải Invest.
- Bộ soát ở cửa ra của máy thu chạy trước mỗi lượt đẩy: tầng A, S02, số S02, bảng `stg_*`, và lớp L4 ngoài đường tra theo
  mã. Gói không qua soát thì không đi.
- DDL và ghi dữ liệu trên cloud vẫn cần lời riêng của Mạnh cho từng hàng (AGENTS.md «Ai quyết gì»).

### 5. Lớp dữ liệu có trần

Mỗi khoá API chỉ mở tới lớp mà thoả thuận của khách cho phép.

| Lớp | Gồm | Trần | Căn cứ |
|---|---|---|---|
| **L0 Danh mục** | Dự án, phân khu, toà, trục, căn; thuộc tính căn; chủ đầu tư, pháp lý, bàn giao; giá chủ đầu tư và quỹ căn S08 | Mở cho mọi khoá, có hạn mức | Mục 38 |
| **L1 Thị trường tổng hợp** | Trung vị, dải giá, hạng giá theo phường, dự án, toà × loại căn | Gói trả tiền | Tự tính; xem «Còn mở» về tin S06 |
| **L2 Tin rao từng tin** | Giá, ngày, loại, căn được gắn; không đường dẫn gốc, không tên nguồn, không tên nhóm | Chỉ theo thoả thuận, sau rà pháp lý (câu 4 — Mạnh chốt) | Mục 25 |
| **L3 Liên hệ người đăng** | Tên nằm trên sự kiện; SĐT lấy **từng tin**, có đếm, có hạn mức theo khoá; không đường nào trả số theo lô (câu 7 — Mạnh chốt) | Theo thoả thuận | Mục 11, 25 |
| **L4 Mã căn và thuộc tính lấy bằng đăng nhập (S16)** | **Tra theo mã, không liệt kê**: khách phải tự có mã mới nhận được hồ sơ; không đường nào trả cả danh sách (câu 3 — Mạnh chốt) | Chỉ đường `resolve` | Sửa mục 48, mục 54 Q-C |
| **Không bao giờ** | Tầng A, S02, số S02, bảng `stg_*`, đường dẫn bài gốc, ảnh gốc, ngày sinh và giới tính, giấy tờ người mua | — | Luật 5, 6 |

- **Nguồn của luồng bán ra ngoài** (câu 6 — Mạnh chốt): chỉ tin nhóm cộng đồng (S03, S05) và hàng sàn tự đưa vào. **Không
  tin S06 từng tin** tới khi có văn bản cho phép của nguồn (kiểm điều khoản 03/11, mục 27). Tin nhóm ra ngoài đội chỉ sau rà
  pháp lý.
- **L4 trên cloud** (Thiết kế): mã căn S16 chỉ lên cloud trong bản chiếu của API, phục vụ đúng đường tra theo mã. Đề xuất lưu
  bí danh mã ở dạng băm theo phạm vi dự án, để lộ bảng cũng không liệt kê được. Mã căn S16 vẫn không lên cổng Invest và không
  vào bảng nào khác trên cloud. Bộ soát mã S16 của DA33 sửa theo ở hàng mở L4.

### 6. Hợp đồng API v1 (Thiết kế)

Sáu luật của hợp đồng:

1. **Mã bền.** Mã công khai là khoá mờ (`bld_`, `stk_`, `unt_`) và UPI. Vật thể bị gộp vẫn tra được và trỏ sang vật thể mới.
2. **Mỗi giá trị kèm căn cứ.** Từng trường trả giá trị, loại căn cứ (xác minh · suy ra · chưa biết) và mốc đo.
3. **Tên theo RESO** cho field và enum (luật 3); đường dẫn tiếng Anh.
4. **Chỉ thêm, không phá** trong `/v1`. Đổi phá vỡ đi qua ADR, ra `/v2`, giữ bản cũ ít nhất sáu tháng.
5. **Không tên nguồn.** Ra ngoài chỉ có loại căn cứ («danh mục chủ đầu tư», «tin rao», «người xác nhận»).
6. **Không tìm thấy thì nói không tìm thấy**, kèm lý do: dự án chưa phủ, hay mã không khớp.

Nhóm đường (chi tiết ở OpenAPI của hàng đầu tiên): `projects`, `buildings`, `units`, `units/resolve`, `units/{id}/market`,
`changes`, `feed`, `coverage`, cùng `markets`, `asset-stats`, `listings` đã có. Một bề mặt: không thêm route công khai thứ hai
cho cùng dữ liệu ở `app/src/app/api/v1`.

### 7. Luồng thị trường (J4)

- **Đơn vị là sự kiện theo căn, không phải bài đăng** (Thiết kế): `new_to_market`, `price_changed`, `relisted`, `withdrawn`.
- **«Hot» là các tín hiệu kèm lý do đọc được**, không phải một điểm số kín (Thiết kế): giá tốt so nhóm, vừa giảm giá, nhiều
  người cùng rao, cầu đang khớp (Bảng Yêu cầu, chỉ dạng tổng hợp), hàng hiếm. Căn rẻ bất thường mang nhãn «Cần xác minh».
- **Bề mặt đầu tiên** (câu 8 — Mạnh chốt): trang «Mới và hot» cho đội mình dùng trước, trên Ops rồi Invest. API luồng cho công
  ty môi giới vào chặng đối tác thử. Môi giới cá nhân dùng trang, không dùng API.
- **Bán độ tươi** (Thiết kế): luồng trễ 24 giờ mở rộng rãi, luồng theo phút là gói trả tiền.
- **Luật 8 không đổi**: hệ thống không gửi gì vào nhóm xã hội. Mọi đường thông báo qua S03 tới cá nhân cần lời riêng của Mạnh.

### 8. Mặt điều khiển và tài khoản khách API (câu 5 — Mạnh chốt)

- **Tài khoản khách API** (tổ chức, người liên hệ, khoá dạng băm, scope, thoả thuận, số đếm lượt gọi) **sống trên cloud, là
  dữ liệu của mặt điều khiển, không thuộc tầng A**. Đề xuất sửa luật 6 của `AGENTS.md` (Phụ lục). «Hồ sơ người dùng app» (`user_events`,
  `user_profile`) vẫn là tầng A, không đổi.
- Chặng trong nhà dùng lại mẫu token máy có scope đã có (ADR-0015 §2). Chặng đối tác thử dùng một dịch vụ quản khoá và hạn mức
  có sẵn; không tự viết phần đo lượt và thanh toán (Thiết kế).
- Lớp khách hàng, giá, hợp đồng **không nằm trong `data-api/`**, vì thư mục này được đẩy nguyên sang kho công khai.

### 9. Bốn chặng (Thiết kế; thước chốt ở Cổng Phạm vi)

| Chặng | Việc | Điều kiện vào | Xong khi |
|---|---|---|---|
| 0 Đóng khung | ADR này; OpenAPI v1 nháp; ba cuộc nói chuyện với đội CRM | — | Ba đội xác nhận sẽ gọi `resolve` |
| 1 Trong nhà | Bản chiếu danh bạ lên cloud (DN4, thêm căn); `projects`, `buildings`, `units`, `resolve`, `coverage`; bản chạy thật; trang «Mới và hot» | DN4 qua Cổng Phạm vi | Trên bảng hàng thật của sàn thử: `resolve` đúng từ 90% ở dự án đã phủ; bộ soát đỏ khi cấy tầng A, S02, `stg_*` |
| 2 Đối tác thử | Mặt điều khiển, tài liệu, khoá thử, `changes`, `feed`, webhook, `units/{id}/market`, điều khoản | Chặng 1 đạt; MS3, MS4 đạt; độ trễ đã đo (MSV); rà pháp lý xong cho lớp sẽ mở | Ba ứng dụng ngoài đội gọi thật mỗi tuần, bốn tuần liền |
| 3 Thương mại | Gói, thanh toán, cam kết độ sẵn sàng; tách sản phẩm nếu chạm §1 | Có khách đồng ý trả tiền | Khách trả tiền đầu tiên |

Chặng 1 không mở đường găng mới: phần nặng là DN4, đã nằm trong mốc MS5.

## Hệ quả nếu được nhận

Các dòng dưới chỉ áp khi Điều phối Mac mini đồng ý đưa đề xuất vào kế hoạch chung. Chữ đề xuất cho từng chỗ sửa ở Phụ lục.

- **ADR-0007 §3**: câu «API đọc công khai là ADR riêng» được ADR này trả lời. Bốn scope cũ giữ; thêm scope theo lớp L0–L4.
- **Luật 6 `AGENTS.md`**: thêm đoạn tài khoản khách API và đoạn dữ liệu ra ngoài theo lớp có trần.
- **ROADMAP §3 mục 48, mục 54 Q-C**: mặc định «mã căn S16 chỉ nội bộ, không lên cloud» đổi thành «tra theo mã qua API, không
  liệt kê». Mọi phần khác của hai mục giữ nguyên, kể cả phiên đăng nhập và tài khoản thu là tầng A.
- **FRAMING §2.1**: câu «gom vào, không phát ra» giữ nghĩa «hệ thống không đăng hộ vào kênh nào»; thêm: dữ liệu đã gom được
  trao cho ứng dụng khác hiển thị qua API theo ADR này.
- **Hàng đề xuất, chưa cắt** (Điều phối Mac mini quyết có nhận, xếp vào đâu và cắt bằng `/acceptance-gate:cat-luot`):
  OpenAPI v1 nháp · chỉnh phạm vi DN4 cho bản chiếu ra đúng hợp đồng và thêm căn · các đường danh mục và `resolve` trên
  `data-api` kèm token máy theo lớp · bản chạy thật của `data-api` (mở chân trời AH2) · bảng sự kiện thị trường theo căn
  (sau MS4) · trang «Mới và hot» · mở L4 kèm sửa bộ soát mã S16 · `feed`, `changes`, webhook (chặng 2) · mặt điều khiển
  (chặng 2). Việc của người, ra khỏi kho: rà pháp lý; ba cuộc nói chuyện với đội CRM; điều khoản dùng API.
- **Làn thu không có việc mới**: bản chiếu đọc từ danh bạ và metrics đã có, không chạm `stg_*` hay DATA-CONTRACT.
- **`data-api/CLAUDE.md`**: luật «không đọc `sale_offers` thô, không SĐT» giữ tới khi hàng mở L2, L3 sửa nó cùng bộ kiểm.

## Không làm

- Thanh toán, cổng nhà phát triển, cam kết độ sẵn sàng trước khi có khách thứ nhất (luật 11).
- Cho khách hay cloud gọi vào máy thu.
- Mở L2, L3 cho bên thứ ba trước khi rà pháp lý; trả SĐT theo lô; đường liệt kê cho L4.
- Tin S06 từng tin trong bất kỳ bề mặt bán ra ngoài nào khi chưa có văn bản cho phép.
- Một điểm «hot» không giải thích được.
- Đưa lớp khách hàng, giá, hợp đồng vào `data-api/`.

## Còn mở

- **L1 tính từ tin S06.** Trung vị và hạng giá đang dùng tin S06 làm mặt bằng so sánh (mục 51). Hiện trên cổng mình là việc
  đã chốt; bán con số đó qua API cho bên thứ ba thì chưa rà. Rà cùng lượt pháp lý, trước chặng 2.
- **Rủi ro mất nguồn lõi.** Phát lại tin nhóm cho bên ngoài có thể khiến quản trị nhóm loại tài khoản thu. Nguồn dài hạn của
  luồng là hàng sàn tự đưa vào (loại kết nối «kênh đăng» của ADR-0017); cách và thời điểm chốt trước chặng 2.
- **Giả thuyết thị trường.** Nhu cầu của CRM và của môi giới là nhận định của Mạnh, chưa kiểm bằng phỏng vấn; kiểm ở chặng 0.
- **Rà Luật Bảo vệ dữ liệu cá nhân** cho L3 (cùng mục «Còn mở» của ADR-0017).
- **Kết nối Quỹ hàng**: giữ dạng đẩy theo lô của ADR-0017 §5, hay thành khách của API. Chốt khi Quỹ hàng có khuôn kết nối.
- **Gói và giá**: chốt sau số đo của chặng 2.

## Phụ lục — chữ đề xuất cho các chỗ sửa kèm theo (chưa áp)

Áp cùng lúc ADR này được nhận. Số mục ROADMAP do Điều phối Mac mini cấp.

**Luật 6 của `AGENTS.md`**, thêm hai đoạn trước luật 7:

> **Tài khoản khách API** (ADR này §8): tổ chức, người liên hệ, khoá dạng băm, scope, thoả thuận và số đếm lượt gọi của khách
> dùng OneHub Data API sống trên cloud, là dữ liệu của mặt điều khiển, **không thuộc tầng A**. Hồ sơ người dùng app
> (`user_events/user_profile`) vẫn tầng A. Lớp khách hàng, giá, hợp đồng không nằm trong `data-api/`.
>
> **Dữ liệu ra ngoài qua API theo lớp có trần** (ADR này §5): danh mục dự án, toà, căn mở cho mọi khoá; tin rao từng tin chỉ
> theo thoả thuận, sau rà pháp lý; SĐT người đăng từng tin một, có đếm, không theo lô; mã căn lấy bằng đăng nhập (S16) chỉ tra
> theo mã, không liệt kê; luồng bán ra ngoài không mang tin S06 từng tin. Không bao giờ ra ngoài: tầng A, S02, số S02, bảng
> `stg_*`, đường dẫn bài gốc, ảnh gốc, ngày sinh và giới tính, giấy tờ người mua.

**ROADMAP §3**: một mục mới tóm tám câu của ADR này; ở mục 48 (đoạn S16) thêm «mã căn lấy bằng đăng nhập được tra theo mã qua
API, không liệt kê; hai việc còn lại vẫn chưa có lời»; ở mục 54 Q-C thêm «lên cloud chỉ trong bản chiếu của API, phục vụ
đường tra theo mã; không liệt kê, không lên cổng Invest»; thêm ADR này vào chỉ mục §5.

**`docs/product/FRAMING.md` §2.1**, sau gạch đầu dòng «Gom vào, không phát ra», kèm một dòng nhật ký §9:

> «Không phát ra» nghĩa là hệ thống không đăng hộ vào kênh nào, và điều đó giữ nguyên. Dữ liệu đã gom được trao cho ứng dụng
> khác hiển thị qua OneHub Data API, theo lớp có trần; luồng «Mới và hot» đội mình dùng trước, rồi mới tới công ty môi giới.
