# DB local trong volume `onehub_pgdata` — sao lưu, khôi phục, chuyển, lùi

Hồ sơ: `_acceptance/db-vao-volume/`. Thiết kế: `docs/superpowers/specs/2026-10-29-db-vao-volume-design.md`.

## Vì sao có sổ này

Đo 29/10: DB local `:5433` (`one-invest-db`, ảnh `kartoza/postgis:17-3.5`) giữ ~3,7 GB ở
`/var/lib/postgresql/17/main` — trong **lớp ghi của container**. Compose cũ gắn volume `db_oneinvest_pgdata` ở
`/var/lib/postgresql/data`, đường của ảnh `postgres` chính thức; kartoza không dùng đường đó nên volume rỗng. Một lệnh
`docker compose up -d` với cấu hình đổi, `down` hay `docker rm` là mất trọn DB local.

Từ hồ sơ này compose gắn volume có tên `onehub_pgdata` ở `/var/lib/postgresql` (thư mục cha của `<major>/main`, đường
kartoza đọc), dưới project `onehub-db`. Kiểm lúc nào cũng được (chỉ đọc):

```bash
bash scripts/db-volume-check.sh live
```

`PASS data_directory … dưới mount volume onehub_pgdata` là đúng. Thước còn `static`, `mutation` (cấu hình), `tap-duot`
(diễn tập trọn đường đi trên cụm giả `onehub-tapduot-*` cổng 55433, không chạm DB thật, ~2 phút).

## Sao lưu

```bash
bash scripts/db-sao-luu.sh                 # → $HOME/onehub-backups/db/<UTC>/
```

Ra: `<db>.dump` (`pg_dump -Fc`) cho mỗi DB không phải template (gồm DB của ZCode), `globals.sql` (vai), `so-dong.tsv`
(số dòng mọi bảng của `oneinvest`, đếm trong cùng snapshot với dump), `thong-tin.txt`, `manifest.sha256`. pg_dump chỉ
lấy khoá đọc, chạy lúc nào cũng được.

**Bản sao lưu chứa dữ liệu tầng A** (`user_events`, `user_profile` — AGENTS.md luật 6): chỉ nằm trên đĩa máy này.
Lệnh từ chối mọi thư mục nằm trong cây kho; không chép lên cloud, không đính vào issue/PR.

Chưa có lịch sao lưu tự động — lịch chạy là plist launchd (làn ZCode), hàng sau.

## Khôi phục (kiểm được)

```bash
bash scripts/db-khoi-phuc.sh <thư mục bản> oneinvest_<tên>
```

Chỉ khôi phục vào DB thử tên `oneinvest_<…>` (khuôn `db/db-thu.sh`); không bao giờ đè `oneinvest`. Lệnh kiểm
`manifest.sha256`, khôi phục (bỏ `pg_cron` — chỉ sống ở DB chính), đếm mọi bảng và so với `so-dong.tsv`: khớp thì in
`khớp N/N bảng` và ghi dấu `khoi-phuc-ok` vào thư mục bản (lệnh chuyển đòi dấu này ≤ 24 giờ). Xong thì xoá DB thử:
`docker exec -e PGPASSWORD=oneinvest one-invest-db dropdb -U oneinvest -h localhost oneinvest_<tên>`.

Khôi phục sau thảm hoạ (mất cả volume): dựng `docker compose -f db/docker-compose.yml up -d` (cụm trống), rồi
`pg_restore` từng `<db>.dump` vào DB cùng tên — chưa có lệnh bọc cho ca này; bản `oneinvest.dump` đã được chứng khôi
phục được ở mỗi lần có `khoi-phuc-ok`.

## Chuyển (đã chạy một lần — xem «Lượt chuyển thật»)

```bash
bash scripts/db-chuyen-volume.sh                      # chỉ kiểm: hiện trạng + tiền điều kiện, không đổi gì
bash scripts/db-chuyen-volume.sh --lam --sao-luu <bản>
```

Tiền điều kiện (thiếu một → thoát 2, không đổi gì): DB chưa chuyển · volume đích chưa có hoặc rỗng · chưa có bản lùi
· bản sao lưu có `khoi-phuc-ok` ≤ 24 giờ · giờ chuyển cách mọi job launchd theo giờ > 20 phút (đọc
`StartCalendarInterval` của `~/Library/LaunchAgents/com.oneinvest.*.plist`) · không tiến trình `*-daily.sh`,
`weekly-collect.sh`, `finalize-hanoi.sh` nào đang chạy · đĩa máy ảo và máy chủ còn ≥ 2 × cỡ dữ liệu.

