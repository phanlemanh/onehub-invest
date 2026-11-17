# Thiết kế — suite scripts vào lượt chấm, chọn test theo từng tệp

Hồ sơ: `_acceptance/suite-scripts-vao-luot-cham/` · T2 · dãy P3 · giám sát quyết hướng 17/11.

## Vấn đề

Ba PR đã ký đỏ ở ô CI `scripts` **sau** chữ ký: #471 (`s05-khoa-nap`), #472 (`db-thu` DT-AC-7), và
`toa-s09-hai-khu-vao-danh-ba` (`ops-local-dong-bang` DBS-AC-6). Nguyên nhân chung: `feature_loop.suite_keys` không có bộ
`scripts/*.test.mjs`, nên lượt chấm S4 và lượt ghim lại không chạy lưới mà CI chạy. Lỗi chỉ lộ ra ở CI, sau khi người đã ký.

## Hai phát hiện đo trên kho (17/11, main e03a0215)

1. **Vùng cả-suite là gần như cả kho.** Bộ quét S4V-AC-5 trên module `scripts`: 279 đường ngoài `scripts/`, 14 thư mục gốc.
   Bọc cả suite bằng `suite-neu-doi` thì gần như không bao giờ bỏ qua → mỗi lượt chấm thêm trọn bộ (đo cũ: 623″ máy yên,
   940″ khi có lượt khác). Khoá s4 là chỗ nghẽn của đợt, nên lối này đắt hơn hai lần đỏ.
2. **Lệnh phải theo CI.** Job `scripts` của `ci-test.yml`: `node --check` mọi `scripts/**/*.mjs`, DB trống dựng từ
   migration (`scripts/ci-db-init.mjs`), `NODE_OPTIONS` từ `scripts/lib/ci-can-du-lieu.mjs` khi `CI=true` (bỏ ca cần dữ
   liệu thật theo `ci-bo-qua.json`), rồi `node --test`. `executors.test.scripts` thì chạy trơn trên DB máy thu, không bỏ
   ca nào — chính lối ấy từng làm đỏ giả E8 của s4-suite-theo-vung vòng 2 (KDM-AC-3 đỏ do dữ liệu).

## Hướng (giám sát quyết)

- **Lệnh** theo đúng chuỗi bước của job CI `scripts`. `executors.test.scripts` giữ nguyên byte.
- **Chọn theo từng tệp**: mỗi `scripts/*.test.mjs` có một tập đọc (bộ quét S4V-AC-5, mở rộng mục dưới); tệp được chọn khi
  tập đọc của nó chạm diff của nhánh so với main.
- **Ba rào an toàn**: (a) tệp test mà tập đọc không xác định được (đọc kho động) → luôn chạy; (b) diff chạm
  `scripts/lib/**` hay `db/migrations/**` → chạy trọn bộ; (c) `node --check` luôn chạy.
- **Bảo thủ** như `suite-neu-doi`: không xác định được diff → trọn bộ; tệp test nằm trong diff → được chọn.

## Hai ca đỏ thật đều do RÀO bắt

| Lần đỏ | Diff của nhánh | Ca đỏ | Ai bắt |
|---|---|---|---|
| #472 @f3fecd5f | `app/src/**` (registry) + tài liệu | DT-AC-7, `scripts/db-thu.test.mjs` | rào (a): db-thu quét động mọi tệp test của ba bộ |
| #471 @5b02c3de (cha của 8d5b75b1) | `scripts/lib/job-step.sh`, … | ca (5), `scripts/s05-khoa-nap.test.mjs` | rào (b): chạm `scripts/lib/**` |

Nên bộ phát hiện đọc động là phần chịu lực: đếm thô chữ `readdirSync` ra 13/43 tệp, nhưng 5 tệp chỉ đọc thư mục tạm hay
HOME giả. Phân loại theo **gốc** của lời đọc:

| Loại | Tệp | Xử lý |
|---|---|---|
| Đọc kho, đoạn đường là biến hoặc `git ls-files` | db-thu, design-floor-vung, don-hex-tho, ops-local-dong-bang, s05-slo, suite-neu-doi, zalo-import-job (7) | luôn chạy |
| Đọc kho, đường literal | ci-test-module (`db/migrations`) | tập đọc xác định — và đã có rào (b) |
| Đọc thư mục tạm / HOME giả | bo-worktree, install-cron-chi, job-step-thoi-luong, sao-luu-ngoai-may, ui-capture-login (5) | không tính là đọc kho |

Giá cố định mỗi lượt của tập luôn chạy (7 tệp + `node --check`), đo 17/11 04:59Z: **≈ 23 giây** (db-thu 8,6″,
suite-neu-doi 6,1″, node --check 3,6″, zalo-import-job 3,6″, bốn tệp còn lại 1,0″) — xa dưới ngưỡng 5 phút giám sát đặt.

## Lỗ của bộ quét khi chọn theo từng tệp: chủ thể cùng thư mục

Test hay gọi chủ thể bằng `path.join(HERE, "x.sh")`: chuỗi trần `"x.sh"` không có `./`, bộ quét S4V-AC-5 không nhận.
Đếm trên kho: 15 tệp test có chủ thể cùng thân tên, bộ quét nhận ra chủ thể ở **12**; lọt `cap-token-may`,
`dung-worktree-cham`, `sao-luu-ngoai-may`. Chọn theo từng tệp mà không vá thì sửa `scripts/x.sh` không kéo `x.test.mjs`.
Luật thêm: một chuỗi literal không có `/` mà trùng tên một tệp có thật **cùng thư mục** với tệp đang quét thì tính là đọc.
Tham chiếu cùng thư mục vốn nằm trong module, nên luật không đổi kết quả của S4V-AC-5.

## Chỗ đặt mã

Bộ quét (`thamChieu`, `quetNgoai`) dời từ `scripts/suite-neu-doi.test.mjs` sang `scripts/suite-neu-doi.mjs` và export —
một nguồn cho cả thước AC-5 lẫn bộ chọn. Bộ chọn từng tệp, bộ phát hiện đọc động và ba rào cũng ở `suite-neu-doi.mjs`.
`_acceptance/config.yaml` thêm `executors.suite.scripts` và key thứ tám vào `suite_keys`. S4V-AC-6 và probe
`cau-hinh-khong-doi.sh` của hồ sơ s4-suite-theo-vung sửa bảy → tám trong cùng commit (giám sát cho, 17/11).

## Cách chạy chuỗi bước CI — chốt ở S1

Chạy bốn bước tại chỗ trên **một DB trống dựng mới trong cùng server :5433**, dùng chung cho cả tập chọn của một lượt,
xoá khi xong. Kiểm 17/11: DB máy thu chạy ảnh `kartoza/postgis:17-3.5` — đúng ảnh `services` của job `scripts`; Node máy
`v24.21.0`, job khai `"24"`. Lệch còn lại là kiến trúc (arm64 máy, amd64 runner), và `scripts/ci-test-local.mjs` cũng lệch
đúng như vậy (đầu tệp nó tự ghi). Còn `ci-test-local --job scripts` thêm một chi phí cố định mỗi lượt — clone sạch rồi
`npm ci` app, pipeline, agent — không phụ thuộc số tệp chọn, đi ngược đúng mục đích chọn từng tệp. AC-1 đo tương đương
trên từng phần tử của job và trên đầu ra thật (DB nối tới là DB vừa dựng, danh sách ca bỏ khớp `ci-bo-qua.json`).

## Bao đóng và rào hạ tầng (sau phản biện context sạch)

- Tập đọc là **bao đóng**: tệp mã được nhắc bằng literal (kể cả tên trần cùng thư mục) được thêm và quét tiếp, không chỉ
  theo cạnh `import`. Ca mẫu `a.test.mjs → x.sh → pipeline/y.mjs`.
- Đọc động nhận thêm: `execSync` chạy `find`/`grep`/`git`, template literal có biểu thức, `import()` không literal. Ma trận
  43 tệp của AC-3 đọc tay trước mã, không sinh từ bộ phát hiện — tránh thước vòng tròn.
- Rào trọn bộ phủ cả hạ tầng của chính chuỗi bước CI: `scripts/ci-db-init.mjs`, `scripts/ci-bo-qua.json`,
  `.github/workflows/ci-test.yml`, `package.json`/`package-lock.json` của app, pipeline, agent.

## Ngoài phạm vi

Tối ưu tệp test nặng (giám sát xét riêng nếu cần); chọn theo từng ca trong một tệp; sửa kit (`repin-lane.mjs`,
`s4-args.mjs`) hay workflow CI; đổi vùng của bảy suite cũ.
