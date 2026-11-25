# Kế hoạch: day-ban-chep-sang-may-phat-trien (HT25, T3)

Hợp đồng: `_acceptance/day-ban-chep-sang-may-phat-trien/contract.md` (AC-1…AC-12, Mạnh duyệt 25/11 08:24Z). Thiết kế cùng tên trong
`docs/superpowers/specs/`. Cấu hình riêng máy: `~/.config/onehub/hai-may.env` (cầu `10.77.77.x` đã đặt 25/11, không vào kho).
Luật: DB máy thu chỉ đọc; bước nhận không bao giờ chạm DB máy thu (AC-12); tải 1′ < 12 và `nice -n 10` cho việc nặng ngoài s4.

## Task 1 — Bước nhận `scripts/nhan-ban-chep.sh` (independent: false)
- Chỉ chạy khi có `SSH_ORIGINAL_COMMAND`; lệnh con đóng: `nhan <sha256>` (tệp qua stdin, có trần cỡ), `lui`, `trang-thai`; từ chối ký tự
  ngoài `[a-z0-9-]`; đọc vai máy, container, DB chạy từ `~/.config/onehub/hai-may.env` + biến lượt; vai máy thu chỉ cho DB
  `oneinvest_suite_*`.
- Nhận: `.part` → so sha256 → `ban-chep-da-loc.mjs --kiem --khong-tu-dien` (kho trên M5) → `pg_restore` vào DB mới bằng `docker exec`
  → đếm = `ke.json` → ngắt kết nối, đổi tên hai bước, giữ một bản cũ → xoá tệp. Lỗi ở chặng nào cũng giữ DB chạy, nêu chặng.
- Verify: E6, E7, E12 (itest, DB của lượt).

## Task 2 — Lệnh đẩy `scripts/day-ban-chep.mjs` (independent: false, sau Task 1)
- Chạy chép + soát HT18 trong cùng lượt → ghim sha256 → danh sách tệp đóng (dump, `ke.json`) → ssh tới địa chỉ cầu với
  `-i <khoá đẩy> -o IdentitiesOnly=yes -o IdentityAgent=none`, kiểm địa chỉ nằm trên giao diện cầu (route get) → `nhan` qua stdin → in
  thời gian từng chặng, ghi sổ `state/day-ban-chep/so.jsonl`.
- Verify: E1, E5, E9 (test thuần), E2 (itest).

## Task 3 — Cài đặt và kiểm trên M5 `scripts/day-ban-chep-kiem-m5.mjs` (independent: false, sau Task 2)
- `cai`: tạo khoá đẩy (Mac mini), thêm dòng `restrict,command="…/nhan-ban-chep.sh"` vào `authorized_keys` M5 qua khoá dựng máy,
  chép bước nhận sang M5; `go`: thu hồi. Lệnh con kiểm: `khoa`, `mot-chieu`, `lich`, `that`, `tai-lieu`.
- Verify: E3, E4, E8 (M5 thật qua cầu), E10 (lượt thật — chỉ trong lượt chấm), E11.

## Task 4 — Tài liệu (independent: false, cuối cùng)
- ADR-0019, `docs/ops/hai-may.md` + dòng trỏ ở `runtime-map.md`, mục «Hai máy» AGENTS.md, ROADMAP §3 mục 64 (commit riêng, sau khi lấy
  main mới nhất, báo GS trước khi đẩy), `CLAUDE.local.md` checkout chính (gitignored).
- Verify: E11.
