# Hai máy — máy thu (Mac mini) và máy mở rộng M5 (vận hành, HT25)

Mô hình và năm rào: `docs/adr/0019-day-ban-chep-sang-may-phat-trien.md`. Hợp đồng: `_acceptance/day-ban-chep-sang-may-phat-trien/`.

| Máy | Vai (`VAI=` trong `~/.config/onehub/hai-may.env`) | Chạy gì | Dữ liệu |
|---|---|---|---|
| Máy thu (Mac mini) | `may-thu` | collector, launchd, pipeline, DB `oneinvest` thật; gộp `main` CHỈ ở đây | giữ tầng A; DB máy thu chỉ đọc với lệnh đẩy |
| M5 — máy mở rộng tính toán của Mac mini (máy bàn ở nhà, chạy lâu dài) | `may-phat-trien` | một hàng việc một giám sát; cổng Invest, data-api; tự chấm S4 vùng Invest + API trên bản chép | chỉ bản chép đã lọc (HT18); không tầng A, không raw snapshot; không bộ thu, gateway, `sync-cloud` |

Hai máy nối bằng cáp Thunderbolt (giao diện cầu, địa chỉ IPv4 cố định). Giá trị riêng máy — địa chỉ cầu hai máy, người dùng M5, đường
khoá đẩy, đường khoá quản trị, tên máy — chỉ nằm ở `~/.config/onehub/hai-may.env` của máy thu (khoá `CAU_GIAO_DIEN`, `CAU_MAY_NAY`,
`M5_DIA_CHI`, `M5_NGUOI_DUNG`, `KHOA_DAY`, `KHOA_DUNG`, `M5_TEN_MAY`) và `CLAUDE.local.md`. **Không ghi chúng vào kho** (kho công khai;
`day-ban-chep-kiem-m5.mjs tai-lieu` soát). Trong tài liệu dùng chỗ giữ: `<địa chỉ cầu M5>`, `<khoá đẩy>`, `<khoá quản trị>`.

Giữ nguyên: tầng A và raw snapshot không sang M5; đẩy chỉ theo lệnh (plist là việc sau, cần lời riêng của Mạnh); gộp vào `main` chỉ
ở Mac mini.

## Đẩy bản chép (máy thu)

```bash
node scripts/day-ban-chep.mjs
```

Một lượt: kiểm cầu → chép + soát DB máy thu (HT18, chỉ đọc) → ghim sha256 → gửi đúng hai tệp (dump, `ke.json`) qua stdin của lệnh con
`nhan` → bước nhận trên M5: so sha256, `ban-chep-da-loc.mjs --kiem --khong-tu-dien`, `pg_restore` vào `oneinvest_moi` bằng `docker exec`,
đếm = `ke.json`, đổi tên (bản cũ → `oneinvest_cu`), xoá tệp. In thời gian từng chặng; sổ ở `state/day-ban-chep/so.jsonl`.
Mã thoát: 0 xanh · 1 đỏ (DB chạy trên M5 giữ nguyên) · 2 cấu hình sai · 3 cầu Thunderbolt không thông.
Chỉ chạy khi người gọi — không plist, không cron (hàng sau, cần lời riêng của Mạnh).

## Kiểm sau

```bash
node scripts/day-ban-chep.mjs --trang-thai     # DB chạy, bản cũ, bản chép đang chạy (ten_dich, sha256) — qua khoá đẩy
```

Trên M5: trang Invest khu Hà Nội và `/v1/listings` của data-api đọc DB `oneinvest` (app chạy với `RENAME_REFCALIB=1`). Kho M5 phải ở
`main` có HT18 (`scripts/ban-chep-da-loc.mjs`): `git -C ~/dev/onehub-invest pull --ff-only` trên M5 trước lượt đẩy đầu.

## Lùi

```bash
node scripts/day-ban-chep.mjs --lui            # bản cũ thành DB chạy, DB chạy thành bản cũ; gọi lại là đổi về
```

Bước nhận lỗi ở chặng nào cũng tự giữ DB chạy và xoá DB mới (thông điệp «ĐỎ chặng <tên>»); `--lui` chỉ cần khi bản chép mới đã nạp
xanh mà dữ liệu sai.

