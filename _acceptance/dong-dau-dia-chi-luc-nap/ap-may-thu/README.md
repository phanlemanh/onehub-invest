# Đưa TG2 lên máy thu — dong-dau-dia-chi-luc-nap

**TG2 không có migration.** Không có lệnh SQL nào để «áp»: hàng đổi mã của lượt nạp S03 (`pipeline/transform-zalo.mjs`),
và launchd chạy mã từ checkout chính. Nên **gộp vào main là áp**: lượt `zalo-import-daily` kế tiếp
(`scripts/zalo-import-daily.sh:241`) bắt đầu đóng dấu. Những gì lượt ấy GHI lên DB máy thu là phần hồ sơ này phủ.

Năm tệp: `README.md` (tệp này), `sao-luu.sh`, `so-chay-thu.md`, `lui.sql`, `kiem-sau.sql`.

## Lượt nạp sau khi gộp ghi gì

| Ghi | Khi nào | Bao nhiêu (đo trên bản chép, `so-chay-thu.md`) |
|---|---|---|
| Phát biểu `project_node_id` · `area_id` · `subzone_node_id`, luật `dia-chi-the-nhom` | mỗi lượt, cho bài của nhóm có thẻ **đã duyệt** | **0 khi chưa thẻ nào được duyệt** (máy thu 17/11: 26 thẻ, cả 26 còn nháp) |
| Rút dòng DV6 (`du-an-nhom-mot-du-an`, `du-an-ten-bai`), lý do `thay-bang-the-nhom` | trên đúng bài vừa được ghi dự án | 0 khi chưa thẻ nào được duyệt |
| Cột `kind` theo ô bán/thuê của thẻ | bài không có chữ bán/thuê, thuộc nhóm có thẻ đã duyệt | 0 khi chưa thẻ nào được duyệt |

Không đổi bảng, view hay hàm nào; không đụng `collector/snapshots/`; không lên cloud.

## Hai đường ghi dự án cùng sống — cần GS chốt trước khi gộp

Hôm nay dự án của tin S03 đến từ lệnh DV6 `pipeline/scripts/du-an-tren-tin-s03.mjs --ghi`, GS chạy tay sau mỗi lượt nạp
theo lời thường trực của Mạnh (16/11), lời ghi rằng **hết hiệu lực khi TG2 gộp**.

Nếu gộp TG2 khi **chưa thẻ nào được duyệt** và thôi DV6 đúng lúc ấy: TG2 đóng dấu 0 bài, DV6 không còn chạy, nên **tin mới
không có ai ghi dự án**. Đo 17/11: **1.445 tin S03 mới trong 7 ngày** (~200 tin/ngày, 21% kho 6.886 tin). Ô «Định vị» tụt
từng ngày, cửa sổ 7d tụt trước.

Ba lối, GS chốt:

| Lối | Làm gì | Rủi ro |
|---|---|---|
| **A — gộp sau buổi duyệt** (khuyến nghị) | Giữ DV6 như hôm nay; gộp TG2 khi buổi duyệt đã ký thẻ; thôi DV6 ngay sau lượt nạp đầu của TG2 | Hàng chờ người duyệt thẻ |
| **B — gộp ngay, giữ DV6 tới buổi duyệt** | Gộp TG2; GS vẫn chạy DV6 `--ghi` sau mỗi lượt nạp tới khi buổi duyệt xong, rồi thôi | Cần Mạnh nới lời thường trực. DV6 ghi lại dòng của nó lên bài TG2 vừa đóng dấu (lượt TG2 sau lại rút) — vô hại khi dự án trên thẻ **bằng** dự án trong sổ; **thẻ nào người sửa khác sổ thì tin của nhóm ấy thành xung đột** cho tới khi thôi DV6. `kiem-sau.sql` in số thẻ ấy |
| C — gộp ngay, thôi DV6 ngay | Đúng chữ lời thường trực | Ô «Định vị» tụt ~200 tin/ngày tới khi buổi duyệt xong |

Dòng DV6 đã có không bị xoá ở lối nào: nhóm chưa có thẻ duyệt giữ nguyên dòng DV6 lần chạy cuối.

## Năm thứ

1. **Sao lưu trước** — `bash _acceptance/dong-dau-dia-chi-luc-nap/ap-may-thu/sao-luu.sh`. Chép mọi dòng `field_assertions` của
   ba luật (`dia-chi-the-nhom` và hai luật DV6, cả dòng sống lẫn đã rút) ra `~/onehub-backups/db/truoc-tg2-<UTC>.csv`,
   ngoài cây kho. Chạy trước lượt nạp đầu tiên sau khi gộp, và trước MỖI lượt nạp đầu tiên sau một buổi duyệt thẻ.
