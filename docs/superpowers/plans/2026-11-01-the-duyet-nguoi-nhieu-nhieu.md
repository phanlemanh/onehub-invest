# Thẻ duyệt Người nhiều–nhiều (HD17) — kế hoạch thi công

**Goal:** thẻ `data_quality`/`nguoi:` cho mỗi nhóm tài khoản–SĐT không một–một; quyết định của người áp ở bước dựng danh bạ.
**Spec:** `docs/superpowers/specs/2026-11-01-the-duyet-nguoi-nhieu-nhieu-design.md` · hợp đồng `_acceptance/the-duyet-nguoi-nhieu-nhieu/contract.md`.

## Global Constraints

- Không sửa `db/migrations/`, route decide, `pipeline/scripts/danh-ba-nguoi.test.mjs`, `danh-ba-nguoi.itest.mjs`.
- Không xoá dòng `review_queue`/bốn bảng danh bạ; mã nguồn chỉ `S0x` trong evidence.
- Test DB chỉ trên DB thử `oneinvest_u2_nguoi`, mỗi ca BEGIN … ROLLBACK (nạp 055 + 060 như HD13).

## Task 1 — lõi thuần `pipeline/lib/the-duyet-nguoi.mjs` (independent: true · phục vụ E1, E11)

- `nhomNhieuNhieu(tins, baiTheoId) → [{source, taiKhoan:[{id, ten, soTin}], sdt:[{sdt, soTin}], offerIds}]` — đồ thị hai phía
  trên tin sống S03/S05 qua `rutDinhDanh`, giữ nhóm ≥ 2 tài khoản hoặc ≥ 2 SĐT, xếp tất định.
- `maThe(nhom) → "nguoi:<S0x>:<16 hex sha256 của 'tk:<id>' + 'sdt:<e164>' đã xếp, nối \n>"`.
- `evidenceThe(nhom, tinTheoId) → {source, tai_khoan, sdt, tin_mau ≤ 5}`.
- Test `pipeline/scripts/the-duyet-nguoi.test.mjs`: TN-AC-1 ma trận 6 hình + đột biến; TN-AC-9 so byte hai tệp test HD13 với
  merge-base, chiều đỏ bằng bản chép sửa một dòng, lỗi đọc tách riêng.
- Verify: `cd pipeline && node --test scripts/the-duyet-nguoi.test.mjs`.

## Task 2 — nối vào `dungNguoi` (independent: false, sau Task 1 · phục vụ E2–E7, E10, E13)

- `danh-ba-nguoi.mjs`: sau `chonGop`, gọi `dungThe(c, nhom)` (sinh thẻ chờ cho nhóm chưa có thẻ hiệu lực; đóng `deferred`
  thẻ chờ có mã vắng trong lượt, ghi chú `thay bởi <id mới>` hay `nhóm không còn`, decided_by `dung-nguoi`) và `apThe(c, …)`
  (thẻ approved chưa có sự kiện `the-duyet:<id>`: thành viên evidence → người cuối, loại split, đích = người tài khoản active
  nhỏ nhất, UPDATE merged + sự kiện gop lý do `the-duyet:<id> <S0x>`; không đích → đếm `the_khong_ap`). Áp trước `anhXaVai`
  để vai đi theo. Kết quả thêm `the_moi`, `the_dong`, `the_ap`, `the_khong_ap`.
- `nap-lai-nguoi.mjs`: kiểm «người hai SĐT» nhận ngoại lệ khi chuỗi gộp có sự kiện `the-duyet:`; cờ `--the-duyet` dựng một
  thẻ approved trong giao dịch rồi chạy, kèm đối chứng ép gộp hai SĐT không sự kiện → đỏ.
- Itest `pipeline/scripts/the-duyet-nguoi.itest.mjs`: TN-AC-2..7, TN-AC-10.
- Verify: executor `the_duyet_nguoi_db`, `nguoi_db`, `nguoi_nap_lai_u2`, `cd pipeline && npm test`.

## Task 3 — thẻ trên `/ops/review` (independent: true · phục vụ E8, E9)

- `app/src/components/ops/review-card-nguoi.tsx` `NguoiCard` (bảng tài khoản/SĐT, tin mẫu, ba nút); `review-card.tsx` rẽ nhánh
  `data_quality` + `nguoi:`, xuất `useDecide`/`PendingActions`/`DoneState`, nhãn đã quyết; `review-queue.ts` nhãn loại.
- Test `app/tests/review-nguoi.test.tsx` TN-AC-8 (jsdom, fetch giả, lỗi, viewer).
- Verify: `cd app && npx tsc --noEmit && npm run lint && node --import tsx --test tests/review-nguoi.test.tsx`.

## Review Focus

- Nhóm có cả người đã gộp bởi luật một–một (người theo SĐT đã merged) — thành viên lấy người cuối.
- Thẻ approved mà người tài khoản bị gộp vào nhau trước đó — đích vẫn tất định, không gộp vòng.
- Tin S05 không có người gửi (chỉ SĐT) — không tạo cạnh.
