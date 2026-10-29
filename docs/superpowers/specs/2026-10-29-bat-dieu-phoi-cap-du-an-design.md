# bat-dieu-phoi-cap-du-an — bật gói dieu-phoi ở cấp kho

Hàng P3 của đợt dieu-phoi-dot0-cam-mau (Mạnh «Duyệt cả 8», 29/10). Hạng T3: `.claude/settings.json` nằm trong
`risk_tiers.t3_paths` («rào chắn máy») — giám sát xác nhận ở P3-108, luật kho thắng chữ «T1» trong ý định.

## Vấn đề

Chẩn đoán đợt báo «hook-phien thiếu»: phiên mở trong kho mà máy chưa bật gói `dieu-phoi` ở phạm vi user thì hook của
gói không bắn (không ghi tệp sống, không chặn lượt S4). `.claude/settings.json` của kho bật bốn gói kit
(`acceptance-gate`, `feature-loop`, `diagram-design`, `road-map`) nhưng thiếu `dieu-phoi`; máy này chỉ có nó ở phạm vi
user (`~/.claude/settings.json`).

## Cách sửa

- Thêm đúng một khoá `"dieu-phoi@acceptance-gate-kit": true` vào `enabledPlugins` của `.claude/settings.json`, ngay sau
  `road-map@acceptance-gate-kit`. Nguồn marketplace `acceptance-gate-kit` (github `phanlemanh/acceptance-gate-kit`) đã
  khai ở `extraKnownMarketplaces` — không thêm nguồn mới.
- Không đổi quyền, hook, khoá nào khác; không đổi `~/.claude/settings.json` (phạm vi user dùng chung).
- Thước: `_acceptance/bat-dieu-phoi-cap-du-an/probes/settings.mjs` so tệp với nền cố định `0103d246` (đỉnh main lúc cắt
  nhánh — không dùng merge-base, xem hồ sơ `m2-ac10-so-cap-co-dinh`), tự chứa cặp đỏ trên cùng dữ liệu, và kiểm phạm vi
  diff. Chạy qua khoá `executors.script.bdp_settings` (một dòng thêm vào `_acceptance/config.yaml`, xin ở P3-109).

## Không làm

- Hiệu lực trên một phiên MỚI (chẩn đoán `hook-phien du`) không đo được bằng máy ở đây: máy này đã bật `dieu-phoi` ở
  phạm vi user nên phiên nào cũng có hook dù kho có khoá hay không — phép đo không phân biệt. Người kiểm ở Cổng Bằng
  chứng bằng một phiên mới trên máy chưa bật ở phạm vi user, hoặc ghi giới hạn.
- Không sửa `scripts/check-lo-trinh.sh`: ca 1 của nó (E1 của hồ sơ đã ký `lo-trinh-2310`) so `settings.json` với
  merge-base và chỉ tha `road-map`, nên ĐỎ trên nhánh này (đo 29/10) và tự xanh sau khi gộp. Lệnh ấy không ở CI hay
  `feature_loop.suite_keys`, và hai ca «răng phủ» của nó đã đỏ sẵn trên main. Sửa là hồ sơ riêng (ngoài vùng hàng).