2. **Áp** — gộp PR vào main, `git -C ~/dev/onehub-invest pull --ff-only origin main`. Lượt `zalo-import-daily` kế tiếp tự chạy.
   Muốn thấy ngay, chạy tay từ checkout chính:
   ```bash
   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/transform-zalo.mjs
   ```
   Dòng log `thẻ nhóm: N thẻ đã duyệt, … phát biểu, rút …` cho biết lượt ấy đã làm gì.
3. **Số chạy thử** — `so-chay-thu.md`: hai lượt nạp trên bản chép `oneinvest_p4_tg2` theo kịch bản duyệt khai trước
   (`../evidence/kich-ban-duyet.md`). Lượt **nền** là số máy thu ngay sau khi gộp; lượt **sau kịch bản K1** là số khi buổi
   duyệt nhận nguyên 26 nháp.
4. **Lùi** — hai bước, theo thứ tự: (a) thôi đóng dấu — `git revert` commit gộp của TG2 trên main rồi kéo lại checkout
   chính (không thì lượt nạp kế đóng dấu lại); (b) trả dữ liệu:
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 < _acceptance/dong-dau-dia-chi-luc-nap/ap-may-thu/lui.sql
   ```
   rồi NGAY sau đó, từ checkout chính:
   ```bash
   cd pipeline && node scripts/du-an-tren-tin-s03.mjs --ghi
   ```
   Bước SQL rút mọi dòng sống của `dia-chi-the-nhom` (lý do `lui-tg2`). Bước DV6 để chính DV6 tính lại ý định của nó trên dữ
   liệu hiện tại và ghi đúng dòng nó muốn. Khuôn S4-r3: lùi **không hồi sinh** dòng DV6 đã rút — bản rút có thể mang giá trị DV6
   đã bỏ, và hồi sinh mọi bản rút làm bài mang hai dự án sống (lỗi bắt ở S4 vòng 2). Giữa hai bước, bài từng được thẻ đóng dấu
   tạm không có dự án, nên chạy liền nhau. Thử trên bản chép: xem `so-chay-thu.md`. Cột `kind` tự về cách cũ ở lượt nạp kế (mã đã
   lùi). offer_project là view nên ô «Định vị» về số cũ ngay khi bước DV6 xong.
5. **Kiểm sau** —
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X < _acceptance/dong-dau-dia-chi-luc-nap/ap-may-thu/kiem-sau.sql
   ```
   In: số thẻ đã duyệt; số dòng sống của luật theo trường và nguồn ô; số dòng DV6 đã rút vì thẻ; số thẻ đã duyệt có dự án
   khác sổ (khác 0 mà DV6 còn chạy là xung đột — xem lối B); ô «Định vị» S03 cửa sổ all; số tin xung đột. Đạt khi số dòng
   khớp `so-chay-thu.md` cho đúng số thẻ đã duyệt, và số tin xung đột không tăng.

## Giới hạn đã biết của khuôn trả DV6 (S4-r3, soát context sạch)

- **Bài nạp sau khi thôi DV6.** Trả DV6 chỉ áp cho bài TỪNG bị hàng này rút dòng DV6. Sau khi thôi chạy DV6 `--ghi` (lối A),
  bài mới vào nhóm có thẻ chưa từng có dòng DV6 — thẻ ấy về sau bị bác thì bài không có dự án dù DV6 (nếu chạy) sẽ ghi. Chữa
  khi gặp: chạy DV6 `--ghi` một lần sau khi bác thẻ.
- **Khe giữa hai bước lùi.** Giữa `lui.sql` và DV6 `--ghi`, ô «Định vị» về gần 0 — đừng để lượt đồng bộ cloud chạy vào khe ấy
  (chạy hai bước liền, ngoài giờ đồng bộ). DV6 `--ghi` còn rút mọi dòng DV6 nó không còn muốn trên toàn S03, nên số sau lùi là
  số «DV6 tính lại hôm nay» (82,46% trên bản chép), không đúng bằng gốc (80,75%).
- Bảng phủ 48 ô chưa có hai chuyển trạng thái «ô dự án bị lọc» và «thẻ nghỉ» (cùng đường `docTheDaDuyet` ra `duAn = null` như
  T1/T3), và chưa có ca «hoà giải tin bỏ ở lượt sau» kèm dòng DV6 mồi.
