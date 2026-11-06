---
schema_version: 1
feature: Enrich danh bạ Người S03 — số liên lạc theo tài khoản từ tin có số và bài của chính người gửi; tin không số lấy số qua người đăng, hiện qua «Xem số» kèm nhãn chưa xác minh (cơ chế S06); chừa chỗ liên lạc hồ sơ kênh S03
slug: enrich-nguoi-s03
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/ (079) — khớp t3_paths
surfaces: [cli, api, ui]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-06
design_doc: docs/superpowers/specs/2026-11-06-enrich-nguoi-s03-design.md
---

# Acceptance Contract: enrich-nguoi-s03

## Context

Mạnh 06/11: hơn một nửa tin S03 cho thuê không có số nên không liên lạc được người bán; Mạnh gọi đây là luồng Enrich của
danh bạ Người — làm giàu Người rồi lấy liên lạc qua Người, không vá thẳng vào tin. Đo chỉ đọc 06/11: 1.806/4.359 tin S03
sống không số (thuê 49,5%), cả 1.800 tin có người gửi đều có Người theo tài khoản. Luật khuyên gán được 742 tin (thuê
586, bán 156) cho 94 Người; phần còn lại cần liên lạc `chat_profile` của làn ZCode. Số thô của giám sát lúc 07:30 (bậc 1: 925 tin,
bậc 2: 1.356 tin) lớn hơn vì chưa bỏ số dùng chung với người gửi khác, số của người nhiều số, và bậc 2 dùng bộ dò chuỗi rộng
thay vì `extractPhones` của transform. Việc này **không dựa vào gộp người**: công tắc `danh-ba:gop-sdt` đang TẮT và giữ tắt;
lối «bí danh + bật gộp» là Hỏi-1.

Source input: lời giao của giám sát đợt `dot0-cam-mau` 06/11; design doc ở frontmatter.

## Acceptance criteria

- AC-1: Given ma trận người gửi viết trước (số trên tin của chính họ; số chỉ trong bài trả lời; số ở bài của hai người gửi; số đã suy `s03-qua-nguoi-dang`; người gửi chưa có Người; số sai dạng), When `dungLienLac` chạy, Then mỗi ô cho đúng phát biểu liên lạc (rule `so_tren_tin` hay `so_trong_bai`, lớp `observed`, phương pháp `parser`, bằng chứng chỉ mang mã bài/tin và số đếm) hoặc không phát biểu kèm số đếm đúng (`so_chung`, `khong_nguoi`); số chung không sinh liên lạc cho ai. (cross-layer)
- AC-2: Given migration 079 áp hai lần, When ghi và sửa `party_contacts`, Then bảng nhận `sdt` đúng E.164 và `chat_profile`, từ chối giá trị sai dạng, chặn DELETE, TRUNCATE và UPDATE ngoài rút có lý do; `dungLienLac` chạy lại trên cùng dữ liệu cho 0 mới 0 rút; số trở thành chung thì liên lạc bị rút lý do `so-chung`; bài bằng chứng vắng khỏi stg thì liên lạc giữ nguyên. (cross-layer)
- AC-3: Given ma trận Người viết trước (0 số; 1 số trên tin; 1 số trong bài; 1 trên tin + 1 trong bài; 2 trên tin; 0 trên tin + 2 trong bài; Người đã gộp vào người khác; liên lạc `chat_profile`), When `chonSoNguoi`, Then số chọn đúng luật A ở design §4 từng ô, liên lạc `chat_profile` và liên lạc đã rút không bao giờ được chọn.
- AC-4: Given tin S03 sống và nghỉ (có số riêng; không số mà người đăng chọn được số; không số mà không chọn được; đang mang số suy mà nay có số riêng; đang mang số suy mà người hết số) cùng tin S06, S05, When `ganSdtQuaNguoi` chạy rồi `runTransformZalo` thật chạy lại, Then từng ô đúng design §5 (số, băm, dấu `s03-qua-nguoi-dang` kèm `party_key`), tin S06/S05 không đổi byte nào, chạy lại đổi 0 dòng, và trong suốt lượt transform không tin nào đang mang số suy rơi về NULL khi giao dịch commit. (cross-layer)
- AC-5: Given migration 079 trên lược đồ riêng, When đọc `sale_offers`, Then `seller_phone_inferred` true cho S03 mang dấu `s03-qua-nguoi-dang`, cho S06 ghép và S06 mất dấu; false cho S03 số trực tiếp, S06 trực tiếp, mọi tin không số; mọi cột cũ giữ tên, thứ tự, giá trị; When DB chưa áp 079 (chưa có bảng `party_contacts`, view còn bản 070) và `runTransformZalo`, `buocDem` thật chạy, Then cả hai thoát 0, in `CHUA-AP-079`, tin S03 không đổi, `dungNguoi` vẫn commit; When view bị ghi đè về bản 070 hoặc hàm phân xử chưa giữ khoá, Then `ganSdtQuaNguoi` không ghi số suy mới, in `CHUA-AP-079` hoặc `CHUA-AP-068`, không ném; kiểm DQ `so-chua-xac-minh` của `450_dq_checks.sql` cho `pass` khi tin S03 mang nhãn có dấu `s03-qua-nguoi-dang`, `fail` khi tin nguồn khác S06 mang nhãn mà không có dấu ấy. (cross-layer)
- AC-6: Given tin đã nhận số suy, When `dungNguoi` và `dungLienLac` chạy lượt kế, Then 0 bí danh `sdt` mới, 0 Người theo SĐT mới, 0 liên lạc mới từ số suy; `capMotMot`, `sellersThieuNguoi`, thẻ nhiều–nhiều và năm số N1–N5 của `do-danh-ba-sdt` không đổi so với trước khi gán; đối chứng: bỏ chặn thì cùng fixture sinh bí danh và thước đỏ ghim tên ô. (cross-layer)
- AC-7: Given tin S03 mang số suy trên lược đồ tạm, When gọi `GET /api/v1/listings` và `/api/v1/listings/<id>/contact` thật, Then danh sách có `hasPhone: true`, `phoneInferred: true`, không chứa SĐT; `/contact` trả số kèm `inferred: true`; tin S03 số trực tiếp trả `inferred: false`; lời giải thích «Số chưa xác minh» trên thẻ, trang phương pháp và `CONTEXT.md` nói số có thể suy từ tin hoặc bài khác của cùng tài khoản. (cross-layer)
- AC-8: Given bản sao DB máy thu từ `db/db-thu.sh`, When chạy `do-lien-lac-nguoi.mjs`, Then lệnh tự áp 079, chạy dựng + gán trong ROLLBACK và in: tin S03 có số trước/sau theo bán và thuê, số gán theo rule, `so_chung`, `nhieu_so`, `khong_nguoi`; tin có số tăng đúng bằng số gán; số gán theo từng rule và theo bán/thuê lệch không quá ±15% so với số đo 06/11 quy đổi theo số tin sống của bản sao (lệch thì thoát 1, in rule lệch); md5 cột SĐT S03 của DB gốc trước bằng sau; đầu ra không có SĐT; bất biến sai thì thoát 1. (cross-layer)
- AC-9 (judgment): Given phiếu đọc mù 30 Người ngẫu nhiên có số được chọn (`--mau 30`, hạt cố định, lưu ở `research-local/`), When tác tử tươi đọc bài của từng người gửi, Then số `dung` ≥ 27/30 và số «rõ là số người khác» ≤ 1; kết quả ghi số đếm, không chép số hay chữ bài vào kho. (Hỏi-4)
- AC-10 (judgment): Given tài liệu sau vòng, When đọc, Then `pipeline/mappings.yaml` khai `contact_kind`, `contact_rule` và luật `s03-qua-nguoi-dang` đủ sáu điều kiện ADR-0011; `CONTEXT.md` có thuật ngữ «Liên lạc của Người»; ADR-0016 §8 có dòng sửa đổi nói liên lạc là phát biểu, khác bí danh định danh; ROADMAP §2/§4 ghi as-built và việc chờ (áp 079, liên lạc `chat_profile` của ZCode).

