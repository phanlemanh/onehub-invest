# Số chạy thử — TG2 dong-dau-dia-chi-luc-nap

Bản chép DB máy thu `oneinvest_p4_tg2`, dựng lại từ đầu bằng `bash db/db-thu.sh oneinvest_p4_tg2` lúc 2026-11-17 ~12:00Z
(máy thu đã áp 108 + 109 lúc 11:30Z, 26 thẻ, cả 26 nháp). Mã ở commit `69c35406`. Lệnh:
`node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc <thước>`. Kịch bản duyệt khai trước: `../evidence/kich-ban-duyet.md`.
Hai lượt nạp trên cùng bản chép mất 125,5 giây.

## Hai lượt

| | Lượt **nền** — 0 thẻ đã duyệt (= máy thu ngay sau khi gộp) | **Sau kịch bản K1** — 26 thẻ nhận nguyên nháp |
|---|---|---|
| Ô «Định vị» S03, cửa sổ all | 5.606 / 6.888 = **81,39%** | 6.495 / 6.888 = **94,29%** |
| … cửa sổ 30d | 81,39% | 94,29% |
| … cửa sổ 7d (mặc định trên `/ops/data-flow`) | 79,32% | 94,76% |
| Tin xung đột | 0 | **0** |
| Bài rơi khỏi `mot_du_an` | — | **0** |
| Bài mất `kind` · bài lật bán↔thuê | — | **0 · 0** |
| Bài có `kind` (nằm trong tin) | 69.589 | 69.785 (+196 bài thành tin nhờ ô bán/thuê của thẻ) |

Lượt nền đóng dấu 0 bài: đúng quyết định «không đóng dấu thẻ nháp».

## Lượt sau kịch bản ghi gì (`kiem-sau.sql` trên bản chép)

| | Số dòng |
|---|---|
| Phát biểu `area_id` từ thẻ | 69.226 |
| Phát biểu `project_node_id` từ thẻ | 65.433 |
| Phát biểu `project_node_id` từ chữ bài | 103 |
| Phát biểu `subzone_node_id` từ thẻ | 2.666 |
| Dòng DV6 `du-an-nhom-mot-du-an` rút, lý do `thay-bang-the-nhom` | 49.135 |
| Dòng DV6 `du-an-ten-bai` rút, lý do `thay-bang-the-nhom` | 90 |
| Thẻ đã duyệt có dự án khác sổ nhóm | 0 |

Hoà giải mức tin (AC-8): 7 tin của nhóm có thẻ một dự án KHÔNG nhận dự án từ luật này — bài đăng lại chéo nhóm có thẻ bất
đồng, hay có bài chữ nêu dự án khác. 5 trong số đó vẫn `mot_du_an` nhờ dòng DV6 không bị rút.

## Lùi, thử trên bản chép

`lui.sql` trong một giao dịch rồi ROLLBACK: rút 137.428 dòng TG2, ghi lại 49.225 dòng DV6, ô «Định vị» về
**5.606 / 6.888** — đúng số lượt nền; 0 tin xung đột.

## Số thật sau khi áp

Phải khớp cột **lượt nền** ngay sau lượt nạp đầu tiên sau khi gộp (chừng nào chưa thẻ nào được duyệt), trong biên tin mới
vào giữa hai lần đo (~200 tin/ngày). Sau mỗi buổi duyệt thẻ, số phải đi về phía cột K1 theo tỉ lệ thẻ đã ký.
