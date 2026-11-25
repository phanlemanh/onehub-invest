---
schema_version: 1
feature: Suite pipeline của lượt chấm chạy trên cụm Postgres dùng một lần (DB trống chuẩn CI), ca dữ liệu thật tách thành suite kích hẹp, sao lưu bỏ DB thử của suite
slug: db-thu-tach-khoi-cum-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-25T03:59:22Z
design_doc: docs/superpowers/specs/2026-11-25-db-thu-tach-khoi-cum-that-design.md
---

# Acceptance Contract: db-thu-tach-khoi-cum-that

## Context

Hàng HT9 (audit 24/11 A7; GS mở rộng 25/11 thành đích phút giữ khoá s4). Số nền đo 25/11: trung vị giữ khoá s4 trên Mac mini
**99′** (15 lượt, p75 174′); hai nửa suite pipeline **69′** của một lượt T2 một tệp (HT12 r1: 46′ + 23′); 14 ca chạy trên bản
chép dữ liệu thật chiếm 84% thời gian đó; CI chạy cùng bộ trên DB trống trong 9′, bỏ đúng 30 ca của `scripts/ci-bo-qua.json`.
Cụm thật mang ~23 GB DB thử; `scripts/db-sao-luu.sh` sao lưu cả chúng.

## Acceptance Criteria

- **AC-1** Given lệnh `bash db/db-thu.sh oneinvest_suite_<bộ> --chay-trong <lệnh>`, When lệnh chạy, Then một container PostGIS
  riêng của lượt (ảnh của job pipeline trong `ci-test.yml`, tên mang pid) được dựng, DB trống dựng từ migration bằng
  `scripts/ci-db-init.mjs`, lệnh thấy `DATABASE_URL` trỏ container đó và `CI=true`; sau khi lệnh thoát — kể cả khi lượt bị
  TERM — container không còn (`docker ps -a`), cụm thật `one-invest-db` không có DB `oneinvest_suite_*` mới, và mã thoát của
  lượt bằng mã của lệnh. Đối chứng: bản sao bỏ bước xoá container → đỏ ghim «container còn sau lượt»; bản sao rơi về cụm thật
  → đỏ ghim «DB suite trong cụm thật». Điều kiện GS phán (25/11): tên container theo lượt, cổng chỉ nghe 127.0.0.1, không lệnh
  nào nhắm `one-invest-db`, container tự dọn ở trap EXIT kể cả khi bị TERM.
- **AC-2** Given `pipeline_a`, `pipeline_b` chạy qua `--chay-trong`, Then tập ca bị bỏ qua của hai nửa bằng đúng tập 30 ca
  pipeline của `ci-bo-qua.json` (so tên, bóc từ đầu ra chạy thật), mọi ca khác chạy, hai nửa thoát 0 trên cây của hàng, và tổng
  thời gian thật của hai lệnh suite — gồm dựng container, migration, chạy, xoá — ≤ 20′ (nền 69′ trên bản chép, HT12 r1).
- **AC-3** Given suite mới `pipeline_that`, When chạy trên bản chép (`db-thu.sh --chay`), Then nó chạy ĐÚNG 30 ca pipeline của
  `ci-bo-qua.json` và không ca nào khác; một mục danh sách trỏ ca không còn → đỏ gọi tên mục (không bỏ qua lặng).
- **AC-4** Given bảng vùng của `suite-neu-doi.mjs`, Then vùng của `pipeline_that` phủ mọi tệp mà tệp test của 30 ca nạp hay
  chạy (đồ thị import tĩnh + tệp chúng chạy bằng tiến trình con hoặc đọc SQL) — test canh phủ đỏ khi bỏ một tệp như vậy khỏi
  vùng; vùng không chứa `LO-TRINH.html`, `collector/src/**`, `docs/**`.
