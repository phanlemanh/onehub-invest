# Rà lớp lỗi «đọc stg_zalo_posts không gạt bài thử» — vùng của hàng TG1

Giám sát yêu cầu ở vòng 6 (tin XONG U1-1611-2, 16/11): liệt MỌI chỗ trong vùng của hàng đọc `stg_zalo_posts`
hay đếm bài/nhóm, ghi rõ chỗ nào gạt bài thử qua `testMarker`/`loadStgPosts` (`pipeline/lib/test-posts.mjs`),
và vá chỗ còn hở. Vùng: `pipeline/lib`, `pipeline/scripts`, `app/src/lib`, `app/src/app/api/v1/ops/source-groups`,
`app/src/app/ops/sources`, `app/src/components/ops/sources`, `db/migrations`.

## Số nền (DB máy thu, chỉ đọc, 2026-11-16)

- `stg_zalo_posts`: **1.265** bài mang dấu thử trên tổng kho; trong đó **3** bài có `conversation_id`
  (1 dấu `group`, 2 dấu `noi-dung`) — chỉ 3 bài này chạm đường dựng thẻ.
- Dư lượng của 1.265 bài thử: 1 bài có nhãn bạc, 1 bài nằm trong một tin S03, 3 chủ thể có phát biểu dự án.
- Nhóm có bài: **28** khi không gạt → **26** khi gạt, ở cả hai đường đếm (JS và SQL).

## Trên đường dựng thẻ — phải gạt

| Chỗ | Đếm gì | Gạt bài thử? | Việc |
|---|---|---|---|
| `pipeline/scripts/the-dia-chi-nhom.mjs` · `docDuLieu` | bài → nhóm của thẻ | trước: KHÔNG | **đã vá** — đọc qua `loadStgPosts("zalo")`, in số bài thử đã bỏ |
| `pipeline/scripts/the-dia-chi-nhom-that.mjs` · `SQL_LOP` | nhóm, năm lớp (đếm độc lập) | trước: KHÔNG | **đã vá** — `NOT (TEST_POST_SQL_T)`, viết bằng SQL nên vẫn độc lập với đường JS |
| `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql` | nhóm có bài, so với số thẻ | trước: KHÔNG | **đã vá** — cùng định nghĩa bốn dấu (bản chép SQL, xem Known limit dưới) |
| `pipeline/lib/the-dia-chi-nhom.mjs` · `dungNhap` | — | không áp dụng | hàm thuần, không đọc DB |
| `app/src/lib/the-dia-chi-nhom.ts` · `docTheDiaChi`, `quyetThe` | — | không áp dụng | chỉ đọc hai bảng thẻ |
| `app/src/app/api/v1/ops/group-cards/route.ts` | — | không áp dụng | không chạm `stg_zalo_posts` |
| `db/migrations/108_the_dia_chi_nhom.sql` | — | không áp dụng | lược đồ, không câu đọc |

## Trong vùng, đếm bài hay nhóm, NGOÀI đường dựng thẻ — ghi sổ, không vá ở vòng này

| Chỗ | Đếm gì | Gạt bài thử? | Vì sao không vá |
|---|---|---|---|
| `pipeline/lib/du-an-tren-tin-s03.mjs:174` (hồ sơ DV7, đã gộp) | bài → nhóm, để ghi dự án lên bài S03 | **KHÔNG** | Vật của hồ sơ khác đã qua cổng; thước của nó (`pipeline/scripts/du-an-tren-tin-s03.test.mjs`) có câu SQL đếm độc lập CŨNG không gạt, nên sửa một bên là làm đỏ bên kia. Đo được: 3 phát biểu dự án trên bài thử. Đề xuất **hàng riêng** (vá cả lib lẫn thước trong một vòng). |
| `app/src/app/api/v1/ops/source-groups/route.ts:108` và `app/src/lib/che-do-thu.ts:28` | `fb_posts` của nhóm S05/S06 | KHÔNG | Đếm theo `agent_id = 'apify-facebook'` — kênh Facebook, không phải S03, không nằm trên đường thẻ. |
| `app/src/lib/ops-queries.ts:119` | tổng bài S03 cho bảng sức khoẻ nguồn | KHÔNG | Số sức khoẻ kho thô; đổi nó là đổi số của bề mặt khác không có thước trong hồ sơ này. |
| `app/src/lib/collections-queries.ts:497` | gom theo `group_name`, cờ `mock_only` | nhận biết snapshot mock theo cách riêng | Không đếm nhóm của thẻ; cách nhận biết riêng nên để nguyên, ghi sổ. |
| `pipeline/lib/do-lam-giau-db.mjs:177` | bài cho phép đo làm giàu | lọc kênh, KHÔNG gạt dấu thử | Thước của hồ sơ khác. |
| `pipeline/lib/vlm-anh.mjs:164` | ảnh của bài đã chọn | thừa hưởng bên gọi | Không tự chọn tập bài. |
| `pipeline/lib/danh-ba-nguoi.mjs:319` | bài theo `post_id` của tin | thừa hưởng | Tin đã qua transform có gạt bài thử. |

## Đã gạt đủ từ trước (đối chứng dương của lớp)

`pipeline/lib/ops-flow.mjs:87` (`S03_POSTS_SQL`) và bản chép ở `app/src/lib/collections-queries.ts:116` viết đủ
bốn dấu; `pipeline/lib/test-posts.mjs` là định nghĩa gốc; `transform-zalo`, `label-sample`, `mau-soat-cuon-chieu`
đều đi qua `loadStgPosts`/`testMarker`.

## Known limit sinh ra từ lượt rà

`kiem-sau.sql` nay mang **bản chép SQL thứ năm** của bốn dấu. `pipeline/scripts/dau-bai-thu-sql.test.mjs`
(DND-AC-1) chỉ giữ bốn bản khớp `testMarker`; tệp trong `_acceptance/` chưa nằm trong danh sách ấy, nên bản
chép này có thể trôi khi định nghĩa đổi. Đề xuất: kê tệp vào DND-AC-1 ở hàng của kit dấu bài thử.
