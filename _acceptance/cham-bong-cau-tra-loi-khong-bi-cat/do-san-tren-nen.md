# Suite đỏ sẵn trên nền máy (S4 vòng 2, 22/11)

Mạnh chọn «Chấm, ghi đỏ sẵn» (22/11) cho vòng 3: chấm như cũ, ghi các ca dưới là đỏ sẵn trên dữ liệu DB máy thu, không phải do hàng.
Hàng chỉ đổi `agent/src/enrich/cham-bong/**`, test và probe của chính nó; không chạm `app/` hay `pipeline/`.

| Suite | Ca đỏ ở vòng 2 | Chạy trên main `b28bdbd3d` (checkout chính, cùng máy) | CI GitHub của PR #521 |
|---|---|---|---|
| app_ui | SD-AC-6 chip Căn giá tốt có số tin người bán (`app/tests/sellers-chip.test.tsx`) | đỏ (pass 20 · fail 1, cùng ca) | app xanh |
| app_ui | E4c sau catch-up (`app/tests/tin-rao-cong-khai.test.tsx`), «lượt … cũ hơn lượt đã tráo» | xanh — chập chờn, đua với lượt đồng bộ cloud | app xanh |
| pipeline_a | PX1-AC-10 gán S06, S03 bằng code mới = area_id đang lưu, «lệch 1905» (`pipeline/scripts/nap-dvhc-cu.test.mjs`) | đỏ (pass 3 · fail 1, cùng ca) | pipeline xanh |
| app | `tsc`: thiếu kiểu LayoutProps/PageProps | — | app xanh |

Lệnh chạy trên main:

```
cd ~/dev/onehub-invest/app && bash ../db/db-thu.sh oneinvest_suite_app --chay env ONEHUB_SUITE_CHUNG=1 node --import tsx --test --test-concurrency=1 tests/sellers-chip.test.tsx tests/tin-rao-cong-khai.test.tsx
cd ~/dev/onehub-invest/pipeline && bash ../db/db-thu.sh oneinvest_suite_pipeline_a --chay node --test --test-concurrency=1 scripts/nap-dvhc-cu.test.mjs
```

Ca `app` (tsc) là môi trường worktree mới: chưa chạy `npx next typegen` (LUAT.md mục worktree mới). Đã chạy, `npx tsc --noEmit` thoát 0.
