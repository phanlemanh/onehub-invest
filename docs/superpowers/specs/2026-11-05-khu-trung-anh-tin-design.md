# Khử trùng ảnh trong một tin theo băm tệp

Hồ sơ: `_acceptance/khu-trung-anh-tin/`. Mạnh duyệt mở hàng ngày 05/11/2026 qua giám sát đợt.

## Vì sao

Tin S03 đăng lại nhiều lần, mỗi lần URL ảnh mới và tên tệp mới, nên `media-rows.mjs` coi là ảnh khác. Trần 12 ảnh ở bên đọc bị
ảnh trùng lấp, người duyệt và người gắn nhãn không thấy các ảnh khác còn lại của tin.

Đo trên DB máy thu 05/11:

| Số đo | Giá trị |
|---|---|
| Dòng `media` S03 có tệp | 12.942 |
| Ảnh khác nội dung, theo từng tin | 4.450 |
| Tin có tệp / tin có ảnh trùng | 1.741 / 935 |
| Tin vượt 12 dòng / tin thật sự vượt 12 ảnh khác nội dung | 262 / 38 |
| Entry có `file` mà thiếu `sha256` | 0 / 28.220 |
| Dòng S06, dòng S05 có tệp | 428.451 dòng không tệp, 0 |

## Thiết kế

**Khử ở bên ghi, không đổi bảng.** `mediaRowsFromPosts` có băm của từng entry nên bỏ luôn dòng trùng nội dung. Dòng giữ lại là lần
đầu theo thứ tự bài, nên `media_key` của nó không đổi. Bên đọc nhận dòng đã khử, trần 12 áp lên ảnh khác nội dung mà không phải sửa
`buildMediaImages`. `/ops/review`, `/ops/data-flow`, `/ops/deals` cùng đọc `media` nên cùng được áp.

Luật, theo thứ tự:

1. Khoá nội dung của entry có tệp là `sha256` (64 ký tự hex, viết thường); băm thiếu hay sai khuôn thì khoá là đường tệp, đúng như hôm nay.
2. Entry có tệp trùng khoá thì bỏ dòng, nhưng URL của nó vẫn tính là đã có, để lượt 2 không đưa lại ảnh ấy dưới dạng URL.
3. Ảnh chưa có tệp giữ khử theo URL. Không tải thêm ảnh, không đọc đĩa.
4. Không cắt ở 12: trần vẫn là việc của bên đọc.
5. PL28: `noiSau` bỏ thêm ảnh bài chỉ-ảnh trùng băm với ảnh đã có của tin. Dòng mang thêm trường `sha256` trong bộ nhớ, không ghi vào bảng (`COT` là danh sách đóng).

S06 đi `mediaRowsFromAd`, không qua luật này, nên hàm giữ nguyên.

**Màn gắn nhãn** không đọc `media`, mà gọi `danhSachAnh` trong `app/src/lib/labels-anh.ts` cho từng bài. Tệp này thêm cùng khoá: `NguonAnh` tệp mang
`sha256`, trùng băm thì bỏ. Hôm nay chưa bài nào có trùng trong bài (0/28.220), nên kết quả không đổi. Cụm ảnh nhiều bài nằm ở
`feat/ghep-anh-tren-the-gan-nhan` chưa gộp: `danhSachAnhCum` đổi một dòng khoá sang `sha256` khi gộp, đã báo giám sát. Băm chỉ ở máy
chủ, trang chỉ nhận đường `?nhan=&anh=`.

**`buildOfferImages`** (thước đối chiếu đã ký) khử cùng luật, để ca tương đương NH-AC-3 còn so được.

**`do-gop-anh.mjs`** (thước của PL28) coi bài chỉ-ảnh là «đã gộp» khi mọi URL có ở tin. Ảnh bị khử theo băm không còn URL ở bảng, nên thước phải tính thêm trùng băm.

## Lên dữ liệu

Không chạy gì lên DB thật trong vòng này. Sau gộp, lượt `transform-media S03 S05` đêm đầu xoá khoảng 8.500 dòng trùng (bảng dẫn xuất,
dựng lại được từ `stg_zalo_posts`; snapshot không đổi).

## Đo trước và sau

`pipeline/scripts/do-khu-trung-anh.mjs` chạy giao dịch chỉ đọc trên DB máy thu: «trước» là bảng `media` hiện tại, «sau» là dòng do
`dungDong` dựng từ cây, không ghi. In theo nguồn: số dòng, ảnh khác nội dung, tin còn trùng, số ảnh khác nội dung trong trần 12. Thoát 1 khi
có tin mất một băm, còn tin trùng, hay dòng S06 khác.

Giới hạn: bảng `media` «trước» có thể lệch `stg` theo thời gian (tin mới, tin nghỉ), nên phép so tập băm chỉ xét tin có ở cả hai phía và
băm còn trong `stg` của tin đó.

## Không làm

Ảnh gần giống (nén lại, cắt, đổi cỡ) khác băm thì vẫn là hai ảnh; làm cần băm cảm nhận và đo riêng. Không khử giữa hai tin khác nhau. Ảnh chỉ
có URL mà nội dung trùng ảnh đã tải không biết được nếu không tải. Không đổi trần 12.
