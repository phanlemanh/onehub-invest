# Kế hoạch — nhan-dq-media-local-file (T2, không Gate 1.5)

| Việc | Tệp | Lệnh kiểm | Phục vụ | independent |
|---|---|---|---|---|
| 1. Ba nhánh diễn giải cho `media:local-file` (tên kiểm, đối tượng mã nguồn trần, chi tiết rows/local/offers_with_media) + test không DB có chiều khuôn lạ | `app/src/lib/dq-labels.ts`, `app/tests/dq-media-label.test.tsx` | `cd app && node --import tsx --test tests/dq-media-label.test.tsx tests/ops-nhan-theo-context.test.tsx` | E1, E2, E3, E4 | false |
| 2. Thuật ngữ «Ảnh tin» trong `CONTEXT.md` | `CONTEXT.md` | `cd app && npm test && npx tsc --noEmit && npm run lint` | E5, E6, E7 | false |

Cả hai việc đã có trong commit c09ede86 (sửa gấp trước hồ sơ, sổ quyết định ghi lý do).
