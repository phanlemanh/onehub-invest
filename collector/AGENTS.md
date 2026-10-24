# collector/ — luật cho agent làn thu thập (ZCode)

> Bản chép các rào chắn mà Claude Code nhận tự động qua `.claude/` (hook, deny, luật tự
> nạp) — agent khác không có các rào đó nên phải đọc file này trước khi làm.
> Phân làn đầy đủ: mục "Phân làn hai agent" trong `AGENTS.md` ở gốc repo.
> Kiến trúc collector: `collector/CLAUDE.md`. Giao diện với pipeline: `collector/docs/DATA-CONTRACT.md`.

## Không được đụng

- **Không đọc** `.env`, `.env.local`, `.env.production*`, `*.har`, `.airdna-profile/**`.
- **Không sửa/xoá** gì trong `snapshots/` — raw snapshot bất biến, collector chỉ ghi mới.
- **Không sửa** `.airdna-profile/` (cookie đăng nhập AirDNA, đăng nhập một lần dùng mãi).
- Không `git push --force`; không merge vào `main`; không checkout nhánh khác trong
  `~/dev/onehub-invest` (launchd chạy code từ đó).
- Không sửa migration đã commit trong `db/migrations/`; không tự chạy migration.

## An toàn Zalo (hiến pháp — đã có 2 sự cố)

Áp dụng khi chạm `collector/openclaw/**`, file có `zalo` trong tên, `scripts/zalo-*.sh`.

- Agent/LLM **không bao giờ** được gửi tin, trả lời, react hay tham gia nhóm Zalo. Không thêm
  tool, binding hay cấu hình nào mở đường gửi.
- Trước khi đụng OpenClaw (gateway, zalouser, hook `oneinvest-zalo-pipe`, `requireMention`,
  bindings): đọc `docs/ops/runtime-map.md` ở gốc repo. Gateway canonical là launchd `ai.openclaw.gateway`;
  không chạy production từ `~/dev/openclaw`.
- Log đầy đủ ở `~/Library/Logs/openclaw/gateway.log`, không phải `/tmp/openclaw/`.
- Mọi thay đổi ống Zalo phải giữ watchdog 5′ xanh và kiểm cả hai phía: agent vẫn 0 turn
  VÀ tin vẫn chảy tới hook (đừng để "an toàn" che "0 tin").
- Nhóm thu: bất biến 1 nhóm – 1 tài khoản; allowlist quản trị ở `/ops/sources`.

## Ranh giới dữ liệu (SPL, ADR-0007)

- Nguồn gọi bằng mã `S01`…`S07`, đọc từ `source_registry` — không hardcode tên nguồn thật
  trong code hay log đi ra ngoài máy.
- Tầng A (tên nguồn thật, hồ sơ người dùng app) **không rời máy local**. Định danh người bán trên
  tin rao (tên, SĐT, ID tài khoản) là tầng C — công khai (Mạnh chốt 2026-10-23), nhưng giá trị
  nào lộ tên nguồn thật vẫn là tầng A.
  Collector không gửi dữ liệu lên cloud; việc sync là của `pipeline/sync-cloud.mjs` (làn Claude).
- AirDNA chỉ để hiệu chuẩn (ToS) — số AirDNA không được đi tới Invest Portal.

## Hợp đồng với pipeline

- Thêm/đổi field trong snapshot → sửa `collector/docs/DATA-CONTRACT.md`, **tăng `schemaVersion`**, ghi
  rõ trong commit để Claude cập nhật transform + migration trước khi merge.
- Field/enum mới: tra RESO Data Dictionary trước (`docs/research/reso-standards.md` ở gốc repo).
- Script nạp (`pipeline/import-*.mjs`) chỉ ghi bảng `stg_*` / `airbnb_snapshots`.

## Giao tiếp với Claude (luật tin của plugin dieu-phoi)

Đầu mối duy nhất phía Claude là **điều phối liên làn** (`claudedp`). Mọi giao việc, hỏi, báo đi qua
kênh issue riêng tư `phanlemanh/onehub-coord#1` (kho onehub-invest đã công khai — đừng đăng gì về điều phối lên issue của kho này) bằng lệnh bọc — không nhắn qua Mạnh, không sửa tay issue.

```bash
T=~/dev/onehub-coord/bin/tin
$T zcode doc                                   # đọc tin mới gửi mình (hook đã tự chạy — xem dưới)
$T zcode so                                    # sổ vòng đang mở (của mình và mình gửi)
$T zcode NHẬN <mã> "sẽ giao <một câu bằng lời của mình>"
$T zcode XONG <mã> --vat "<khuôn --vat dưới đây>"
$T zcode KẸT <mã> "<cần gì, từ ai>"
$T zcode HỎI claudedp "<câu hỏi> · Khuyến nghị: <ngả bạn chọn + vì sao>" --chan
$T zcode BÁO claudedp "<một câu>"             # không mở vòng, không ai phải đáp
$T zcode TRẢ <mã> "<lý do>" --chuyen claudedp
```

