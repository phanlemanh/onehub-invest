# Tin rao gán phường hợp lệ — Implementation Plan

**Goal:** Ba transform tin rao và bước PIP của transform-hcmc-simple chỉ gán vào phường hợp lệ (`phuongHopLe()`).

**Architecture:** Thêm `docPhuongHopLe` và `ganPhuongTheoToaDo` vào `pipeline/lib/osm.mjs`; bốn bước gán gọi chúng.
transform-chotot xuất `runTransformChotot(client)`. Test mồi trong BEGIN…ROLLBACK; phép đo AC-8 trên dữ liệu thật rồi
ROLLBACK.

**Spec:** `docs/superpowers/specs/2026-10-26-tin-rao-gan-khu-vuc-dung-design.md`, `_acceptance/tin-rao-gan-khu-vuc-dung/contract.md`

## Global Constraints

- Không đổi `matchPhuong`, `writeOffers`, luật COALESCE của chotot.
- Thị trường: zalo `["vn-hanoi"]`; fb, chotot `["vn-hanoi","vn-hcmc"]`.
- Chuỗi `'osm-phuong'` chỉ ở `pipeline/lib/osm.mjs` (ngoài test).
- Mọi test/phép đo chạm DB đi trong một transaction rồi ROLLBACK.

## Review Focus

- Khu vực lạc và phường hợp lệ trùng tên: bộ đọc phải loại khu vực lạc, không loại phường thật.
- `docPhuongHopLe` với danh sách thị trường rỗng → trả rỗng, không lỗi.
- Tin S06 khớp `ward_name_v3` vào khu vực lạc trước đây: lượt mới không khớp → COALESCE giữ cũ (ngoài phạm vi, ghi Notes).

### Task 1: Bộ đọc chung trong lib/osm.mjs — phục vụ E1, E6 · independent: false

**Files:** Modify `pipeline/lib/osm.mjs`
- `docPhuongHopLe(client, markets: string[]) → Promise<{id,name,parent_id}[]>`
- `ganPhuongTheoToaDo(client, marketId: string) → Promise<number>` (rowCount)
- Verify: `cd pipeline && node --check lib/osm.mjs`

### Task 2: transform-zalo, transform-fb dùng bộ đọc — phục vụ E2, E3, E5, E7 · independent: false

**Files:** Modify `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs`
- Verify: `cd pipeline && node --test scripts/test-posts.test.mjs`

### Task 3: transform-chotot xuất runTransformChotot + dùng bộ đọc — phục vụ E4, E7 · independent: false

**Files:** Modify `pipeline/transform-chotot.mjs` (thân main → `runTransformChotot(client)`, main bọc BEGIN…COMMIT)
- Verify: `cd pipeline && node --check transform-chotot.mjs`

### Task 4: transform-hcmc-simple gọi ganPhuongTheoToaDo — phục vụ E6, E7 · independent: false

**Files:** Modify `pipeline/transform-hcmc-simple.mjs`
- Verify: `cd pipeline && node --check transform-hcmc-simple.mjs`

### Task 5: Test AC-1…AC-7 — phục vụ E1…E7 · independent: false

**Files:** Create `pipeline/scripts/tin-rao-gan-khu-vuc.test.mjs`; nếu ca cần dữ liệu thật thì vào `scripts/ci-bo-qua.json`
- Ca: TRG-AC-1 (hai ca), TRG-AC-2, TRG-AC-3, TRG-AC-4, TRG-AC-5, TRG-AC-6, TRG-AC-7 (bốn ca: ma trận, dùng chung, hai chiều đỏ)
- Verify: `cd pipeline && node --test scripts/tin-rao-gan-khu-vuc.test.mjs` + phá-thử từng ca (gỡ lọc khỏi bộ đọc → đỏ)

### Task 6: Phép đo AC-8 — phục vụ E8 · independent: false

**Files:** Create `scripts/kiem-tin-rao-gan-khu-vuc.mjs` (`--thu`, từ chối DB không phải localhost)
- Verify: `node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` + phá-thử (bộ đọc cũ → đối chứng đỏ)