## Quyết định chờ Mạnh

- **Hỏi-1. Số của Người lưu ở đâu?** Máy khuyên: bảng phát biểu liên lạc riêng `party_contacts`, tách khỏi bí danh định danh — số chung của sàn liên lạc được nhiều người mà không gộp họ thành một, có lớp bằng chứng và rút có lý do, chừa sẵn `chat_profile`, không cần bật công tắc gộp. Lối khác: gắn số làm bí danh `sdt` của Người theo tài khoản và bật công tắc gộp HD13; khớp chữ «bí danh» hơn, nhưng bậc 1 (657 tin) phụ thuộc lệnh bật gộp trên dữ liệu thật, số trong bài trả lời phải thêm cột bằng chứng vào bảng bí danh, và số chung không biểu diễn được.
- **Hỏi-2. Số xuất hiện ở bài của từ hai người gửi trở lên?** Máy khuyên: loại hẳn (số chung, có thể là số người khác hay sàn) — 742 tin. Lối khác: nhận khi người chỉ có đúng số ấy — 935 tin (+193), nhưng số sàn hay số được nhắc hộ sẽ gắn cho người không phải chủ.
- **Hỏi-3. Người có nhiều số thì chọn số nào?** Máy khuyên: luật A — số duy nhất trên tin của chính người ấy, không có thì số duy nhất trong bài; còn lại không gán (742 tin). Lối khác: số riêng xuất hiện ở nhiều bài nhất (824 tin, +82), đổi lại người môi giới đăng hộ nhiều chủ dễ nhận nhầm số.
- **Hỏi-4. Ngưỡng đọc tay 30 Người?** Máy khuyên: ≥ 27/30 đúng và ≤ 1 «rõ là số người khác»; dưới ngưỡng thì không đề xuất áp 079, vòng sau siết luật. Lối khác: ≥ 24/30 (80%), nhanh lên cổng hơn nhưng cứ năm người gọi có một người gặp sai.
- **Hỏi-6. Số qua người đăng ghi vào cột `seller_phone` của tin hay chỉ đọc qua Người lúc bấm «Xem số»?** Máy khuyên: ghi vào tin như số ghép S06 — giá trị suy từ liên lạc của Người, dấu xuất xứ trỏ `party_key` và mã liên lạc, tự rút khi Người hết số; nguồn sự thật vẫn là Người, app, API, cloud không đổi. Lối khác: đọc qua Người lúc phục vụ — tin không đổi byte nào, nhưng phải đưa `parties` + `party_contacts` lên cloud (migration Supabase, đường lộ tầng C mới) và đổi API — tức một cơ chế thứ hai.
- **Hỏi-7. Bỏ bản mẫu thiết kế?** Máy khuyên: bỏ — thẻ S03 sẽ có hai nhãn cùng chữ «Chưa xác minh» (một cho tin, một cạnh số), mỗi nhãn đã có tên và lời giải thích riêng (`OfferLabelHelp`); E7u chụp nguyên thẻ có cả hai nhãn và hai lời giải thích ở Cổng Bằng chứng. Lối khác: dựng bản mẫu trên DB thử trước khi code — thêm một phiên, có thể đổi chữ một nhãn.
- **Hỏi-5. Số qua người đăng lên Invest kèm nhãn «Chưa xác minh» như số ghép S06?** Máy khuyên: có — dùng nguyên cột `seller_phone_inferred` và Badge đã ký, không cơ chế thứ hai; việc lên thật chỉ xảy ra khi Mạnh cho áp 079 và chạy gán trên máy thu. Việc này đưa số ra người dùng thật. Lối khác: chỉ hiện số suy ở `/ops` tới khi có liên lạc `chat_profile`; người xem Invest vẫn thấy «Chưa có số» ở 742 tin.

