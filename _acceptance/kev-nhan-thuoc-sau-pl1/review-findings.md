# Review findings: kev-nhan-thuoc-sau-pl1 (round 1)

Phạm vi đọc: `git diff origin/main...HEAD` (merge-base `432d7ca7`) gồm `scripts/kev-nhan/acceptance.mjs` (+5/−2), hai probe, hợp đồng,
evals, dòng revisit của `kev-thanh-nhan` và tệp máy sinh. Đọc thêm `pipeline/import-airbnb.mjs` (`SNAPSHOT_TS_RE`, nhánh bỏ thư mục
sai khuôn, thông báo `schemaVersion … chưa hỗ trợ`), `collector/openclaw/handler.js` hiện hành và bản trước ZC6 (`bd51084d^`).
Phiên chấm không viết mã này và không sửa tệp sản phẩm hay harness.

## Trong hợp đồng

(không có finding nào map được vào AC. E1–E6 đều đạt, xem evidence-report.md)

Đã soát và KHÔNG thấy thước bị nới ở các đường sau:
- **Tên thư mục giả mới.** `hanoi__zalo-agent__2026-10-23T000000-<v>` khớp `SNAPSHOT_TS_RE`
  (`^\d{4}-\d{2}-\d{2}T\d{6}(\d{3})?(-\d+)?Z?$`) nhờ nhánh hậu tố `(-[0-9]+)?`, nên cả bốn bản đều tới bước kiểm phiên bản. Ca
  should-NOT-fire v4 vẫn còn: thước đòi `schemaVersion \d+ chưa hỗ trợ` có mặt, `manifest ok:` vắng mặt và mã thoát khác không. Bị
  bỏ vì sai khuôn thì không có chữ «chưa hỗ trợ», nên ca v4 không thể xanh nhờ nhánh bỏ qua. Bốn thư mục nằm trong `mkdtemp` riêng,
  nên mốc cố định không đụng nhau giữa các lượt.
- **Regex log mới.** `/kev null \(timeout\/gate\)|gate-down/` chỉ áp lên log của lượt Kev chết (một tin). Trong handler hiện hành,
  dòng duy nhất chứa «kev null» là dòng 221 (`if (p === null)`). Dòng `post …` ghi `p=null` chứ không ghi «kev null». Handler im lặng
  về Kev hỏng thì regex không khớp. Vế `gate-down` là nhánh chết: handler hiện hành không còn chuỗi này.
- **Phạm vi sửa.** `fixtureSnapshot` chỉ có `modeImportVersions` gọi, và `runHandler(...{kevDown})` chỉ có `modeHandlerLabel` gọi. Bốn
  mode của E4 có mã giống hệt bản ở merge-base.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Log hook Zalo không còn phân biệt Kev chết với Kev trả lỗi, và không ghi nguyên nhân**
  Người dùng thấy gì: Không thấy gì trên cổng. Người vận hành đọc `~/.openclaw/logs/oneinvest-zalo-pipe.log` thấy cùng một dòng
  «kev null (timeout/gate)» dù Kev không nghe cổng, trả 500 hay trả JSON thiếu `noul`. Dòng này không kèm thông điệp lỗi, nên không
  biết vì sao Kev hỏng nếu chỉ đọc log.
  Căn cứ: Trước ZC6 (`bd51084d^`, dòng 115) nhánh fetch Kev ném lỗi ghi `gate-down (đẩy chưa phân loại) ${e.message}`. Từ ZC6, handler
  chỉ còn dòng 221 `if (p === null) await log("kev null (timeout/gate) …")`, áp cho mọi p = null. Vì vậy E2 chỉ chứng được «log ghi Kev
  không cho điểm», chưa chứng được «log ghi Kev không nghe». Thước theo chữ đang chạy đúng như AC-2 và Out of scope đã khai (không sửa
  handler, T3).
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits
