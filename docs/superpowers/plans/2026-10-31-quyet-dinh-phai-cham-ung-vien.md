# HD9 quyết định phải chạm ứng viên — kế hoạch thi công

> Phương thức: tuần tự trong phiên (Native). Bước dùng ô `- [ ]`.

**Goal:** Route quyết định thẻ ghép căn chỉ ghi khi chạm đúng một ứng viên còn chờ; không thì 422 có tên, không ghi gì.

**Architecture:** Một thay đổi trong nhánh `entity_match` của `app/src/app/api/v1/ops/review/[id]/decide/route.ts`: tách cặp
khoá, `UPDATE … RETURNING id` có lọc trạng thái, đếm dòng, ROLLBACK + 422 khi khác 1, đặt TRƯỚC câu ghi `review_queue`.
Test thêm vào bộ thẻ duyệt sẵn có (lược đồ tạm, gọi thẳng `POST`). Một script đo trên bản chép DB máy thu.

**Spec:** `docs/superpowers/specs/2026-10-31-quyet-dinh-phai-cham-ung-vien-design.md` · hợp đồng
`_acceptance/quyet-dinh-phai-cham-ung-vien/contract.md` (Mạnh duyệt 31/10, Hỏi-1 nhánh khuyên) · evals E1–E10.

## Global Constraints

- Hỏi-1: chặn 422 cho cả ba nút (Cùng căn, Khác căn, Để sau).
- Ứng viên còn sống = khớp cặp theo hai chiều, `status IN ('pending','needs_llm')`.
- Phản hồi 422: `{ error: <câu tiếng Việt nêu cặp và số dòng>, code: "khong-cham-ung-vien", so_dong: <n> }`; audit thêm
  `ung_vien: <id>` khi chạm.
- Test chạy trên lược đồ tạm của `app/tests/the-duyet-du-can-cu.test.tsx` (khung `theMoi`, `bam`, `goi`, `banChepTam`).
- Phép đo bản chép chỉ chạy trên DB thử `oneinvest_p2_hd9` (`bash db/db-thu.sh oneinvest_p2_hd9`); không ghi DB chung.

## Review Focus

1. Câu ghi `review_queue` hiện đứng TRƯỚC câu ứng viên — phải đảo hoặc ROLLBACK đủ để 0 dòng audit.
2. `pair:A|B|C` hoặc khoảng trắng quanh khoá không được khớp nhầm.
3. Nhánh `agent_output enrich:` và các mã 400/404/409 giữ nguyên (TD-AC-7/8 xanh).
4. Thẻ hiện nguyên câu lỗi 422 và giữ lý do (AC-7) — không đổi UI.
5. Quyết song song hai thẻ cùng cặp: `FOR UPDATE` của thẻ + trạng thái ứng viên đổi khỏi `pending` → thẻ thứ hai 422.

---

### Task 1: route chạm đúng một ứng viên (E1–E6)

**Files:** Modify `app/src/app/api/v1/ops/review/[id]/decide/route.ts` · Modify `app/tests/the-duyet-du-can-cu.test.tsx`.

- [ ] Viết `describe("HD9 …")`: helper `theGhep({ cap, ungVien: [{a,b,status}] })`; ca HD9-AC-1 … HD9-AC-6 đúng expected của
  E1–E6, mỗi ca × 3 quyết định; chiều đỏ qua `banChepTam` với thông điệp ghim của evals.
- [ ] Chạy `config:executors.test.hd9_route` — đỏ.
- [ ] Sửa route: `capKhoa(item_id)` trả `[A, B] | null` (đúng `pair:<A>|<B>`, A và B khác rỗng, không `|` thừa); UPDATE có lọc
  trạng thái + RETURNING; `rowCount !== 1` → ROLLBACK + 422; câu ghi `review_queue` giữ sau khối này; audit thêm `ung_vien`.
- [ ] `hd9_route` xanh; TD-AC-7/8 xanh · commit.

### Task 2: thẻ hiện lỗi của route (E7)

**Files:** `app/tests/the-duyet-du-can-cu.test.tsx`.

- [ ] Ca HD9-AC-7: lấy thân 422 từ một lần gọi route thật (AC-1), fetch giả trả thân ấy, render `ReviewCard` ghép căn trong jsdom,
  gõ lý do, bấm Cùng căn → dòng lỗi chứa nguyên câu, ô lý do giữ chữ; chiều đỏ fetch trả 200.
- [ ] `hd9_route` xanh · commit.

### Task 3: phép đo trên bản chép (E8)

**Files:** Create `app/scripts/hd9-roundtrip.ts`.

- [ ] Script: từ chối DB `oneinvest`; đếm độc lập 12 thẻ không có ứng viên và 7 thẻ chờ có ứng viên; đặt 12 thẻ về `pending`
  rồi gọi `POST` thật → in 'HD9 thẻ khoá chết: 12/12 nhận 422, 0 dòng ghi'; gọi `POST` cho 7 thẻ chờ → 'HD9 thẻ chờ thật: 7/7
  đổi đúng 1 ứng viên'; chiều đỏ: bản route bỏ kiểm số dòng trên một bản chép mới → 'HD9 đối chứng: bản lỗi ghi <n> thẻ khoá
  chết'. Số thẻ đọc từ DB, không ghi cứng.
- [ ] `bash db/db-thu.sh oneinvest_p2_hd9`; `hd9_roundtrip` xanh · commit.

### Task 4: suite và bàn giao S4

- [ ] `cd app && npm test`, `npx tsc --noEmit && npm run lint` xanh; `/verify`; contract `status: implemented`; vào S4.