## Coverage

Quét bằng `morphological-scan` (preset entity-feature), chân sản phẩm từ `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/gan-sdt-s06.mjs`, `pipeline/transform-zalo.mjs`, `app/src/lib/offers-public.ts`; chân ngành: RESO `MemberMobilePhone`/`OtherPhones` (trang tri thức «Người và SĐT»).

- Trục nguồn bằng chứng của số: trên tin của chính người gửi | chỉ trong bài khác | đã suy | không có (AC-1, AC-6) [thước CE: hai rule + dấu suy của design §3]
- Trục độ riêng: số riêng | số chung ≥ 2 người gửi (AC-1, AC-2) [thước CE: X1 design §3]
- Trục số lượng số mỗi Người: 0 | 1 | 2+ theo từng rule (AC-3) [thước CE: phân bố đo 0/1/2/6 số]
- Trục trạng thái tin: sống | nghỉ; có số riêng | không | đang mang số suy (AC-4)
- Trục lớp: liên lạc | tin | view | sync/cloud | API | chữ giao diện (AC-2, AC-4, AC-5, AC-7) [thước CE: đường dữ liệu design §5–6; cloud không đổi]
- Trục thứ tự áp: 079 chưa áp | 068 chưa áp | view bị ghi đè | đủ (AC-5)
- Trục chạy lại và tự nuôi: lượt 2 | transform chạy lại | lượt danh bạ kế (AC-2, AC-4, AC-6)
- Trục nguồn tin: S03 | S05 | S06 (AC-4)
- Core: AC-1 đến AC-9. Later: liên lạc `chat_profile` (ZCode ghi); S05; `/ops/people` hiện liên lạc; thẻ duyệt người nhiều số. Never: suy số từ tên người gửi; gọi API của kênh chat trong vòng này.

## Đường đo

Không có `opportunity.md` (vòng từ lời giao của giám sát). Thước sản phẩm «tin S03 thuê liên lạc được» đo bằng AC-8 trên bản sao DB máy thu (số tin có số trước/sau theo bán, thuê) và độ đúng bằng AC-9.

## Out of scope

- Gọi API của kênh chat hay lấy link hồ sơ theo `sender_id`: làn ZCode qua phiên liên làn, rào an toàn kênh chat, lời Mạnh trước khi gọi thật. Vòng này chỉ chừa `kind = chat_profile`.
- Áp 079 lên DB máy thu, chạy gán thật, lượt sync lên cloud: lời riêng của Mạnh, có `pg_dump` trước.
- Bật công tắc gộp HD13, gộp liên nguồn, liên lạc cho S05/S06.
- Trang `/ops/people` hiện liên lạc, thẻ duyệt Người nhiều số, xác minh số bằng cách gọi.

## Notes

- Design-pass chưa chạy (Hỏi-7): Cổng Phạm vi duyệt giao diện bằng chữ; ảnh thật ở E7u.
- Đường nền và khoá chấm thuộc đợt `dot0-cam-mau`: hỏi giám sát trước khi xin; rào `chan-s4` chặn đường nền khi chưa cấp khoá.
- Chạm `pipeline/transform-zalo.mjs` (một lời gọi sau `writeOffers`) và `pipeline/lib/danh-ba-nguoi.mjs` (hai hằng chặn tự nuôi): đã báo giám sát 06/11 vì phiên GC sửa cùng vùng.
