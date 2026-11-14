---
schema_version: 1
feature: Trang /ops/quality khai props đúng kiểu trang của Next nên typecheck của app xanh cả khi thư mục kiểu sinh .next/types cũ hay vắng
slug: props-trang-ops-quality
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ đổi kiểu props của một trang và hai lời gọi trang trong test; hành vi sản phẩm giữ nguyên, không đổi dữ liệu, quyền hay luồng
surfaces: [ui]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: props-trang-ops-quality

## Context

Hàng CI1 của `docs/plan/lo-trinh.json` (đợt no-cat-hang-1311). Hồ sơ có mặt vì PR chạm `app/` (ngoài `t1_skip_globs`).

`app/src/app/ops/quality/page.tsx` khai props `{ searchParams?: … } = {}`. Tham số mặc định làm kiểu props thành
`… | undefined`, nên kiểu kiểm trang của Next đời cũ (next-types-plugin, tệp `.next/types/app/ops/quality/page.ts`) báo
TS2344 «Type 'undefined' is not assignable to type 'PageProps'». Lỗi này đã làm đỏ lượt nền và lượt chấm của TV4b ngày
12/11; hôm nay typecheck chỉ xanh khi `next typegen` sinh kiểu mới.

Sửa: props bắt buộc, đúng hình trang của Next — `{ searchParams: Promise<Record<string, string | string[] | undefined>> }`.
`lat-do` lặp trên URL thì lấy giá trị đầu. Hai test gọi trang không đối số (`ops-nhan-theo-context.test.tsx`,
`ops-nhan-ma-nguon.test.tsx`) nay truyền `{ searchParams: Promise.resolve({}) }`.

## Criteria

- AC-1: Given cây có tệp kiểu kiểm cũ `.next/types/app/ops/quality/page.ts` (dựng lại theo khuôn next-types-plugin: `checkFields<Diff<PageProps, FirstArg<TEntry['default']>, 'default'>>()`), When chạy `cd app && npx tsc --noEmit`, Then thoát 0; trên main `f3cf56a9` cùng tệp đó cho TS2344 ở cột 29.
- AC-2: Given cây chỉ có kiểu sinh bởi `next typegen` mới, When chạy `cd app && npx tsc --noEmit && npm run lint`, Then thoát 0.
- AC-3: Given cây không có `.next`, When chạy `cd app && npx tsc --noEmit`, Then không còn lỗi nào ở `src/app/ops/quality/`.
- AC-4: Given URL `/ops/quality?lat-do=phuong`, When trang dựng, Then `latDo` nhận `"phuong"` như trước; `lat-do` vắng thì ra `"tong"`.

## Out of scope

- OOS-1: Lỗi TS2304 `LayoutProps`/`PageProps` của các layout và `/ops/data-flow` khi không có `.next`: ngoài vùng hàng này; cây không có `.next` vẫn cần `next typegen` như CI đang làm.
- OOS-2: Chạy lại bộ test app đầy đủ: hai test chỉ đổi đối số gọi trang, đã qua typecheck; CI chạy bộ đầy đủ.
