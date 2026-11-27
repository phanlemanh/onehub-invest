# Bản sao job `scripts` của CI — NK1 (22/11)

## Vì sao có tệp này

PR #522, đầu nhánh `bb73f37da`, đỏ ở job `scripts` của CI. Giám sát đọc log CI lúc 07:52Z 22/11. Lượt chấm S4 và lượt ghim
lại không bắt được lỗi, vì cả hai chạy trên bản chép DB thử `oneinvest_suite_*`, còn CI chạy trên DB trống mang đúng tên
`oneinvest`. Có hai lỗi:

1. `scripts/so-nguon-kho.test.mjs` có rào tên DB, từ chối áp 122 lên DB tên `oneinvest`. Rào nằm ở móc `before` gốc của tệp,
   nên khi rào ném, mọi ca trong tệp đều bị huỷ, kể cả các ca thuần chạy trên client giả.
2. `scripts/bao-cao-ngay.test.mjs` gọi `ap122NeuThieu` ngoài try/finally. Trên DB thiếu cột 122 mà không phải bản chép thử,
   hàm ném lỗi, `client.end()` không chạy, và lượt test treo. Đây là mục «ghi sau chữ ký» trong `review-findings.md`.
   Ca `ON12-AC-7` trong `app/tests/ops-nhan-theo-context.test.tsx` cũng có cùng lỗi.

## Sửa (commit `4805a1461`)

- Móc DB chuyển vào trong khối `NK-AC-1 migration 122`. Dưới `CI=true`, gặp DB tên `oneinvest` thì móc đóng client và bỏ qua
  bốn ca của khối. Bốn ca này được khai trong `scripts/ci-bo-qua.json`, đúng cơ chế AU11-AC-4.
- Ngoài CI, rào giữ nguyên: DB tên `oneinvest` vẫn ném «không áp 122 lên DB chung». Ở tệp này rào không nới, và không đường nào
  áp 122 lên DB tên `oneinvest`.
- Hai lời gọi `ap122NeuThieu` nói ở mục 2 chuyển vào trong `try`, nên `finally` luôn đóng client.

## Đo

| Lệnh | Kết quả |
|---|---|
| `node scripts/ci-test-local.mjs --job scripts` (AU11: rút đúng các bước `run:` của `ci-test.yml`; PostGIS tạm và node chạy trong docker; DB trống tên `oneinvest`; `CI=true`; bản clone sạch của commit `4805a1461`; không chạm DB máy thu ở cổng 5433) | `ok job scripts: exit 0 · 208s · test 592/605 · bỏ qua 17`; tập ca bỏ qua khớp `scripts/ci-bo-qua.json` (17 ca); `ci-test-local sach: PASS` |
| `CI=true NODE_OPTIONS="$(CI=true node scripts/lib/ci-can-du-lieu.mjs scripts)" node --test scripts/so-nguon-kho.test.mjs`, trên DB tên `oneinvest` (chỉ đọc `current_database()`) | 5/5 ca thuần qua, 4 ca được lọc, exit 0 |
| `node --test scripts/so-nguon-kho.test.mjs`, không CI, trên DB tên `oneinvest` | rào ném, exit 1 (chiều đỏ giữ nguyên); 5 ca thuần vẫn qua |
| `bash db/db-thu.sh oneinvest_suite_nk --chay node --test --test-concurrency=1 scripts/so-nguon-kho.test.mjs scripts/check-freshness.test.mjs scripts/freshness-parity.test.mjs` (lệnh của E1) | 87/87 ca qua |
| `node --test scripts/bao-cao-ngay.test.mjs` trên DB máy thu chưa áp 122 | đỏ ngay, 0 giây (`từ chối áp 122 vào DB «oneinvest»`); trước bản sửa lượt này treo 43 phút |

Giới hạn còn lại so với CI thật: máy chạy arm64, còn runner của CI là amd64 (AU11 AC-8).

## Lệnh kiểm

Trước mỗi lần đẩy NK1, chạy `node scripts/ci-test-local.mjs --job scripts`; lệnh này phải ra `PASS`. Kho đã có lệnh này trong
`_acceptance/config.yaml` (`executors.script.ci_local`).

Em không thêm nó thành một eval mới trong `evals.yaml`, vì tệp đó thuộc bộ tiêu chí Mạnh đã ký ở Cổng Bằng chứng ngày 22/11.
Thêm eval là đổi vật đã ký, phải có lời của Mạnh.

## Phạm vi (E8)

`scripts/ci-bo-qua.json` là tệp mới chạm, nằm ngoài danh sách cho phép mà `probes/pham-vi.sh` viết trước. Bản sửa không thể né
tệp này: `ci-test-local` đối chiếu số ca bị bỏ qua với danh sách trong tệp, nên chỉ bỏ qua ngay trong tệp test thì lệch đếm và
job đỏ. Vì vậy:

- đã khai thêm tệp vào vùng của hàng: `dieu-phoi.mjs hang vung so-nguon-kho-khai-bao --vung 'scripts/ci-bo-qua.json'`;
- đã thêm đúng một mục vào danh sách cho phép của E8.

Phép đo E8 không đổi cách đo. Tự kiểm vẫn đỏ với tệp ngoài vùng.
