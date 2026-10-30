# gop-tin-chi-anh-o-transform (PL28) — gộp ảnh của tin chỉ-ảnh vào tin chữ cùng người

Hồ sơ: `_acceptance/gop-tin-chi-anh-o-transform/` · hàng PL28 (`docs/plan/lo-trinh.json`) · hạng T2 · không migration.
Căn cứ: `docs/research/anh-tin-rao-va-scorecard-truong-2910.md` (A2), `docs/research/s03-boc-tach-cau-truc-3010.md` §9.2.

## Vấn đề

Trên nhóm S03, môi giới thường gửi ảnh thành từng tin riêng (mỗi ảnh một event), trước hoặc sau tin chữ mô tả căn. Tin
chỉ-ảnh không có chữ nào ngoài chính URL ảnh, nên `parsePost` không đọc được loại tin và tin bị bỏ. Ảnh của nó không bao
giờ tới offer. Bảng ảnh canonical của NH1 (`media`, `pipeline/transform-media.mjs`) chỉ lấy ảnh từ các bài nằm trong
`sale_offers.post_ids`, tức chỉ bài chữ.

Đo 30/10 trên DB local (chỉ đọc, bài S03 24–29/10):

| Số đo | Giá trị |
|---|---|
| Bài S03 | 23.197 |
| Bài chỉ-ảnh (bỏ URL thì chữ trống) | 7.247 (7.225 có cột ảnh; 0 thiếu người gửi) |
| Offer S03 sống / có ảnh trong bảng `media` | 885 / 276 (31,2%) |
| Gộp hai phía 2 phút, chỉ xét tin chữ thuộc offer | 1.890 ảnh vào 185 offer, 169 offer mới có ảnh → 445/885 = 50,3% |
| Gộp hai phía 2 phút vào tin chữ GẦN NHẤT (mọi tin chữ cùng người) | 1.672 ảnh vào 156 offer, 146 offer mới có ảnh → 422/885 = 47,7% |

Hai quy tắc lệch nhau ~218 ảnh: ảnh gần một tin chữ KHÔNG thành offer (tin không giá, tin hỏi) hơn là gần tin offer
của cùng người. Quy tắc «chỉ xét tin offer» gắn những ảnh đó sang tin offer bên cạnh — ảnh của căn này hiện trên thẻ
của căn khác.

## Cách làm

**Gộp ở bước dựng bảng ảnh (`transform-media.mjs`), không ở `sale_offers.post_ids`** (khuyến nghị — Hỏi-2).

1. Hàm thuần mới `pipeline/lib/gop-anh.mjs`:
   - `laChiAnh(text)`: bỏ mọi URL (`https?://…`, `www.…`) thì chữ còn lại trống.
   - `ganBaiAnh(baiChu, baiAnh, { cuaSoGiay = 120 })` → `Map<post_id ảnh, post_id chữ>`: mỗi bài chỉ-ảnh gắn vào bài chữ
     cùng `conversation_id`, cùng `sender_id`, `|posted_at chênh| < 120 giây`, GẦN NHẤT về thời gian (Hỏi-1). Hoà thời
     gian → bài chữ đứng SAU ảnh (nếp gửi album rồi mới gửi chú thích), rồi `post_id` nhỏ hơn. Thiếu `sender_id` hay
     `conversation_id` → không gắn.
2. `transform-media.mjs`, nguồn S03: đọc bài S03 thật bằng `loadStgPosts(…, "zalo")` (đã gạt bài thử), tách bài chữ / bài
   chỉ-ảnh, gọi `ganBaiAnh`. Bài chữ được gắn mà nằm trong `post_ids` của một offer → bài ảnh nối vào danh sách bài của
   offer đó, SAU các bài của chính offer, theo `posted_at`. Danh sách đi qua `mediaRowsFromPosts` như cũ (luật ghép ảnh
   đã ký, không đổi). Bài chữ được gắn không thuộc offer nào → ảnh không vào đâu.
3. S05 (Facebook) giữ nguyên — PL28 chỉ giao S03.

