# so-lenh-sua-sau-tv4 — sửa ba chỗ hỏng của đường lệnh sau TV4

Hàng của dãy P4, đợt dot0-cam-mau, xếp trước TV4b. Gộp hai mục Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng TV4
(Ngoài-2, Ngoài-4; `_acceptance/so-lenh-bo-ap/decisions.jsonl` d-…-29, d-…-30), và một lỗi gặp khi triển khai
TV4 ngày 11/11: `scripts/cap-token-may.mjs` không chạy được từ máy thu với DB cloud.

## Ba chỗ hỏng

1. **`resume_when` sai kiểu làm kẹt hàng lệnh (Ngoài-4, mức cao).**
   - `kiemLenh` (`pipeline/lib/lenh.mjs`, bản chẵn `app/src/lib/lenh.ts`) nhận mọi giá trị ở khoá `resume_when`.
   - Một lệnh `source.pause` có `resume_when: 5` vẫn qua kiểm ở cloud, được duyệt và kéo về máy thu.
   - Tới `apLenh`, `p.resume_when?.trim()` ném `TypeError`. Lỗi này không phải lỗi kiểm sau, nên ném ra khỏi
     `apLenh`, rồi ra khỏi vòng lặp của `ops-apply.mjs`.
   - Hậu quả: lệnh đó vẫn ở `queued`; lượt sau kéo lại đúng nó trước, ném lại. Mọi lệnh xếp sau kẹt vĩnh viễn.
2. **plist không tìm thấy node dưới launchd (Ngoài-2).**
   - `pipeline/cron/com.oneinvest.ops-apply.plist` chạy `/usr/bin/env node`.
   - PATH mặc định của launchd là `/usr/bin:/bin:/usr/sbin:/sbin`; node của máy thu nằm ở `~/.local/bin/node`.
   - Đã thử ngày 11/11: `env -i PATH=/usr/bin:/bin:/usr/sbin:/sbin /usr/bin/env node` ra
     `env: node: No such file or directory`. Nạp bản hiện tại thì job hỏng mỗi 60 giây.
3. **Không cấp được token máy từ máy thu.**
   - `cap-token-may.mjs` nối Postgres cloud bằng `pg`. Ngày 11/11 từ máy thu: hai chuỗi pooler hết giờ, chuỗi
     `DIRECT` không phân giải được tên máy.
   - `sync-cloud` đã đi Management API (`mgmtExec`) vì đúng lý do này.
   - Token phải chép tay vào `~/.oneinvest/cloud.env`. Lần chép ngày 11/11 dính vào dòng `APIFY_TOKEN` vì tệp không có
     ký tự xuống dòng ở cuối.

## Cách sửa

1. **Kiểm khuôn chặn từ cổng vào, bộ áp ghi `failed` thay vì ném.**
   - `kiemLenh` thêm một nhánh sau kiểm `reason`: `resume_when` có mặt mà không phải chuỗi và không phải `null`
     → `{ok:false, ly_do:"resume-when-sai-khuon"}`. Chuỗi rỗng hay chỉ có khoảng trắng vẫn hợp lệ (bộ áp coi là
     `null`, như hôm nay).
   - Sửa cả hai bản: `lenh.mjs` và `lenh.ts`. Test SL-AC-5b của TV4 so hai bản trên mọi ô, nên ô mới phải vào ma
     trận chung.
   - Cloud trả 400 cho lệnh như vậy, nên lệnh không vào `change_requests`.
   - Lệnh đã nằm trong `change_requests` từ trước bản sửa vẫn có thể được kéo về. `apLenh` gọi `kiemLenh` trước khi
     đụng `source_registry`, nên nó ghi sổ `failed` với `ly_do: resume-when-sai-khuon` rồi COMMIT. Lượt sau không kéo
     lại lệnh đó, và lệnh sau nó được áp.
