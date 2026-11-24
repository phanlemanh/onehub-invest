---
schema_version: 1
feature: Hook nhận tin S03 thôi gọi cổng chấm Kev; watchdog thôi canh :8009; gỡ plist cổng chấm khỏi kho (KEV1, phần làn thu của KV1)
slug: go-kev-khoi-hook-s03
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config]
status: approved
approved_by: Mạnh
approved_at: 2026-11-24T10:10:07Z
design_doc: docs/superpowers/specs/2026-11-24-go-kev-khoi-hook-s03-design.md
---

# Acceptance Contract: go-kev-khoi-hook-s03

## Context

Hàng KEV1 (dãy ZT), mở từ hàng KV1 `go-kev-khoi-hook` của lộ trình, phạm vi hẹp theo lời GS (ZT-4, 24/11): phần làn thu.
Mạnh chốt bỏ Kev 15/11 (ROADMAP §3 mục 52); máy thu Mac mini không còn dịch vụ Kev. Hook `oneinvest-zalo-pipe` vẫn gọi
`:8009` cho mỗi bài và ghi một dòng «kev null» cho mỗi bài (24/11, ngày VN: 4.954 dòng cạnh 5.103 dòng `post 202`); watchdog
5′ ghi «kev:DOWN» kèm WARN và thông báo macOS mỗi nhịp.

Nguồn mã: nhánh làn thu `zcode/k1-hook-khong-kev` @4016cf222 (ZCode, LL soát đạt 24/11), gộp nguyên vào nhánh hồ sơ.
Hook bỏ hẳn lời gọi cổng chấm; tin vẫn POST `:9210/agent-report` với `kev = {p: null, model: "kev-off", threshold: 0.9, at}`
(giữ khuôn trường, không đổi DATA-CONTRACT); dòng log `post <status> <body> group=… kev=off …`. Watchdog gỡ khối canh `:8009`,
nhịp ghi `kev:off (K1)`. Xoá `pipeline/cron/com.oneinvest.kev-gate.plist`. Bốn kiểm nghiệm thu cũ (`kev_handler_label`,
`zc6_spool_replay`, `zc6_kev_hang`) đổi sang khuôn kev-off. Hồ sơ thêm chốt tĩnh có tự phá cho watchdog/plist/tài liệu (lỗ
LL nêu: gỡ khối canh không có test canh) và bộ kiểm sau áp cho máy thu.

## Acceptance Criteria

- AC-1: Given hook nhận một tin có chữ của kênh zalouser và cổng chấm giả ĐANG SỐNG ở `ONEINVEST_KEV_URL`, When hook xử lý
  tin, Then cổng chấm nhận 0 yêu cầu và tin vẫn được POST đúng một lần tới cổng thu; cổng chấm đóng hẳn thì cũng vậy.
- AC-2: Given hook đẩy tin tới cổng thu, When collector giả nhận POST, Then đường là `/agent-report` với khoá đọc từ HOME,
  `agent_id` và `messages[0]` đủ các trường cũ, `kev` đủ bốn trường với `p = null`, `model = "kev-off"`, `threshold = 0.9`,
  `at` là thời điểm ISO; tin có điểm cao hay thấp đều không bị bỏ.
- AC-3: Given hook đẩy xong một tin, When đọc log hook, Then dòng ghi giữ khuôn `post <status> <body60>` có `group=` mà các
  bên đọc log đang dùng, mang `kev=off`, và log không còn dòng «kev null» hay `skip p=`.
- AC-4: Given các ca bảo vệ hook đã ký trước (spool rồi phát lại, collector trả 4xx, collector treo, trần 50 tệp spool, khoá
  giữ khi lỗi xác thực, trần thời gian, lỗi tạm thời), When chạy lại trên hook không Kev, Then mọi ca vẫn đạt và hook vẫn chạy
  tự đủ (không import ngoài) và qua kiểm L1 (không API gửi tin).
- AC-5: Given watchdog `scripts/zalo-watchdog.sh` của nhánh, When soát tĩnh, Then không còn lời gọi, cảnh báo hay thông báo
  nào về `:8009`, nhịp «ok — …» ghi `kev:off (K1)`, cú pháp bash hợp lệ, và lớp L1 vẫn bắt một handler có API gửi tin;
  chèn lại khối canh `:8009` vào bản chép thì chốt đỏ với thông điệp ghim.
- AC-6: Given thư mục `pipeline/cron/`, When soát, Then không còn `com.oneinvest.kev-gate.plist`, không plist nào trỏ cổng
  chấm, và bộ test job (`scripts/job-exit.test.mjs`) vẫn xanh.
- AC-7: Given tin mang `kev` khuôn kev-off, When collector ghi snapshot và bộ nạp đọc nó, Then manifest v3 giữ nguyên `meta.kev`
  bộ test collector cùng hai nửa bộ test pipeline xanh, và không tệp nào trong `pipeline/` đọc hay lọc theo `kev.p`,
  `kev.model` (cấy một điều kiện lọc vào bản chép thì chốt đỏ).
- AC-8: Given tài liệu hook (`collector/openclaw/HOOK.md`, `README.md`) và `docs/ops/runtime-map.md`, When soát, Then không còn
  mô tả đường tin đi qua Kev hay hạ tầng `Kev :8009`; chèn lại câu ấy vào bản chép thì chốt đỏ.