- **AC-5** Given ba nhánh giả, Then quyết định chạy/bỏ của `suite-neu-doi.mjs` đúng ma trận viết trước: chỉ đổi
  `collector/src/core/media-fetch.ts` → `pipeline_a`, `pipeline_b` chạy, `pipeline_that` bỏ; đổi một tệp transform mà ca dữ liệu
  thật chạy → cả ba chạy; chỉ đổi `_acceptance/` → cả ba chạy làm nền.
- **AC-6** Given `_acceptance/config.yaml`, Then `feature_loop.suite_keys` có `executors.suite.pipeline_that`, lệnh
  `executors.test.pipeline_a|b` trỏ `--chay-trong`, và `s4-args.mjs` sinh đủ tám lệnh suite (test canh khớp khoá).
- **AC-7** (đổi phạm vi sao lưu: DB thử của suite là bản chép dùng một lần, không phải dữ liệu — hôm nay ~11,9 GB trong ~23 GB
  DB thử) Given cụm có DB `oneinvest_suite_*` (kể cả `oneinvest_suite_mau`) cạnh DB khác, When `db-sao-luu.sh` chạy, Then bản
  sao lưu không chứa DB suite, manifest ghi một dòng «bỏ DB thử của suite: <tên>» cho mỗi DB bỏ, DB khác vẫn được sao lưu.
  Đối chứng: bản sao bỏ bộ lọc → đỏ ghim tên DB suite trong danh sách sao lưu.
- **AC-8** Given `su-kien.jsonl` của đợt, When `node scripts/do-phut-s4.mjs --tu <ISO> [--den <ISO>]` chạy, Then in số lượt,
  trung vị và p75 của **khoảng cấp s4** — phút từ một lần cấp s4 tới lần cấp (hoặc thu hồi) kế; nhật ký đợt không ghi lần
  nhả, nên đây là cận trên của phút giữ khoá, sát phút giữ khi hàng chờ không rỗng; trên mẫu rút từ tệp thật 23/11 12Z → 25/11
  03:11Z ra n=15, trung vị 99, p75 174; cửa sổ không có lượt nào → in n=0, không trung vị giả.
- **AC-9** Given hai lượt `--chay-trong` chạy cùng lúc, Then mỗi lượt có container và cổng riêng, cả hai thoát 0, không lượt nào
  thấy DB của lượt kia; lượt thứ ba khi đã có hai container sống thì chờ chỗ (trần chờ 15′, quá thì thoát 4 kèm dòng «đã đủ 2
  cụm dùng một lần»), không dựng container thứ ba.
- **AC-10** Given thư mục `ap-may-thu/`, Then README có đủ năm mục (lệnh áp · số chạy thử · sao lưu trước · cách lùi · lệnh
  kiểm sau) và lệnh kiểm sau in trung vị phút giữ khoá s4 của các lượt sau áp cạnh số nền 99′.
- **AC-11** Given lệnh một dòng `node scripts/pipeline-that-hang-ngay.mjs` chạy trên `main` (GS gọi ở nhịp đầu ngày, không
  plist), Then nó chạy `pipeline_that` trên bản chép, ghi kết quả vào sổ `.acceptance-runs/pipeline-that/lan-chay.jsonl` (ngày,
  sha, xanh/đỏ, tên ca đỏ) và in một dòng — đỏ thì dòng gọi tên ca; và mỗi lượt chấm, `suite-neu-doi.mjs` in một dòng «ca dữ liệu
  thật: chạy trong lượt này» hoặc «ca dữ liệu thật: không kích — lần xanh gần nhất trên main: <ngày> (<sha>)» (sổ trống →
  «chưa có lần xanh nào trên main»), dòng ấy vào đầu ra suite mà báo cáo bằng chứng chép. Đối chứng: sổ chỉ có lần đỏ → dòng
  không được in «lần xanh».

## Out of scope

