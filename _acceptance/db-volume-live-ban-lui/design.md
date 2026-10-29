# db-volume-live-ban-lui — thước `live` không đòi bản lùi tồn tại mãi

Hàng P2 của đợt `dot0-cam-mau`. Gốc: Ngoài-4 của hồ sơ `db-vao-volume`, Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng
chứng 29/10 (`_acceptance/db-vao-volume/decisions.jsonl` dòng `d-20261029T095727Z-27`). Giám sát xếp hàng (trả lời
P2-80): tách «dữ liệu trong volume» khỏi «còn bản lùi»; phải gộp TRƯỚC 05/11 — ngày sớm nhất được hỏi xoá bản lùi.

## Hiện trạng

`bash scripts/db-volume-check.sh live` (chỉ đọc) gồm hai phép:

1. `check_du_lieu` — `data_directory` của `one-invest-db` nằm dưới mount kiểu volume tên `onehub_pgdata`. Đây là **bất
   biến** hàng `db-vao-volume` dựng nên: đỏ ở đây nghĩa là DB lại nằm trong lớp ghi container (mất khi tạo lại).
2. `check_ban_lui` — bản lùi `one-invest-db-cu-*` tồn tại, `exited`, restart `no`. Đây là **điều kiện tạm** của thời
   gian giữ bản lùi. Không có bản lùi → `FAIL không có bản lùi` → cả lệnh thoát 1.

Sau khi Mạnh duyệt xoá bản lùi (sớm nhất 05/11), `live` và mọi lượt chấm lại E12 của `db-vao-volume` sẽ đỏ vĩnh viễn dù
dữ liệu vẫn đúng chỗ. Thêm: `live_doc` chỉ soi bản lùi có tên lớn nhất (`sort | tail -1`).

## Câu hỏi cho Mạnh (Hỏi-1): vắng bản lùi TRƯỚC hạn giữ thì sao?

| Lối | Vắng bản lùi trước 05/11 16:20 (giờ VN) | Vắng sau mốc ấy | Giá |
|---|---|---|---|
| **(b) — khuyến nghị** | ĐỎ `FAIL bản lùi mất trước hạn giữ …` | XANH | Một hằng ngày-giờ hạn giữ trong script (đọc từ nhật ký lượt chuyển); lượt chuyển sau phải sửa hằng |
| (a) | XANH | XANH | Đơn giản hơn; nhưng bản lùi bị xoá nhầm trong hạn giữ (vd compose cũ chạy `down` — rủi ro đo được ở tập dượt của `db-vao-volume`) thì không ai biết |

Bản nháp dưới đây theo (b). Chọn (a) thì bỏ trục thời gian khỏi ma trận (16 ô → 14 ô, cùng bỏ hai ô «vắng trước hạn»).

## Thiết kế (theo b)

- `check_du_lieu` giữ nguyên — luôn đòi, luôn có thể đỏ.
- Hằng `BAN_LUI_GIU_DEN="2026-11-05T09:20:00Z"` (nhật ký lượt chuyển: «sớm nhất hỏi xoá bản lùi: 2026-11-05 16:20 +07»).
  Giờ «bây giờ» đọc từ `date -u`, phép thử ép bằng biến `DB_VOLUME_GIO_GIA`.
- `check_ban_lui <mảng inspect> <giờ>`:
  - mảng rỗng, giờ ≥ hạn → `PASS không còn bản lùi one-invest-db-cu-* (sau hạn giữ <hạn>)`;
  - mảng rỗng, giờ < hạn → `FAIL bản lùi mất trước hạn giữ <hạn>`;
  - còn → MỖI phần tử phải `exited` + restart `no`; phần tử nào không → `FAIL bản lùi <tên> trạng thái <st>
    restart=<rp> (cần exited, no)` (gọi đúng tên, ở bất kỳ vị trí nào trong mảng). Mọi phần tử đúng →
    `PASS bản lùi <tên> exited restart=no` mỗi bản một dòng.
- `gom_ban_lui <regex>` — liệt container theo tên khớp regex (mặc định `^one-invest-db-cu-[0-9]{8}$`), `docker inspect`
  tất cả thành MỘT mảng; không container nào → in `[]`, exit 0 (không gọi `docker inspect` với danh sách rỗng).
- `live-selftest`:
  - **round-trip đường gom thật** (chỉ đọc): `gom_ban_lui '^one-invest-db-khong-co-[0-9]+$'` → `[]` exit 0, rồi mảng đó qua
    bộ chấm; `gom_ban_lui '^one-invest-db(-cu-[0-9]{8})?$'` → mảng đúng số container khớp trên máy (≥ 1).
  - **ma trận toàn phần** dựng từ `docker inspect one-invest-db` thật: trục dữ liệu {mount `onehub_pgdata` ở
    `/var/lib/postgresql` · mount `/var/lib/postgresql/data`} × trục bản lùi {vắng trước hạn · vắng sau hạn · một bản
    exited/no · một bản running/unless-stopped · một bản exited/unless-stopped · hai bản, bản tên NHỎ running · hai bản,
    bản tên LỚN running · hai bản đều exited/no} = **16 ô**. Kỳ vọng viết trước: hàng «mount đúng» xanh đúng ở «vắng sau
    hạn», «một bản exited/no», «hai bản đều exited/no»; đỏ ở năm ô còn lại với thông điệp ghim (ô hai bản gọi đúng tên
    bản đang chạy); hàng «mount sai» đỏ cả tám ô với `FAIL data_directory nằm trong lớp ghi container`. Bộ tự kiểm
    đếm ô đã chạy, khác 16 → FAIL.
- Phần «máy này» giữ như cũ: `PASS data_directory …` + theo trạng thái bản lùi lúc chạy (dòng PASS mỗi bản, hoặc
  `PASS không còn bản lùi` sau hạn) — expected của eval không ghim tên bản lùi.

## Ngoài phạm vi

- Sửa `docs/ops/db-volume.md` / `runtime-map.md` (ngoài ranh giới hàng).
- Xoá bản lùi — việc của Mạnh sau 05/11.
- Các Known limits khác của `db-vao-volume`.

## Đặc tả UX

Bỏ — không chạm giao diện.