## Cài, thu hồi khoá đẩy (máy thu, dùng khoá quản trị)

```bash
node scripts/day-ban-chep-kiem-m5.mjs cai      # tạo <khoá đẩy> nếu chưa có; chép bước nhận sang ~/.local/share/onehub/ của M5;
                                               # ghi VAI=may-phat-trien vào ~/.config/onehub/hai-may.env của M5 nếu chưa có;
                                               # sao lưu authorized_keys M5 rồi thêm MỘT dòng restrict,command="…/nhan-ban-chep.sh"
node scripts/day-ban-chep-kiem-m5.mjs go       # thu hồi: sao lưu rồi gỡ đúng dòng của khoá đẩy (khoá đẩy hết vào được)
```

Sửa `scripts/nhan-ban-chep.sh` thì chạy lại `cai` để chép bản mới sang M5 (dòng khoá có sẵn đúng khuôn thì không đổi). Khoá quản trị
(`<khoá quản trị>`, khoá `KHOA_DUNG` trong cấu hình, toàn quyền vào M5): Mac mini giữ **lâu dài** (Mạnh chốt 25/11 tối, thay Hỏi-1 —
không thu hồi sau tuần đo) để dựng, kiểm M5 và chạy `cai`, `go`, các lệnh kiểm; không bao giờ dùng cho lượt đẩy. Khoá đẩy luôn bị ép
lệnh chỉ chạy bước nhận. M5 không có khoá nào vào Mac mini.

## Lệnh kiểm (ngoài CI)

```bash
node scripts/day-ban-chep-kiem-m5.mjs khoa       # E3: khoá đẩy chỉ chạy bước nhận
node scripts/day-ban-chep-kiem-m5.mjs mot-chieu  # E4: máy thu không có khoá nào của M5
node scripts/day-ban-chep-kiem-m5.mjs lich       # E8: không plist/cron cho đẩy/nhận trên hai máy
node scripts/day-ban-chep-kiem-m5.mjs tai-lieu   # E11: tài liệu đủ, kho không lộ giá trị riêng máy
node scripts/day-ban-chep-kiem-m5.mjs that       # E10: lượt đẩy thật + Invest, data-api trên M5 (chỉ trong lượt chấm)
```

## Rút cáp, cầu đứt

Lệnh đẩy kiểm địa chỉ M5 nằm trên giao diện cầu (`route get`) trước khi chép và trước khi gửi; không thì dừng nêu «cầu Thunderbolt», mã
3, không gửi qua Wi-Fi hay LAN. Cắm lại cáp, kiểm `ifconfig <giao diện cầu>` có lại địa chỉ cố định (địa chỉ đặt tay trên dịch vụ mạng
«Thunderbolt Bridge» của mỗi máy, giữ qua rút cáp và khởi động lại; mất thì Mạnh gõ lại
`sudo networksetup -setmanual "Thunderbolt Bridge" <địa chỉ cầu máy ấy> 255.255.255.0` — giá trị thật ở `CLAUDE.local.md`), rồi chạy lại. Lượt đứt giữa chừng: bước nhận thấy luồng thiếu
hay sha256 lệch → «ĐỎ chặng nhan/sha», DB chạy trên M5 giữ nguyên.

## Bẫy

- DB trên M5 chỉ thao tác qua `docker exec … one-invest-db` — cổng 5433 của M5 là đường chuyển của colima, không ổn định. Không tự khởi
  động lại colima hay docker ở máy nào.
- Bước `--kiem` của HT18 tự nối `localhost:5433` để dựng DB tạm: cổng 5433 của M5 đứt thì lượt đỏ ở «chặng kiem», DB chạy giữ nguyên.
- Test của bước nhận chạy trên máy thu (`scripts/day-ban-chep.itest.mjs` dưới `db/db-thu.sh --chay`) với vai `may-thu`: bước nhận chỉ
  được chạm DB `oneinvest_suite_*`; vân tay DB `oneinvest` (oid, tập DB) đo trước và sau lượt.