2. **plist neo node tuyệt đối lúc cài.**
   - `ProgramArguments[0]` đổi từ `/usr/bin/env` + `node` thành chỗ giữ `__NODE__`.
   - Lệnh cài trong `docs/ops/runtime-map.md` thay `__NODE__` bằng `$(command -v node)` của người cài, cùng lúc thay `__ROOT__`.
     Giữ nguyên đường `command -v` trả, không giải symlink: máy thu có `~/.local/bin/node` là symlink, nên nâng bản node
     bằng cách đổi symlink thì plist vẫn chạy. Đổi chỗ đặt node thì cài lại plist (ghi trong runtime-map).
   - Đây là cách `collector/scripts/api-launchd.sh` đã làm: launchd PATH tối giản nên node neo tuyệt đối.
   - Lệnh cài là MỘT dòng trong runtime-map. Test rút đúng dòng đó ra chạy, nên tài liệu và phép đo không lệch nhau.
3. **`cap-token-may.mjs` thêm đường Management API và tự ghi `cloud.env`.**
   - Cờ `--qua-mgmt`: đọc `SUPABASE_MGMT_TOKEN` từ `~/.oneinvest/cloud.env`, gọi `mgmtExec` của
     `pipeline/sync-cloud.mjs`.
   - Token vẫn sinh ở máy; chỉ băm sha256 rời máy. Câu SQL giống hệt đường `pg`: chèn có `ON CONFLICT … WHERE revoked_at
     IS NOT NULL`, `RETURNING`.
   - Cờ `--ghi-cloud-env`: không in token ra stdout mà nối dòng `OPS_MACHINE_TOKEN=<token>` vào `cloud.env`.
     - Tệp không kết thúc bằng xuống dòng thì thêm một ký tự xuống dòng trước.
     - Tệp đã có `OPS_MACHINE_TOKEN` thì từ chối trước khi chạm cloud (thoát 2, tệp và cloud không đổi).
     - Cloud trả 0 dòng (tên đang có token hiệu lực) thì không ghi gì vào tệp.
   - `--thu-hoi <tên> --qua-mgmt` thu hồi qua cùng đường.
   - Đường `pg` cũ giữ nguyên cho DB thử và DB máy thu: test SL-AC-4 của TV4 dùng nó.
   - Script xuất hàm `chay({argv, home, fetchImpl, out})` và chỉ chạy `main` khi được gọi trực tiếp (như `sync-cloud`).
     Test gọi `chay` với `mgmtExec` THẬT và `fetchImpl` giả: phép đo đi qua đúng đường đọc khoá từ `cloud.env`, dựng
     header, và đọc dạng phản hồi của Management API, chỉ thay lớp mạng.

## Ngoài phạm vi

- `ops-apply.mjs` bắt mọi lỗi theo từng lệnh để một lệnh hỏng không chặn lệnh sau. Đây là lưới thứ hai, chạm cách lặp
  và cách báo lỗi kết nối DB. Vòng này đóng đúng đường hỏng đã biết; lưới chung để hàng riêng nếu cần.
- Dọn lệnh `resume_when` sai kiểu đã có sẵn trên cloud: hôm nay `change_requests` trên Supabase có 0 dòng (đo 11/11).
- Kiểm `resume_when` theo khuôn ngày giờ: cột là `text` tự do (047), nghĩa «điều kiện bật lại» do người viết.
- Script cài plist tự động (`install-*.sh` là làn ZCode): vòng này chỉ đổi dòng lệnh cài trong runtime-map.
- Nạp plist vào launchd: bước triển khai sau gộp, cần lời riêng của Mạnh (đã cho lời «Nạp plist ops-apply» ngày 11/11,
  chờ hàng này gộp).

## Hệ quả cho hồ sơ TV4

- Ba tệp vòng này sửa nằm trong `paths` của eval TV4: `pipeline/lib/lenh.mjs`, `app/src/lib/lenh.ts`,
  `scripts/cap-token-may.mjs`.
- Hồ sơ `so-lenh-bo-ap` (đã ký) sẽ bị lưới trước-gộp báo cũ. PR này ghim lại nó bằng làn ghim lại, trong cùng lượt
  có khoá. Test của TV4 không đổi: ô mới của ma trận nằm ở test của hồ sơ này.

## Đặc tả UX

Bỏ: hàng không có màn (ghi `descope` trong sổ).
