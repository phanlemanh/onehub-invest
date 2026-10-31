# Đo trục SĐT của danh bạ Người mỗi đêm (SD5)

Hồ sơ: `_acceptance/do-danh-ba-sdt/` · hàng SD5 của `docs/plan/lo-trinh.json` (T2, dãy P4) · Cổng Đáng `build` (Mạnh
30/10, «Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất»). Căn cứ: `docs/research/audit-bang-nguoi-sdt-3010.md`
§0 (N1–N5), §2.2, §2.3, §3.3, §7 (câu đo tái lập); trang tri thức `chu-de/nguoi-va-sdt`.

## Vấn đề

Mọi số của audit 30/10 đo bằng tay. Bốn hàng sửa (SD1–SD4, HD13) sẽ đổi các số ấy; cần một phép đo đêm để có số trước và
sau, ngay trên `/ops/quality`. Số đã trôi từ 30/10 (31/10: SĐT trên tin 208, audit ghi 161; người theo SĐT S03 192, audit
145) — đúng vì đó là lý do cần đo đêm.

## Thiết kế

### 1. Năm số đo (một nguồn mỗi dòng, S03 và S05)

| Mã | Đo | Định nghĩa (đọc DB máy thu, chỉ đọc) | Đạt khi |
|---|---|---|---|
| N1 | SĐT nối 1–1 mà chưa gộp | Trên tin sống (`sale_offers`) của nguồn: SĐT (`seller_phone_hash`) có đúng một người gửi (`sender_id` của các bài trong `post_ids`) và người gửi ấy có đúng một SĐT; đếm cặp mà người theo SĐT (bí danh `sdt_bam`/`sdt` mang khoá ấy) chưa `merged` | 0 |
| N2 | Người theo SĐT không vai | Người có bí danh `sdt_bam`/`sdt` còn hiệu lực của nguồn mà không có dòng `party_roles` chưa rút | ≤ 10 (đích của SD4) |
| N3 | `sellers` so với SĐT trên tin | Số dòng `sellers` và số `seller_phone_hash` khác nhau trên `sale_offers` (mọi nguồn — một dòng, đối tượng `sellers`) | hai số bằng nhau |
| N4 | Tin nhiều SĐT | Tin sống mà hợp các SĐT `extractPhones` đọc trên mọi bài của tin có ≥ 2 số; kèm số tin `seller_phone` rỗng dù có bài mang số | tin rỗng = 0; số tin nhiều SĐT chỉ báo |
| N5 | Bài sót theo bộ dò rộng | Bài (`stg_zalo_posts` của nguồn) mà bộ dò rộng của audit §7 thấy số di động `extractPhones` không bắt; trừ bài chạm trần 3 số/bài | 0 |

`extractPhones` nạp thẳng từ `pipeline/transform-zalo.mjs` (cùng hàm transform dùng), nên khi SD2 sửa bộ bóc, N4/N5 đo
bộ bóc mới. Bộ dò rộng chép nguyên regex audit §7. Bí danh đọc cả `sdt_bam` (hôm nay) và `sdt` (sau SD3) — câu đọc không
đổi khi SD3 gộp.

Ngưỡng «đạt» là Hỏi-1 của Cổng Phạm vi (sổ quyết định); bảng ghi theo khuyến nghị.

### 2. Lệnh và ghi

`pipeline/do-danh-ba-sdt.mjs [--write]`: in bảng năm số theo nguồn; `--write` ghi `dq_check_results`:
`check_name = 'danh-ba-sdt:<n1…n5>'`, `entity` = mã nguồn (`S03`, `S05`; N3 là `sellers`), `status` = `pass` khi đạt, `fail`
khi không, `detail` = một dòng `khoá=giá trị` (vd `so=129 tong=141`). Ghi theo ngày: một giao dịch xoá dòng cùng
`check_name` + `entity` có `checked_at` trong ngày hôm nay (giờ máy thu) rồi chèn — chạy hai lần cùng ngày không nhân dòng.
Đọc trong giao dịch chỉ đọc. Lỗi chạy (DB không tới, SQL hỏng) → thoát ≠ 0; dòng `fail` không đổi mã thoát.

### 3. Nhịp chạy (Hỏi-3)

Khuyến nghị: bước cuối của `scripts/cloud-sync.sh` (làn Claude, tiền lệ `bac-du-lieu`):
`job_run cloud-sync do-danh-ba-sdt node "$ROOT/pipeline/do-danh-ba-sdt.mjs" --write`. Job chạy 15′ một lần; lệnh ghi theo
ngày nên mỗi ngày còn một dòng mỗi kiểm, làm tươi sau mỗi lượt nạp S03 và S05 trong ngày. Lối khác: một bước trong
`scripts/zalo-import-daily.sh` (đúng «mỗi đêm») — tệp `zalo-*.sh` thuộc làn ZCode, phải giao qua phiên điều phối liên làn,
và số S05 có thể là số trước lượt thu S05 (job apify chạy giờ khác).

Ngày tính theo giờ máy thu (`Asia/Ho_Chi_Minh`), lệnh tự đặt múi giờ phiên DB.

### 4. Hiện trên `/ops/quality`

`app/src/lib/dq-labels.ts` diễn giải năm kiểm («Danh bạ SĐT: …»), đối tượng `S03`/`S05` (đã có) và `sellers`, chi tiết theo
khuôn `khoá=giá trị`. Ca ON12-AC-5 đòi mọi dòng kiểm trên DB máy thu được diễn giải (bài học PL8/PL9). `CONTEXT.md` thêm
thuật ngữ cho nhãn mới. `dq_check_results` lên cloud: chỉ số đếm, không SĐT, không khoá băm, không tên.

## Vì sao không làm khác

- **Viết bằng SQL trong `450_*`**: N4/N5 cần chạy `extractPhones` và regex trên chữ bài — không làm được trong SQL, và 450
  chạy hằng tuần, không chạy đêm.
- **Gắn vào `refresh-bait-gap`/`buocDem`**: hàng P3 `sellers-them-dong-lai` đang sửa đúng tệp đó.
- **So với số cứng của 30/10** (Hỏi-2): DB 30/10 không còn; bản sao cũ nhất (29/10) có trước khi dựng danh bạ (DB2b 30/10),
  nên không tái lập được N1/N2. Khuyến nghị: đối chứng bằng câu đo độc lập của audit §7 trên cùng bản chép DB.

## Ngoài phạm vi

Sửa các lỗi được đo (SD1–SD4, HD13) · S06 (không thu SĐT, N9) · N6–N14 · màn số riêng trên `/ops/quality` · ngưỡng cảnh
báo khác 0.
