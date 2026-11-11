---
schema_version: 1
feature: Lệnh tạm dừng có hẹn bật lại sai kiểu không còn làm kẹt hàng lệnh, job ops-apply tìm được node dưới launchd, và token máy cấp được từ máy thu qua Management API
slug: so-lenh-sua-sau-tv4
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: không tệp nào khớp t3_paths (pipeline/lib, app/src/lib, pipeline/cron, scripts/cap-token-may, docs)
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-11
design_doc: docs/superpowers/specs/2026-11-11-so-lenh-sua-sau-tv4-design.md
---

# Acceptance Contract: so-lenh-sua-sau-tv4

## Context

Hàng sửa sau TV4 (`so-lenh-bo-ap`, PR #414 đã gộp 11/11), dãy P4, xếp trước TV4b. Gom ba chỗ hỏng:
- Ngoài-4 của Cổng Bằng chứng TV4: `resume_when` sai kiểu làm bộ áp ném lỗi và kẹt hàng lệnh. Mạnh chọn «mở hợp đồng
  mới».
- Ngoài-2 của Cổng Bằng chứng TV4: plist `ops-apply` không tìm thấy node dưới launchd. Mạnh chọn «mở hợp đồng mới».
- Triển khai TV4 ngày 11/11: `scripts/cap-token-may.mjs` không nối được Postgres cloud từ máy thu, phải cấp token tay
  qua Management API, và token chép tay dính vào dòng trước trong `cloud.env`.

Căn cứ: `_acceptance/so-lenh-bo-ap/review-findings.md` (Ngoài-2, Ngoài-4), `_acceptance/so-lenh-bo-ap/decisions.jsonl`
d-20261110T231814Z-28 và -30, ADR-0015 §2 (token máy chỉ lưu băm).

## Acceptance Criteria

- **AC-1** Given lệnh `source.pause` target `S05`, `reason` hợp lệ, When `kiemLenh` của `pipeline/lib/lenh.mjs` kiểm với
  `resume_when` lần lượt là số `5`, `true`, đối tượng `{}`, mảng `[]`, Then mỗi lần trả
  `{ok:false, ly_do:"resume-when-sai-khuon"}`; với `resume_when` vắng, `null`, `""`, `"  "`, `"khi hết hạn mức"` thì
  trả `{ok:true}`.
- **AC-2** Given cùng ma trận của AC-1 cộng ma trận 35 ô của TV4, When chạy bản TS `app/src/lib/lenh.ts` và bản `.mjs`,
  Then hai bản trả giống hệt nhau trên mọi ô.
- **AC-3** Given lệnh `source.pause` có `resume_when: 5` đã nằm trong hàng (vượt qua kiểm cloud trước bản sửa) và một
  lệnh hợp lệ xếp sau nó, When `apLenh` áp lần lượt hai lệnh trên DB thử, Then lệnh đầu cho outcome `failed`,
  `ly_do: "resume-when-sai-khuon"`, `source_registry` của nguồn không đổi, sổ áp có đúng một dòng; lệnh sau cho
  `applied`; `apLenh` không ném.
- **AC-4** Given cloud giả trả [lệnh `resume_when: 5`, lệnh hợp lệ], When `ops-apply.mjs` chạy hai lượt liên tiếp với
  token thử trên DB thử, Then lượt một thoát 0 và báo hai kết quả; lượt hai không áp lại lệnh nào (sổ áp vẫn hai dòng),
  không ném.
- **AC-5** (cross-layer) Given lời gọi `POST /api/v1/ops/change-requests` của vai `ops` với `source.pause` có
  `resume_when: 5`, When route xử lý, Then trả 400 với `ly_do: "resume-when-sai-khuon"`, số dòng `change_requests` và
  `ops_audit` không đổi.
- **AC-6** Given plist `pipeline/cron/com.oneinvest.ops-apply.plist`, When đọc, Then không còn `/usr/bin/env`;
  `ProgramArguments[0]` là chỗ giữ `__NODE__`, `ProgramArguments[1]` là `__ROOT__/pipeline/ops-apply.mjs`.
- **AC-7** Given dòng lệnh cài plist trong `docs/ops/runtime-map.md` (đúng một dòng mang `com.oneinvest.ops-apply.plist`
  và `__NODE__`), When chạy dòng đó vào thư mục tạm thay cho `~/Library/LaunchAgents`, Then plist sinh ra qua
  `plutil -lint`; `ProgramArguments[0]` là đường tuyệt đối tới một tệp thực thi; chạy
  `env -i PATH=/usr/bin:/bin:/usr/sbin:/sbin <ProgramArguments[0]> -v` thoát 0; không còn `__NODE__` hay `__ROOT__`.
  Dòng cài không chứa `launchctl`, và chạy nó trong phép đo không chạm `~/Library/LaunchAgents` thật.
- **AC-8** Given `cap-token-may.mjs --name may-thu-x --scope ops:pull --qua-mgmt --ghi-cloud-env` với `mgmtExec` giả và
  `cloud.env` tạm không có ký tự xuống dòng ở cuối, When chạy, Then stdout không chứa token; câu SQL gửi đi chứa băm
  sha256 của token và không chứa token; `cloud.env` có thêm đúng một dòng `OPS_MACHINE_TOKEN=om_…` trên dòng riêng; mọi
  dòng cũ giữ nguyên từng byte; băm của token trong tệp bằng băm đã gửi. Và với `mgmtExec` THẬT của
  `pipeline/sync-cloud.mjs` (chỉ lớp mạng thay bằng `fetchImpl` giả), `HOME` tạm có `cloud.env` mang
  `SUPABASE_MGMT_TOKEN`: request tới Management API mang header `Authorization: Bearer <khoá trong tệp>`, body chứa băm
  và không chứa token; phản hồi đúng dạng thật cho thoát 0, phản hồi `[]` cho thoát 2 và tệp không đổi; chỉ nạp module
  `cap-token-may` thì không có lời gọi mạng nào.
- **AC-9** Given `cloud.env` tạm đã có `OPS_MACHINE_TOKEN`, hoặc `mgmtExec` giả trả 0 dòng (tên đang có token hiệu lực),
  When chạy lệnh của AC-8, Then thoát 2; tệp giữ nguyên từng byte; ca đầu không gọi `mgmtExec` lần nào. Và
  `--thu-hoi may-thu-x --qua-mgmt` gửi đúng một câu `UPDATE machine_tokens SET revoked_at = now()` cho tên đó.

## Coverage

Quét theo preset test-matrix (skill morphological-scan), ba trục:
- Trục chỗ hỏng: kiểm khuôn (AC-1, AC-2, AC-5) · bộ áp (AC-3, AC-4) · plist (AC-6, AC-7) · cấp token (AC-8, AC-9).
  [CE: ngành — review-findings TV4 Ngoài-2, Ngoài-4 và nhật ký triển khai 11/11; đủ-để-bắt-đầu]
- Trục giá trị `resume_when`: vắng · null · chuỗi rỗng · chuỗi khoảng trắng · chuỗi thường · số · boolean · đối tượng ·
  mảng (AC-1). [CE: kiểu JSON — đủ bảy kiểu]
- Trục tầng: cloud chặn ở cổng vào (AC-5) · máy thu chặn lệnh cũ đã lọt (AC-3, AC-4).

## Đường đo

Không có `opportunity.md` (hàng do giám sát mở từ quyết định Gate 2 của TV4) — không có ngưỡng nghiệm thu.

## Out of scope

- Lưới chung trong `ops-apply.mjs` bắt mọi lỗi theo từng lệnh: chạm cách lặp và cách báo lỗi kết nối, để hàng riêng.
- Dọn lệnh sai kiểu đã có trên cloud: Supabase `change_requests` có 0 dòng (đo 11/11).
- Kiểm `resume_when` theo khuôn ngày giờ: cột `text` tự do (047).
- Script cài plist tự động (`scripts/install-*.sh` là làn ZCode).
- Nạp plist vào launchd và các bước triển khai khác: sau gộp, theo lời Mạnh.

## Notes
