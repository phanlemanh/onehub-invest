---
schema_version: 1
feature: Bật nhóm khoá kit 2.34.0 cho làn ghim lại và lưới hoá cũ; gỡ đường cache 2.32.0 khỏi config
slug: kit-khoa-nhom-1
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ đổi _acceptance/config.yaml: bốn khoá kit «kho tự bật» + đường lệnh trỏ engine trùng byte; không đổi sản phẩm, dữ liệu hay quyền
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: kit-khoa-nhom-1

## Context

Mạnh hỏi ngày 26/10/2026 kit còn khoá nào chưa bật mà giúp kho chạy đúng kim chỉ nam của kit, sau khi thấy crm
chưa bật khoá dùng lại kết quả eval gọi model. Phiên giám sát so `_acceptance/config.yaml` với bảng khoá ở GUIDE §7.1
của kit 2.34.0 và với cấu hình crm, rồi đề xuất «nhóm 1». Mạnh duyệt cùng ngày: «Mở PR bật nhóm 1: stale_scope paths,
repin_retry 1, repin_budget_min 80, do_san_tren_nen true, và đổi đường design gate sang 2.34.0».

Số đo lúc đề xuất: 91 hồ sơ; 98 commit ghim lại trên `main` từ 23/10; sổ ghi 111 lượt ghim lại xanh và 21 lượt đỏ; một
lượt bị ngắt; 0 lượt gọi tên chập chờn (vì chưa bật chạy lại). Lượt chấm 4 của AU9 bị trả chỉ vì test agent chập chờn.
`main` từng đỏ hai lần vì fixture (#98, #109).

Thay đổi:

- `feature_loop.repin_retry: 1`, `feature_loop.repin_budget_min: 80`, `feature_loop.do_san_tren_nen: true`.
- `risk_tiers.stale_scope: paths`.
- `executors.design.gate`, `executors.design.ui_check` và chín lệnh `*_design_gate` chuyển từ thư mục cache `2.32.0`
  sang `2.34.0`. `scripts/design-gate.mjs`, `scripts/design-scan.js` và `lib/design-detect.mjs` trùng byte giữa hai bản,
  nên kết quả chấm của hồ sơ UI đã ký không đổi.
- `executors.script.product_map` chuyển sang bản chép của kho `scripts/product-map.mjs`, vốn trùng byte bản 2.34.0
  (bản 2.32.0 của plugin khác và từng làm CI gate đỏ).

`_acceptance/config.yaml` nằm dưới `_acceptance/`, nên không làm hồ sơ nào hoá cũ.

## Criteria

- AC-1: Given `_acceptance/config.yaml` của PR, When đọc bằng `docKhoa` của `feature-loop` 2.34.0 (`scripts/lib/lan-khoa.mjs`) với `lib/evidence-core.cjs` của kho, Then được `repin_retry: 1`, `repin_budget_min: 80`, không ném lỗi.
- AC-2: Given cùng tệp, When `docKhoaDoSan(<gốc kho>)` của `lib/do-san-tren-nen.cjs`, Then `true`; và `resolveConfigKey(…, 'risk_tiers.stale_scope')` ra `paths`.
- AC-3: Given `grep -c '2\.32\.0' _acceptance/config.yaml`, When chạy, Then `0`.
- AC-4: Given `scripts/design-gate.mjs`, `scripts/design-scan.js`, `lib/design-detect.mjs` của `acceptance-gate` 2.32.0 và 2.34.0 trong cache, When `cmp` từng cặp, Then trùng byte cả ba.
- AC-5: Given `node scripts/product-map.mjs --root . --check`, When chạy trên đỉnh PR, Then cả hai dòng đều báo «khớp».
- AC-6: Given `bash scripts/pre-merge-check.sh . --base origin/main`, When chạy trên đỉnh PR, Then thoát 0.

## Out of scope

- `model_evals`, `model_carry_cmd`, `repin_cost_cmd`: kho chưa có eval gọi model thật. Khai cùng hàng đầu tiên có eval
  như vậy (PL29 `so-cuoc-goi-ai`, PL9 `eval-classify-wilson`).
- `repin_ci_blank_env`: chờ #116 (AU11) đưa suite lên CI.
- `repin_parallel_suites`: suite agent và pipeline cùng ghi DB local :5433; phải đo hai cách trên cùng cây trước khi bật.
- Đổi sang khuôn `${CLAUDE_PLUGIN_ROOT}/…` (kế hoạch `docs/plan/nang-kit-2-34-0.md` mục 5): cần chắc biến này có trong
  môi trường làn ghim lại; để lượt nâng kit sau.
- Khoá trùng `sync_pii_mutation` trong `executors.script`: dọn riêng.
