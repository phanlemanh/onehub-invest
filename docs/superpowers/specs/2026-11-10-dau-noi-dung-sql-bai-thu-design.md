# Dấu `noi-dung` cho các bản SQL chép định nghĩa bài thử (GN5)

Hồ sơ: `_acceptance/dau-noi-dung-sql-bai-thu/` · hàng GN5 của `docs/plan/lo-trinh.json` · T2.
Mạnh chọn «Build» ở Cổng Đáng (10/11), sau GN2 Ngoài-4, 5, 7, 8 «mở hợp đồng mới» (07/11).

## Vấn đề

GN2 (`lay-mau-khu-trung-theo-tin`) thêm dấu thứ tư `noi-dung` vào `testMarker` (`pipeline/lib/test-posts.mjs`). Bài thử của Mạnh
mang link `trycloudflare.com` hoặc chữ «[Tên sàn]» nay bị transform gạt. Bốn bản SQL chép lại định nghĩa bài thử vẫn chỉ có ba
dấu cũ, nên số đếm lệch tập bài transform đọc:

| Bản chép | Dùng ở đâu | Lệch gì |
|---|---|---|
| `S03_POSTS_SQL` trong `pipeline/lib/ops-flow.mjs` | khối `luong7` của bản tin Ops (cloud) | «Bài nhận» Luồng 7 ngày đếm cả bài thử noi-dung |
| bản chép nguyên văn trong `app/src/lib/collections-queries.ts` | `getFlowDays` ở trang máy thu | như trên, phía máy thu |
| đoạn `IS_TEST` trong `pipeline/sql/600_data_flow.sql` | `data_flow_snapshot` → trang Dòng chảy dữ liệu (máy thu + cloud) | bài thử vào «Bài nhận» thay vì «bài thử bị loại» |
| câu đếm độc lập `offers_from_test_sql` trong `pipeline/scripts/test-data-residue.mjs` | thước dư lượng tin giả | `--simulate` báo lệch giả (`before_matches_sql` sai) khi có tin sinh từ bài noi-dung |

Đo 10/11 trên DB máy thu: 2 bài mang dấu, 0 bài trong 7 ngày, 0 tin sống từ chúng. Lệch hôm nay nhỏ. Nó sẽ hiện ngay khi Mạnh
đăng bài thử kế tiếp.

## Phương án

**Chọn: một hằng SQL cạnh regex JS, cộng ma trận khớp canh mọi bản chép.**

- `test-posts.mjs` xuất `NOI_DUNG_SQL`: biểu thức SQL đúng nghĩa với `NOI_DUNG_TEST`, viết tay ngay dưới regex JS. Biểu thức là
  `normalize(coalesce(<cột text>, ''), NFC) ~* 'trycloudflare\.com|\[tên sàn\]'`. Đây là nơi duy nhất trong pipeline viết chuỗi ấy.
- `ops-flow.mjs` và `test-data-residue.mjs` ghép hằng vào câu của mình bằng nội suy, không chép chữ.
- `600_data_flow.sql` là tệp SQL thuần, `collections-queries.ts` của app không được import pipeline (`app/CLAUDE.md`). Hai nơi này
  chép chữ. Đoạn `IS_TEST` của 600 thêm vế `OR` ấy. CTE `p` và `t` đọc thêm cột `text`. Bản app chép lại `S03_POSTS_SQL` mới
  nguyên văn.
- Thước khớp: một bài kiểm lấy ma trận viết trước, chạy `testMarker` (JS) và từng bản SQL trên CÙNG các dòng (bảng tạm che
  `stg_zalo_posts` trong giao dịch ROLLBACK), đòi khớp từng dòng. Bỏ vế noi-dung khỏi một bản thì đỏ, gọi tên bản và dòng.

Đã loại:
- **Chỉ thêm vế vào bốn chữ chép, không hằng chung.** Lỗi đang sửa chính là quên một bản chép. Bốn chữ độc lập lặp lại đúng lớp
  ấy ở dấu thứ năm.
- **Hàm SQL `is_test_post()` qua migration.** Một định nghĩa thật trong DB, nhưng thêm DDL (cần lời Mạnh, áp lên DB máy thu là bước
  triển khai riêng) cho bốn câu đọc. Ma trận khớp đạt cùng mục đích mà không đụng schema.
- **Sinh SQL từ regex JS.** Cú pháp khác nhau: dấu nhóm `GROUP_TEST` dùng `(?!\p{L})` và cờ `u`, POSIX của Postgres không có
  (bản SQL viết tay `($|[^[:alpha:]])`). Dịch tự động dễ sai lặng hơn viết tay rồi đo. Regex của dấu noi-dung
  (`/trycloudflare\.com|\[tên sàn\]/iu`) không có lookahead, nên vế SQL của nó dịch một-một.

## Chi tiết đã kiểm

- Hoa/thường tiếng Việt: DB chạy PG 17.7, `datctype = C.UTF-8`. `'[TÊN SÀN]' ~* '\[tên sàn\]'` trả `true` (đo 10/11), nên `~*`
  gập được chữ có dấu như cờ `iu` của JS.
- NFC: JS gọi `.normalize("NFC")` trước khi so. SQL dùng `normalize(..., NFC)`, cần DB mã UTF8 (đúng ở máy thu).
- NULL: vế noi-dung bọc `coalesce(text, '')` để `NOT (...)` không thành NULL khi bài không có chữ. Bài không chữ không mang dấu,
  đúng như JS (`row.text ?? ""`).
- Bài kiểm cũ có đột biến dò chữ trong `S03_POSTS_SQL` (GT-AC-5 ở `pipeline/scripts/gop-trung-s03.itest.mjs`, DF0 ở
  `app/tests/luong-7-ngay-dung-so.test.tsx`). Vế mới thêm ở cuối, sau điều kiện nhóm, nên chuỗi đột biến cũ vẫn khớp. S3 chạy lại
  hai bộ này để chứng.

## Không làm

- Không đổi `testMarker` hay regex JS. Tập bài transform đọc giữ nguyên.
- Không dọn bài hay tin thử khỏi DB.
- Không đổi `zaloFlow` (khoá cũ `zaloFlow` của bản tin, lọc `LIKE '%zalo-agent%'`, giữ cho bản app cũ).
- Không đổi importer (làn ZCode).

## Đường đo (ngưỡng của ô)

| Ngưỡng ô (`bat_khi`) | Số từ đâu | AC |
|---|---|---|
| `test-data-residue --simulate` xanh ngay sau gộp | lệnh `--simulate` trên DB máy thu (giao dịch ROLLBACK) | AC-4 |
| «Bài nhận» Luồng 7 ngày không đếm bài thử của Mạnh | khối `luong7` + `getFlowDays`, fixture có bài noi-dung | AC-2 |
| trang Dòng chảy dữ liệu không đếm bài thử | `data_flow_snapshot.received` / `test_rejected` qua 600 | AC-3 |
