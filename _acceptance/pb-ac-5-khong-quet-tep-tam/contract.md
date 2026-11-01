---
schema_version: 1
feature: Test quét cây PB-AC-5/PB-AC-6 không đỏ chập chờn khi bản đột biến tạm của test khác bị xoá giữa lúc quét
slug: pb-ac-5-khong-quet-tep-tam
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: draft
veto_state: mo
veto_opened_at: 2026-11-01T03:00:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-01-pb-ac-5-khong-quet-tep-tam-design.md
---

# Acceptance Contract: pb-ac-5-khong-quet-tep-tam

## Context

PB-AC-5 (`pipeline/scripts/phat-bieu.test.mjs`) quét cây thật bằng `filesOfTree`; PB-AC-6 bằng `findCallSites`/`kiemVai`.
Các test đột biến chạy song song (`gia-ty-sau-khoang-trang`, `gia-ty-chan-dong`, `cam-mau-s03`, `gop-anh`) ghi bản sao ẩn
`.xx-mut-*.mjs` trong `pipeline/` rồi xoá; bộ quét gặp tệp đã mất thì ném `ENOENT` và main đỏ không vì thay đổi nào (P4 gặp ở
S4 r2). Đo 01/11: dưới tải sinh-xoá tệp ẩn, `filesOfTree` ném `ENOENT` 154/200 lượt.

## Criteria

- AC-1: Given một cây tạm đủ năm thư mục quét với 200 tệp thường và một tiến trình liên tục sinh rồi xoá tệp ẩn `.gs-mut-*.mjs`
  trong `pipeline/` của cây ấy, When quét cây bằng cả `filesOfTree` lẫn `findCallSites` qua lớp bọc của test, mỗi bộ 30 lượt,
  Then không lượt nào ném lỗi và `filesOfTree` mỗi lượt có đủ 200 tệp thường; cùng cây và cùng tải, gọi thẳng từng bộ quét thì
  gặp `ENOENT` trong trần lượt; tiến trình con và cây tạm luôn được dọn.
- AC-2: Given bộ quét ném `ENOENT` trên một tệp không ẩn, hoặc ném lỗi khác `ENOENT`, When đi qua lớp bọc, Then lỗi được ném ra
  ngay; Given bộ quét ném `ENOENT` trên tệp ẩn ở mọi lần, When đi qua lớp bọc, Then lỗi được ném ra sau đúng số lần trần;
  Given ném `ENOENT` tệp ẩn một lần rồi thành công, Then lớp bọc trả kết quả.
- AC-3: Given mã nguồn của `phat-bieu.test.mjs`, When soát mọi chỗ gọi quét cây thật (`filesOfTree(ROOT`, `findCallSites(ROOT`,
  `kiemVai(ROOT`), Then chỗ nào cũng nằm trong lớp bọc; bỏ lớp bọc ở một chỗ thì bộ soát nêu đúng dòng.
- AC-4: Given cây kho thật, When chạy `cd pipeline && npm test`, Then xanh — PB-AC-5 và PB-AC-6 giữ nguyên mọi assertion,
  `gia-ty-sau-khoang-trang` không đổi.

## Coverage

Bỏ quét không gian — một trục (lỗi bộ quét gặp: không lỗi · ENOENT tệp ẩn thoáng qua · ENOENT tệp ẩn kéo dài · ENOENT tệp
thường · lỗi khác), quét đủ ở AC-1 và AC-2; xem dòng descope trong sổ.

## Out of scope

- Sửa `filesOfTree`/`findCallSites` ở `pipeline/lib/` để tự bỏ qua tệp ẩn (ngoài ranh hàng; đề xuất hàng riêng).
- Đổi các test đột biến để không ghi bản sao vào `pipeline/` (bản sao cần import tương đối và gói `pg` của cây thật).

## Notes

- Hàng sửa test của hai hồ sơ đã ký: `phat-bieu-va-phan-xu` (tệp `phat-bieu.test.mjs`) — giám sát giao hàng với ranh gồm đúng
  tệp này (01/11); `s03-gia-ty-sau-khoang-trang` không phải sửa.