**Hook đưa tin** (từ 25/10): `~/dev/onehub-coord/bin/zcode-hook` gắn ở `~/.zcode/cli/config.json`
→ tin mới tự hiện khi mở phiên, mỗi lời nhắc của Mạnh và tối đa 5 phút một lần giữa lượt; kết lượt khi
còn GIAO/HỎI chưa NHẬN thì bị chặn một lần. Làm việc bằng MỘT phiên ZCode ở `~/dev/onehub-invest-zcode`.

### Mười điều claudedp mong đợi

1. **NHẬN trong 30 phút** kể từ khi tin hiện trong phiên. Câu «sẽ giao …» nói lại ý định bằng lời mình,
   kể cả điều kiện và thứ tự đã ghi trong lời giao — để lệch thì lộ ngay ở bước nhận.
2. **Một lời giao, một nhánh** `zcode/<việc>` tạo từ `origin/main` MỚI NHẤT; không trộn hai lời giao vào
   một nhánh trừ khi lời giao nói vậy. Trước XONG: rebase lên `origin/main`, chạy lại kiểm.
3. **Khuôn `--vat` của XONG** (đủ để nghiệm thu, không cần hỏi lại):
   `zcode/<việc> @ <sha> · <mã hàng> · vòng <n> (đổi gì so vòng trước) · <lệnh kiểm> <số pass>/<tổng> · DB: <bản chép tên gì | không đụng DB> · chưa làm / giới hạn: <…>`
4. **XONG lại sau MỞ LẠI**: một tin XONG mới cho đúng mã, ghi «vòng n» và từng điểm của lời MỞ LẠI đã xử
   ra sao. Đừng chỉ dẫn sang tin khác.
5. **HỎI luôn kèm khuyến nghị**: một câu hỏi đóng, ngả bạn chọn và căn cứ. Ô «Khuyến nghị» để trống là
   bắt người giao làm lại phần bạn đã biết.
6. **Báo chặn sớm**: kẹt quá 30 phút, hoặc gặp điều làm lời giao sai → `KẸT`/`HỎI --chan` ngay, không đợi
   tới hạn xong. Quá hạn xong mà chưa xong → `KẸT` nói còn gì và ước khi nào.
7. **Mạnh giao trực tiếp** → `BÁO claudedp` ngay một câu (việc gì, Mạnh duyệt gì) để vào sổ; claudedp mở
   vòng có mã nếu cần nghiệm thu.
8. **DB**: mọi lượt tự kiểm có NẠP chạy trên BẢN CHÉP (`pg_dump` → DB tạm, `DATABASE_URL` trỏ bản chép).
   Không bao giờ chạy `import-*` với `DATABASE_URL` mặc định khi tự kiểm (sự cố 24/10: hai lần đặt lại
   `captured_at` trên :5433).
9. **Tầng A không rời máy**: không tên nguồn thật hay tên miền trong mã, tên tệp, test, DATA-CONTRACT,
   commit message, tên snapshot dùng trong tin, đường dẫn trích lên kênh. Dùng mã S0x (sự cố 24/10:
   tên S08 trong 6 commit, sửa trước khi push).
10. **Việc khó đảo phải HỎI trước** — kể cả khi chắc là đúng: xoá dữ liệu/snapshot, push, restart dịch
    vụ, cài vào `~/.openclaw`, `launchctl`. Làm rồi mới báo là không được.

- Phát hiện việc ngoài lời giao → `BÁO claudedp`, không tự mở rộng phạm vi.
- **Phải `HỎI --chan`, không tự làm**: chạm tệp ngoài làn · đổi DATA-CONTRACT/`schemaVersion` · chạm
  cấu hình OpenClaw/Zalo hay launchd · cần cột/bảng `stg_*` mới (số migration do Claude cấp) · mọi thao
  tác trong checkout chính hay dịch vụ đang chạy (build, restart, `launchctl`) ngoài lời giao triển khai ·
  việc khó đảo (xoá, push, cắt bản) · hai nguồn nói trái nhau.
- **Không hỏi**: đặt tên, thứ tự việc trong làn, chọn giữa hai cách đều đảo được — tự quyết, ghi vào commit.
- **Không đưa tầng A lên kênh**: không tên nguồn thật, hồ sơ người dùng app, URL ảnh tin. Dùng
  mã S0x, offer/post id, nhánh, sha.
- Cài hook vào OpenClaw: theo `docs/ops/runbook-openclaw-hook.md`.

## Kiểm trước khi báo xong

```bash
cd collector && npm run check && npm test && npm run build && npm run collect -- list-sources
cd pipeline && npm test        # khi đụng script thu/nạp trong pipeline/
node scripts/check-freshness.mjs
```

Bẫy: Airbnb/AirDNA chỉ chạy headful Chrome; phân trang Airbnb dùng `A[aria-label^='Trang N']`;
OSM dùng `out geom` + header UA.
