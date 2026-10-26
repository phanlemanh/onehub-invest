# Review findings: noi-tiep-zc4 (round 1)

Phạm vi đọc: `git diff 6b0afe7..b914cb0` gồm `scripts/install-collector-api.sh` (+10/−4),
`pipeline/scripts/install-collector-api.test.mjs` (+26), `collector/src/core/scheduler.ts` (+4/−1) và
`collector/src/test/snapshot-skip-khong-rac.test.ts` (+89). Đọc thêm các nơi liên quan: `SnapshotWriter` (`collector/src/core/storage.ts`),
nơi gọi thứ hai `collector/src/api/server.ts:242` và `inActivityWindow` (`collector/src/core/conduct.ts`). Mọi phép thử chạy trên bản
chép trong scratchpad với HOME giả và launchctl giả. Phiên chấm không chạy script với HOME thật, không gọi launchctl thật, không chạm
`collector/snapshots` thật hay tiến trình :9210.

## Trong hợp đồng

(không có finding nào map được vào AC. E1–E6 đều đạt, xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- **Ghi nguyên tử plist.** `mktemp` không đối số trên macOS tạo tệp trong thư mục tạm riêng của user (`/var/folders/<..>/T`). Lệnh
  này bỏ qua `TMPDIR` đặt tay, phiên chấm đã thử. Trên máy này thư mục đó và `~/Library/LaunchAgents` cùng một volume APFS
  (`stat -f %d` đều ra 16777231, cùng `/System/Volumes/Data`), nên `mv` là một lần `rename(2)` nguyên tử. Plist cũ chỉ bị thay khi
  sed, chmod và `plutil -lint` đều qua. Quyền 600 được đặt trên tệp tạm trước khi `mv`, nên không có khoảnh khắc nào plist mới mang
  quyền rộng hơn.
- **sed lỗi.** Có `set -euo pipefail`. Với đường gốc chứa `|`, sed báo «bad flag in substitute command», script thoát 1 trước
  `mv`. Plist cũ giữ nguyên, không có lời gọi launchctl nào. Phiên chấm đã chạy riêng với `bash -x` để xác nhận đúng chỗ dừng.
- **Thư mục log.** `mkdir -p "$ROOT/pipeline/logs"` nằm sau mọi cửa kiểm trước và sau nhánh `--dry`, nên `--dry` vẫn không ghi
  gì (E4 vế (1)).
- **scheduler: không còn chỗ nào dùng writer trước khi tạo.** `writer` chỉ được dùng trong `try` (`write`, `finalize`) và `catch`
  (`finalize` báo lỗi). Cả hai khối nằm sau dòng khởi tạo mới. Hai lối `return` sớm không chạm writer. `tsc` strict biên dịch sạch.
- **Thứ tự log.** `log("start")` vẫn đứng ngay sau khi tạo writer và trước `collect`, như bản cũ. Hai dòng `skip:` vẫn in trước mọi
  thao tác đĩa. Không có bộ đọc log nào phụ thuộc vào thứ tự giữa lúc tạo writer và dòng skip.
- **Nơi gọi thứ hai.** `server.ts` tạo writer lười (`writer ??= …`) ngay lúc flush có tin, nên không có đường skip để lại rác.
- **Tính tất định của test cửa sổ giờ.** Cửa sổ `(h+1)%24 – (h+2)%24` với `h >= lo && h < hi` không bao giờ chứa giờ hiện tại, kể
  cả lúc 22h («23-0», rỗng) và 23h («0-1»).

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Lượt cài hỏng (sed hay plutil lỗi) để lại một tệp tạm rỗng trong thư mục tạm của user**
  Người dùng thấy gì: Không thấy gì trên cổng hay trong vận hành. Mỗi lần script cài thoát lỗi sau bước tạo tệp tạm, thư mục tạm
  của user có thêm một tệp `tmp.XXXXXXXXXX` 0 byte, quyền 600. Ca (b) mới trong `install-collector-api.test.mjs` cố ý làm sed lỗi,
  nên mỗi lần chạy bộ test cũng để lại một tệp như vậy. Lượt chấm này sinh 5 tệp: probe E1/E2, test E5 và ba lượt thử thêm. Phiên
  chấm đã xoá cả 5.
  Căn cứ: Chỉ là tệp rỗng trong thư mục tạm mà macOS tự dọn, không mất hay lộ dữ liệu, không ảnh hưởng plist hay launchd, nên
  không đáng mở thêm một vòng việc cho riêng nó.
  file: `scripts/install-collector-api.sh`
  severity: low
  Đề xuất: known-limits (muốn sạch hẳn thì thêm một dòng `trap 'rm -f "$TMP_OUT"' EXIT` hoặc tạo tệp tạm ngay trong `$DEST`;
  cách sau còn bảo đảm cùng volume với plist)

## Known limits

- Đường gốc chứa `&` vẫn chưa được chặn. sed thay `&` bằng chuỗi khớp `__ROOT__`, plist sai mà vẫn qua `plutil -lint` (OOC-3 của
  `collector-api-launchd`). Hợp đồng này chỉ phủ ca `|`. Đường thật không có ký tự như vậy.
- `mv` chỉ nguyên tử khi thư mục tạm của user và `~/Library/LaunchAgents` cùng volume. Điều này đúng với macOS mặc định và đúng trên
  máy này. Nếu home nằm ở volume khác, `mv` thành chép rồi xoá. Lúc đó sed hỏng vẫn không đè plist, chỉ mất tính nguyên tử khi bản
  thân lệnh `mv` gặp sự cố.
- Đổi hành vi phụ ở scheduler: trước đây `snapshotRoot` không ghi được thì lỗi ném ra cả ở lượt bị skip, giờ chỉ ném ở lượt chạy thật.
  Lượt thật vẫn lộ lỗi như cũ, nên không mất tín hiệu.
- Hai mục Out of scope của hợp đồng giữ nguyên: thư mục `.partial` rỗng đã sinh trước vòng này không được dọn, và collector :9210
  đang chạy chỉ có sửa 2510-32 ở lần build và khởi động lại kế tiếp.