- Cụm Postgres thường trực riêng cho bản chép dữ liệu thật (`pipeline_that` và DB thử của dãy vẫn chép trong cụm thật): dịch vụ
  nền mới cần lời riêng của Mạnh — hàng sau HT24.
- Suite `app`, `app_ui`, `agent` vẫn chạy trên bản chép như nay — hàng sau HT24 (cùng cách, sau khi có số của pipeline).
- (d) Dùng lại kết quả suite cho hai hồ sơ cùng một commit, và chấm song song nhiều khe s4: việc của kit và gói `dieu-phoi` —
  chỉ ghi đề xuất ở `de-xuat-kit.md`, không sửa bản chép kit trong kho.
- (c) Tên DB theo lượt: đã có từ hồ sơ test-suite-db-thu (đuôi pid).
- Xoá ~23 GB DB thử đang nằm trong cụm thật — ngoài phạm vi, vì xoá dữ liệu cần lời riêng của Mạnh; hàng này chỉ thôi sao lưu
  DB thử của suite (AC-7) và thôi tạo DB suite chuẩn-CI trong cụm thật (AC-1).
- Thẻ Cổng Bằng chứng của kit tự in dòng «ca dữ liệu thật»: thẻ là của kit; vòng này đưa dòng vào đầu ra suite (AC-11) để báo cáo
  bằng chứng chép, và ghi đề xuất cho kit ở `de-xuat-kit.md`.
- Không đổi tài nguyên Colima, không khởi động lại Docker/Colima/DB thật.

## Coverage

- Trục nơi DB của suite: cụm dùng một lần · bản chép trong cụm thật · Postgres của CI [thước CE: ba nhánh của
  `db-thu.sh --chay` hiện có + nhánh mới] — AC-1, AC-2, AC-3, AC-9.
- Trục tập ca: chuẩn-CI (trừ `ci-bo-qua`) · dữ liệu thật (đúng `ci-bo-qua`) · danh sách lệch [thước CE: `ci-bo-qua.json`
  pipeline 30 mục] — AC-2, AC-3.
- Trục kích suite: một tệp ngoài vùng thật · tệp trong vùng thật · chỉ hồ sơ [thước CE: ca ZC15/ZC16 `media-fetch.ts`, ca
  HT12 `scripts/`] — AC-4, AC-5.
- Trục kết cục lượt: thoát 0 · thoát lỗi · bị TERM · hai lượt song song [thước CE: các ca của `db-thu.test.mjs`] — AC-1, AC-9.
- Trục cổng và vận hành: suite_keys · sao lưu · đo đích · áp · soát dữ liệu thật hằng ngày [thước CE: `s4-args.mjs` đọc
  suite_keys; `db-sao-luu.sh` liệt DB] — AC-6, AC-7, AC-8, AC-10, AC-11.
- Trục trần cụm dùng một lần: một · hai cùng lúc · lượt thứ ba chờ / quá trần [thước CE: GS phán trần 2] — AC-9.

## Đường đo

Hàng nền gỡ nút cổ chai (không ô cơ hội — GS phán U1-147). Con số trên màn: trung vị khoảng cấp s4 (cận trên phút giữ khoá) trong `su-kien.jsonl`
của đợt, nền 99′ (23/11 12Z → 25/11 03Z, n=15). Trong vòng: AC-2 đo tổng thời lượng hai nửa pipeline trên cụm dùng một lần
(≤ 20′, nền 69′). Sau áp:
lệnh kiểm sau ở `ap-may-thu/README.md` (AC-10) đo trung vị các lượt mới.

## Notes

- Số nền để đo lại sau áp: trung vị khoảng cấp s4 99′, p75 174′ (n=15, 23/11 12Z → 25/11 03:11Z); hai nửa pipeline 69′ (HT12 r1)
  → đích ≤ 20′.
- Số nền đo bằng chính `do-phut-s4.mjs` khi viết xong (AC-8); số trong Context là phép tính cùng luật chạy tay 25/11 03:5xZ.