Các bước của `--lam`: hạ restart policy về `no` (không thì `unless-stopped` tự bật lại DB vừa tắt) → `pg_ctl stop -m
fast` → đổi tên container cũ thành `one-invest-db-cu-<YYYYMMDD>` (KHÔNG xoá) → chép thư mục `17/` vào volume, cùng luồng
ghi **tar lạnh** `datadir-17.tar` + sha256 vào thư mục bản → `tar --diff` từng byte + `pg_controldata` «shut down» →
`docker compose up -d` → đếm số dòng bảng chính (trừ danh sách loại trừ có lý do trong script) → `--force-recreate` →
đếm lại. DB ngừng ~3–6 phút; job 5/15 phút lỡ một nhịp. Lỗi ở bước nào sau khi tắt: lệnh in đúng dòng lệnh lùi và
thoát 1, không xoá gì.

## Lùi

```bash
bash scripts/db-chuyen-volume.sh --lui                    # bật lại container cũ (bản lùi)
bash scripts/db-chuyen-volume.sh --lui --tu-tar <bản>     # bản lùi đã mất: dựng lại từ tar lạnh
```

`--lui` dừng container mới (cất sang `one-invest-db-moi-<giờ>`, volume giữ nguyên), đổi tên bản lùi về
`one-invest-db`, trả restart `unless-stopped`, bật lại. `--tu-tar` kiểm sha256 rồi giải tar lạnh vào volume
`onehub_pgdata_lui_<giờ>` và chạy cụm cũ trên cổng 5433. **Dữ liệu ghi vào cụm mới sau giờ chuyển không theo về.**

## Cảnh báo: compose cũ có thể xoá bản lùi

Bản lùi vẫn mang nhãn compose project `db` (Docker không cho sửa nhãn). Một checkout hay worktree còn compose cũ
(project `db`, chưa pull main) chạy `docker compose up -d` với cấu hình khác thì compose **tạo lại** container ấy, tức
xoá bản lùi; `docker compose down` từ compose cũ cũng xoá nó (tập dượt đo đúng ca này). Vì vậy:

- Trong thời gian giữ bản lùi: không chạy `docker compose` từ checkout/worktree chưa có commit đổi compose của hồ sơ
  `db-vao-volume`. Checkout chính `pull` main ngay khi PR vào main.
- Còn tar lạnh trong thư mục bản sao lưu làm lưới thứ hai (`--lui --tu-tar`).

## Giữ và xoá bản lùi

Giữ `one-invest-db-cu-<YYYYMMDD>`, volume rỗng cũ `db_oneinvest_pgdata` và thư mục bản sao lưu của lượt chuyển ít nhất
7 ngày; sau đó hỏi Mạnh trước khi xoá (xoá là việc riêng, không thuộc hồ sơ này).

## Lượt chuyển thật

- **29/10/2026, 16:19:43–16:20:50 giờ VN (09:19–09:21Z)**, lệnh `db-chuyen-volume.sh --lam`, exit 0, 66 giây; dãy P2
  của đợt `dot0-cam-mau` cầm khoá s4 (không lượt chấm nào chạy trên :5433). Đã báo phiên điều phối liên làn trước
  (ZCode, mã `claudedp-2910-4`).
- Bản sao lưu dùng: `$HOME/onehub-backups/db/20261029T085125Z/` — khôi phục thử khớp 283/283 bảng lúc 08:52Z; thư mục
  này còn giữ tar lạnh `datadir-17.tar` của lượt chuyển.
- Kết quả: `tar --diff` 0 tệp lệch; `pg_controldata` shut down; số dòng 283 bảng trước = sau chuyển = sau tạo lại (so
  chặt 279 bảng chính); 4 DB (`oneinvest`, `postgres`, `zcode_tv2b`, `zcode_verify`) và ALTER SYSTEM còn nguyên; kiểm
  vận hành trước/sau như nhau (30 PASS · 3 FAIL có từ trước · 6 LIMITED). Bằng chứng: `_acceptance/db-vao-volume/evidence/`.
- Bản lùi: container `one-invest-db-cu-20261029` (dừng, restart `no`), volume rỗng cũ `db_oneinvest_pgdata`, tar lạnh
  trong thư mục bản sao lưu. **Sớm nhất được hỏi Mạnh xoá: 05/11/2026 16:20 giờ VN.**