Dòng ảnh truy về bài nguồn qua `originating_system_resource_record_key` (= `post_id`, như NH1). Mỗi lượt dựng lại TRỌN
nguồn S03 và xoá dòng không còn sinh ra, nên khi một bài chữ mới gần ảnh hơn tới sau, lượt kế gán lại và gỡ dòng ở offer
cũ (AC-3).

Hệ quả: `sale_offers` (`post_ids`, `n_reposts`, khoá dính) không đổi một byte; bảng nạp `stg_zalo_posts` chỉ đọc. Thẻ duyệt
`/ops/review` và trang dòng chảy đọc bảng `media` nên tự hiện ảnh mới. Nạp lại hai lần không nhân dòng (khoá ảnh
`md5(offer_id | file hay URL)` như NH1).

Lối khác (Hỏi-2, người chọn):
- (a) Gắn bài ảnh vào `sale_offers.post_ids` trong `transform-zalo.mjs`: được thêm việc trang dòng chảy đếm bài chỉ-ảnh là
  «đọc được» (con số L06 giảm). Giá: năm chỗ đọc «một bài đại diện» của tin theo `post_ids` (enrich của agent, deals của
  app, deals của data-api công khai, công cụ agent, trang dòng chảy) chọn bài mới nhất hoặc sớm nhất — trúng bài chỉ-ảnh
  thì đọc ra chữ là URL; phải sửa cả năm chỗ bỏ qua bài chỉ-ảnh (chạm `agent/`, `app/`, `data-api/` công khai), và
  `n_reposts`, chủ thể phát biểu (`offer_subject_keys`) cũng đổi theo.

Lối đã loại:
- (b) Cột mới cho bài ảnh trên `sale_offers`: cần migration — ngoài vùng hàng, và không cần khi bảng `media` đã là nơi
  ảnh của tin sống.

## Đo

- Ca thử thuần `pipeline/scripts/gop-anh.test.mjs` (trong `npm test`): ma trận `laChiAnh`, ma trận `ganBaiAnh` (hai phía,
  biên 120 giây, khác người, khác nhóm, gần nhất, gần nhất là tin không offer, hoà), mỗi ma trận có ca đỏ đột biến.
- Ca DB thử `pipeline/scripts/gop-anh.itest.mjs`: dựng bài + offer tổng hợp trong giao dịch ROLLBACK, chạy
  `runTransformMedia(c, ["S03"])` hai lần — ảnh của bài chỉ-ảnh vào đúng offer, sau ảnh của chính offer; lượt hai không
  thêm dòng; ảnh gắn vào tin chữ không offer không sinh dòng; `stg_zalo_posts` và `sale_offers` không đổi.
- Thước dữ liệu thật `pipeline/scripts/do-gop-anh.mjs` trên DB thử, một giao dịch ROLLBACK: transform-media S03 bằng bản
  nền ghim (lấy «trước») rồi bằng cây (lấy «sau»); tỉ lệ sau ≥ ngưỡng đọc từ ô cơ hội; ngày mẫu 28/10 (giờ VN), tập cặp
  ảnh→offer theo SQL độc lập (gần nhất, hai phía, < 120 giây, bỏ bài thử và bài không cột ảnh, hoà → bài chữ đứng sau)
  bằng tập cặp đọc từ `media` (bài mà mọi ảnh đã có ở offer theo URL/tệp tính là đã gộp), so hai chiều; lượt đối chứng
  trên bản sao bỏ điều kiện cùng người phải lệch.

## Không làm

- Trang dòng chảy vẫn đếm bài chỉ-ảnh là «không đọc được» (`post_ids` không đổi) — đổi thước dòng chảy là việc riêng.
- Đọc chữ trong ảnh (bảng giá trong ảnh) — mục chờ SH7.
- Sửa tải ảnh lỗi của collector (ZC-ảnh, làn ZCode) — offer nhận ảnh qua URL gốc khi file chưa tải được.
- S05 (Facebook) — câu giao chỉ S03.
