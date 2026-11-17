# Số chạy thử — TG2 dong-dau-dia-chi-luc-nap

Bản chép DB máy thu `oneinvest_p4_tg2`, dựng lại từ đầu bằng `bash db/db-thu.sh oneinvest_p4_tg2` lúc 2026-11-17 ~12:00Z
(máy thu đã áp 108 + 109 lúc 11:30Z, 26 thẻ, cả 26 nháp). Mã ở commit `69c35406`. Lệnh:
`node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc <thước>`. Kịch bản duyệt khai trước: `../evidence/kich-ban-duyet.md`.
Hai lượt nạp trên cùng bản chép mất 125,5 giây.

## Đo lại 2026-11-17 17:59Z — mã `3aca0cb2` (khuôn S4-r3), bản chép dựng lại SAU DA33

Bản chép `oneinvest_p4_tg2` dựng lại từ máy thu (sau DA33, main `98fe528b1`) bằng `--do-neu-cu`; lúc chụp máy thu có **6 thẻ đã
duyệt** (Mạnh duyệt 17/11), 20 thẻ nháp. Ba lượt: gốc (máy thu nguyên trạng) → nền (lượt nạp đầu với 6 thẻ) → K1 (nhận nguyên 26
thẻ). Ba lượt nạp 105,8 giây. Năm thước, mỗi thước thoát 0:

| Thước | Gốc | Nền (6 thẻ) | Sau K1 (26 thẻ) |
|---|---|---|---|
| Ô «Định vị» S03 cửa sổ all | 5.606 / 6.942 = 80,75% | 6.684 / 6.942 = **96,28%** | 6.795 / 6.942 = **97,88%** |
| … 30d · 7d | 80,78% · 75,10% | 96,31% · 92,67% | 97,91% · 99,00% |
| **Bài mang > 1 dự án sống** (mọi luật) | 0 | **0** | **0** |
| Tin xung đột | 0 | 0 | 0 |
| Bài rơi khỏi `mot_du_an` (gốc → sau, theo bài) | — | — | **0** / 62.387 |
| Đóng dấu tin thuộc nhóm có thẻ, có ô để ghi | — | — | 6.860 / 6.860 = 100% (1 tin hoà giải bỏ dự án) |
| Bài mất `kind` · lật bán↔thuê | — | — | 0 · 0 |
| Chữ bài nêu dự án nhận đúng dự án chữ | — | — | 108 / 108 (25 bài nêu dự án KHÁC thẻ) |

**Đo lại ở `0326b5c0`** (sau lượt soát context sạch: hoà giải bỏ dòng TG2 của bản thẻ hết hiệu lực), bản chép dựng lại, ba lượt
251,5 giây: mọi số trong bảng y nguyên; chữ bài 110 / 110 (2 bài mới vào tin giữa hai lần dựng). Itest đầy đủ 74/74.

Lệch với bản đo 05f4a90c (gốc 80,87% · nền 96,38% · K1 97,88%): mẫu số tăng 6.637 → 6.942 tin do dữ liệu máy thu mới và DA33;
tỉ lệ K1 giữ nguyên, gốc và nền lệch dưới 0,15 điểm.

**Bảng phủ AC-8 (itest, 48 ô)** — 4 chuyển trạng thái thẻ × 4 ý định DV6 × 3 dạng bài, bốn bất biến mỗi ô: mã `3aca0cb2`
**48/48 xanh**; cùng bảng chạy trên mã vòng 2 (`01ee5f66`, hồi sinh mọi bản rút) **9 ô đỏ**: T1/T3 × D3 (tin vẫn mang dự án
DV6 đã thôi muốn) và T1/T3 × D4 (bài mang 2 dự án sống). Ô T2/T4 không trả dòng nào nên không phân biệt hai khuôn — đúng kỳ vọng.

**Lùi, thử trên bản chép (sau K1, khuôn mới):** bước 1 `lui.sql` rút 140.389 dòng TG2 (giữa hai bước: Định vị 0/6.942 — vì thế
chạy liền); bước 2 `du-an-tren-tin-s03.mjs --ghi` 1,6 giây, ghi 50.540 dòng theo ý định DV6, rút 0. Sau lùi: 0 dòng TG2 sống,
**0 bài mang > 1 dự án**, 0 tin xung đột, Định vị **5.724 / 6.942 = 82,46%** — trên gốc 80,75% vì DV6 tính lại trên dữ liệu
mới nhất (gốc là trạng thái lần DV6 chạy cuối trên máy thu).

---

_Bản đo 12:00Z cùng ngày, mã `69c35406`, khuôn trả DV6 cũ — giữ làm sử, không dùng cho cổng:_

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
