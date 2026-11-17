# Vòng 6 — truy nguyên hai chỗ đỏ

Verdict vòng 6 là REJECT. **0 finding trong hợp đồng**; cả hai chỗ đỏ là lệnh, không phải lỗi hội đồng tìm ra.
Ghi lại ở đây vì sao từng chỗ đỏ, đo bằng gì, để người ký không phải tự dựng lại.

## 1. E7 (AC-7) exit 1 — bản chép còn thẻ của lượt trước, và lệnh không có đường gỡ

Lệnh in `số thẻ 28 ≠ số nhóm có bài đếm độc lập 26`.

Đếm trên bản chép `oneinvest_u1_tg1` lúc 14:00Z:

| status | số thẻ |
|---|---|
| nhap | 24 |
| da_duyet | 3 |
| bac | 1 |
| **tổng** | **28** |

28 thẻ là của lượt dựng nháp trước (lượt chụp ảnh E5 vòng 4, khi bộ lọc bài thử chưa có nên có 28 nhóm);
4 thẻ đã quyết là do các bước Nhận/Sửa/Bác trong chính lượt chụp ấy. Vòng này lệnh chỉ dựng 26 thẻ cho
26 nhóm thật, nhưng `ghiNhap` (`pipeline/scripts/the-dia-chi-nhom.mjs:89–110`) chỉ INSERT/UPDATE theo tập
nháp của lượt — không có nhánh nào gỡ hay cho nghỉ thẻ của nhóm KHÔNG còn trong tập. Hai thẻ của nhóm toàn
bài thử (TN-138, TN-140) nằm lại, nên bất biến «số thẻ = số nhóm có bài» mà cả E7 lẫn `ap-may-thu/kiem-sau.sql`
dùng để chấm bị vỡ.

**Không dựng lại bản chép để lấy màu xanh.** Dựng lại thì E7 xanh ngay (máy thu chưa áp 108 nên lần áp đầu
cũng không có thẻ mồ côi), nhưng đúng cái lỗ này sẽ bị giấu: lần chạy SAU trên máy thu, hễ quy tắc gạt đổi
hay bài bị gỡ khỏi `stg_zalo_posts`, thẻ mồ côi lại xuất hiện và lệnh kiểm sau sẽ báo lệch mà không ai sửa
được bằng lệnh nào trong hồ sơ. Hội đồng cũng ghi đúng chỗ này (finding t3, severity high, ngoài hợp đồng).

Hệ quả cho bước áp: lần áp ĐẦU trên máy thu không gặp, nhưng hồ sơ `ap-may-thu/` chưa nói gì về thẻ mồ côi
ở các lần chạy sau. Đây là việc người ký quyết: sửa trong hàng này, hay cắt hàng riêng.

## 2. Suite `cd app && npx tsc --noEmit && npm run lint` exit 2 — thiếu kiểu Next sinh, không phải lỗi hàng

Lệnh này không gắn eval nào. Đo lại từng bước lúc 14:05Z:

| bước | mã thoát | kết quả |
|---|---|---|
| `npx tsc --noEmit` (trước) | 1 | 6 lỗi `TS2304: Cannot find name 'LayoutProps' / 'PageProps'` |
| `npm run lint` | 0 | 5 warning `no-unused-vars`, 0 error |
| `npx tsc --noEmit` (sau khi sinh `.next/types`) | **0** | sạch |

Sáu lỗi nằm ở `src/app/layout.tsx`, `(app)/layout.tsx`, `(auth)/layout.tsx`, `(marketing)/layout.tsx`,
`ops/layout.tsx`, `ops/data-flow/page.tsx` — **không tệp nào trong diff của hàng** (kiểm bằng
`git diff --name-only 573eba52 -- <tệp>`, cả sáu đều 0 dòng). `LayoutProps`/`PageProps` là kiểu toàn cục
Next 16 sinh vào `app/.next/types/`, thư mục này chưa từng tồn tại trong worktree `tg1-sach`.

Vì sao chưa từng tồn tại: `app/node_modules` ở worktree là symlink sang checkout chính, và Turbopack từ chối
biên dịch gói nằm ngoài workspace root (`Could not find the Next.js package (next/package.json)`), nên
`npm run build` chưa bao giờ chạy trọn ở đây. Bước sinh types vẫn kịp chạy trước khi Turbopack dừng, nên
sau một lần `npm run build` (vẫn exit 1) thì `tsc` sạch.

Đây là tạo tác môi trường worktree, không phải mã của hàng. Cùng họ với ghi chú đã biết về symlink
`node_modules`; đáng cắt hàng riêng cho cả kho chứ không chữa trong hàng này.