- AC-9: Given hồ sơ áp lên máy thu `ap-may-thu/README.md`, When người ký Cổng Bằng chứng đọc, Then có đủ năm mục (lệnh áp ·
  số chạy thử · sao lưu trước · cách lùi · lệnh kiểm sau), có dòng khởi động lại gateway kèm «lời riêng của Mạnh» và khung giờ
  cấm áp; mỗi mục có lệnh hay con số thật; và `kiem-sau.sh` chấm đúng tám bộ log mẫu (một ĐẠT, bảy KHÔNG ĐẠT đúng lý do, gồm
  lớp lockdown vỡ) cùng log sinh từ writer thật: hook + watchdog của nhánh → ĐẠT, của main (còn Kev) → KHÔNG ĐẠT đúng lý do.
- AC-10: Given bộ test của hook (`collector/openclaw/handler.test.mjs`) chạy trên máy thu có `~/.openclaw` thật, When chạy
  bộ, Then hook trong bộ dùng HOME và spool tạm đặt trước khi import — không ghi log, không đọc khoá, không rút spool trong
  `~/.openclaw` thật (cỡ log hook thật không đổi qua một lượt); bỏ dòng gán HOME tạm thì bộ dừng trước khi import với thông
  điệp ghim «HOME tạm không có hiệu lực».

## Out of scope

- Lớp «Cổng Kev :8009» trên `/ops/collections` (`app/src/lib/collections-queries.ts`, `ops-queries.ts`, `ops-cloud.ts`),
  `scripts/lib/ops-local.mjs`, job «kev» trong `pipeline/push-ops-facts.mjs`, FAIL `:8009` của `scripts/audit-all.sh` — ngoài
  phạm vi, vì là hàng KEV2 (`bo-lop-kev-o-ops-va-audit`) của dãy U1 theo lời phán GS.
- Chép hook vào `~/.openclaw`, khởi động lại gateway, đo trên máy thu — ngoài phạm vi vòng code, vì là bước triển khai sau gộp
  do phiên ZCode vận hành làm theo `ap-may-thu/README.md` (cần lời riêng của Mạnh).
- Watchdog L1 chỉ soát bản hook trong kho, không soát bản đã cài trong `~/.openclaw/hooks/` — ngoài phạm vi, vì là lỗ cũ có
  trước K1 (LL ghi «việc riêng sau K1»); hai bản hôm nay giống hệt.
- Nhắc `:8009` trong `agent/README.md`, `pipeline/scripts/bench-gate.mjs` — ngoài phạm vi, vì không nằm trên đường chạy (tài
  liệu và công cụ đo cũ), không ai gọi định kỳ.
- Bỏ hẳn trường `kev` khỏi tin — ngoài phạm vi, vì đổi DATA-CONTRACT phải tăng `schemaVersion` (luật 4) và kéo theo bộ nạp.

## Coverage

- Trục trạng thái cổng chấm: sống · đóng hẳn · trả 500 · treo [thước CE: bốn nhánh của `kevScore()` cũ] — AC-1, AC-3, AC-4
  (kev-hang). Sau K1 cả bốn cùng một hành vi: không gọi.
- Trục đường đi của tin tới cổng thu: 202 · 4xx · treo · spool đầy · lỗi xác thực · lỗi tạm · quá trần thời gian [thước CE: các
  mode của `scripts/hook-zalo-spool` và `scripts/hook-spool-nghiem-ngat`] — AC-2, AC-4.
- Trục người đọc đầu ra của hook: collector `/agent-report` (khuôn tin) · bộ nạp (manifest `meta.kev`) · các bên đọc dòng log
  `post <status>` · watchdog L1 (đọc mã hook) [thước CE: «5 nơi đọc» ghi trong `handler.js`] — AC-2, AC-3, AC-4, AC-7.
- Trục bề mặt còn nhắc Kev: mã hook · watchdog · plist · tài liệu hook và runtime-map · Ops/audit/push-ops-facts (ngoài phạm
  vi, KEV2) [thước CE: `git grep -e 8009 -e kev-gate`] — AC-1, AC-5, AC-6, AC-8.
- Trục áp lên máy thu: trước (sao lưu) · làm (chép + khởi động lại) · kiểm sau · lùi [thước CE: checklist LL 24/11] — AC-9.
- Trục nơi phép đo chạy: hộp cát HOME tạm · HOME thật của máy thu [thước CE: phát hiện 24/11, 99 dòng giả trong log hook thật] — AC-10.

## Đường đo

Không có người dùng cuối (ô cơ hội khai «Không đo được»). Con số trên máy thu sau áp: dòng «kev null» mới trong log hook = 0
(24/11: 4.954/ngày), dòng `post 202 … kev=off` có và cùng bậc lượng bài (24/11: 5.103/ngày), nhịp watchdog «kev:off (K1)»,
0 cảnh báo Kev mới. Đo bằng `ap-may-thu/kiem-sau.sh` theo `ap-may-thu/README.md` mục 5 (AC-9 bảo đảm bộ kiểm).

## Notes

- Mã hook, watchdog, plist, tài liệu, kiểm nghiệm thu cũ: ZCode viết (claudedp-2111-9 + 2311-1), LL soát; đột biến LL: chèn lại
  lời gọi `:8009` → handler.test 4/5 + handler-label FAIL. Vòng này thêm `probes/khong-con-kev.sh` (10 ca tự phá) và `ap-may-thu/` (README năm mục, `kiem-sau.sh`, round-trip writer thật).
- Sửa tích hợp (vòng này): `collector/openclaw/handler.test.mjs` của nhánh ZCode import hook với HOME THẬT — mỗi lần chạy ghi dòng
  «post 202 … kev=off» giả vào log hook thật (99 dòng `group=t1|conv-*|c` từ 21/11, KHÔNG xoá — không chạm `~/.openclaw`), đọc khoá
  thật, và rút spool thật bằng fetch giả. Nay HOME + spool tạm đặt trước import, có chốt ném lỗi và ca cô-lập. Đã báo GS/LL.
