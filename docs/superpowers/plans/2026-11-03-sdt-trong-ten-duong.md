# Số điện thoại trong tên đường S06 — kế hoạch

> Thực thi tuần tự trong phiên (một tác vụ gắn kết, các lớp dùng chung một mẫu).

**Goal:** chuỗi đường S06 mang số điện thoại không thành `street_raw` hay `properties.street`, kể cả giá trị đã nằm sẵn ở `legacy` và ô căn.

**Spec:** `docs/superpowers/specs/2026-11-03-sdt-trong-ten-duong-design.md`

## Global Constraints

- Không đụng `app/`, `pipeline/sync-cloud.mjs`, `db/migrations/`, `scripts/cloud-sync.sh`.
- Không in, không commit số thật; số trong test là số bịa.
- Không ghi lên DB `oneinvest`; đo trên `db/db-thu.sh`.
- Hồ sơ DS1 đã ký không sửa.

## Review Focus

- Chuỗi có số ngăn bằng dấu khác `[ .-]`: thước in số theo định nghĩa rộng mỗi lượt.
- Chuỗi có đường thật kèm số về sau: bị bỏ cả chuỗi, thước in số chuỗi có chữ bị bỏ.
- Resolve chạy trước transform: bên điền không nhận từ tin còn số (AC-3 cột «còn số»).
- Tin ngoài lượt transform mang `legacy` có số: rút theo phát biểu sống, không theo lượt.
- Nhật ký căn lên cloud: mục gỡ không ghi giá trị.

---

### Task 1: Mẫu và bộ đọc

**Files:** tạo `pipeline/lib/sdt-trong-chuoi.mjs`; sửa `pipeline/lib/dac-trung-s06.mjs`; test `pipeline/scripts/sdt-trong-duong.test.mjs`, `pipeline/scripts/dac-trung-s06.test.mjs` (hàng DS1).

**Interfaces:** `MAU_DAY_SO: string`, `chuaDaySo(s): boolean`, `rutDuongCoSo(client): Promise<string[]>`.

- [ ] Viết ma trận 17 hàng và ba ca đỏ, thấy đỏ.
- [ ] Thêm `chuaDaySo` vào `docDuong`, thấy xanh: `node --test pipeline/scripts/sdt-trong-duong.test.mjs pipeline/scripts/dac-trung-s06.test.mjs`.

### Task 2: Transform và ô căn

**Files:** sửa `pipeline/transform-chotot.mjs`, `pipeline/lib/duong-can.mjs`, `pipeline/resolve-properties.mjs`; test `pipeline/scripts/sdt-trong-duong.itest.mjs`.

**Interfaces:** `goSdtKhoiCan(q): Promise<number>`; `dienDuongCan` lọc tin còn số.

- [ ] Gọi `rutDuongCoSo` trước `resolveOffers`, cộng các tin bị rút vào danh sách phân xử.
- [ ] Gọi `goSdtKhoiCan` ngay trước `dienDuongCan`.
- [ ] Ma trận AC-2, AC-3, ca AC-5 và các ca đỏ xanh trên DB thử: `executors.script.sdt_db`.

### Task 3: Thước

**Files:** tạo `pipeline/scripts/do-sdt-trong-duong.mjs`; sửa `pipeline/CLAUDE.md`.

- [ ] Thước chạy thật trên bản chép, chiều đỏ cùng lệnh: `executors.script.sdt_do`.
