# Bộ nhận loại tin S03 theo bối cảnh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bài S03 chưa có chữ «bán/cho thuê» được suy loại theo Yêu cầu → cửa vào → đơn vị giá thuê → tín hiệu bán → mục đích nhóm; bài đã có loại không đổi.

**Architecture:** Hàm thuần mới trong `pipeline/transform-zalo.mjs` (`laYeuCau`, `coDauHieuBds`, `mucDichTheoTen`, `mucDichNhom`, `suyLoai`), gọi ở bước 2 của `runTransformZalo` sau `parsePost`; `parsePost` giữ nguyên. `label-sample.mjs` thêm lát `s03-loai-tin` phân tầng.

**Tech Stack:** Node ESM, `node --test`, `pg`.

**Spec:** `docs/superpowers/specs/2026-10-31-s03-nhan-loai-tin-rong-design.md` · hợp đồng `_acceptance/s03-nhan-loai-tin-rong/contract.md` (AC-1..10, duyệt 31/10).

## Global Constraints

- Thứ tự quyết: Yêu cầu → cửa vào (giá + dấu hiệu BĐS) → đơn vị giá thuê (triệu < 1 tỷ, không chữ «tỷ», «tháng», «pass») → tín hiệu bán → mục đích nhóm (tên, rồi tỉ lệ ≥ 20 bài ≥ 85%) → «cả hai» giữ rỗng.
- Nguồn đếm: `chu-bai`, `tin-hieu-chu`, `don-vi-gia`, `boi-canh-nhom`, `yeu-cau`, `bo`.
- Không «CN» trần làm tín hiệu bán. Không ghi DB mới; `repostKey` không đổi.
- Test DB: BEGIN … ROLLBACK, chỉ in số; không in chữ bài thật.

## Review Focus

1. «Có khách cọc» / «đã có khách» là tin rao, không phải Yêu cầu — ô đối chứng AC-4.
2. «Giá: 4,000 thu về» (giá không đơn vị) — cửa vào nhận qua `GIA_NHAN_TRIEU` khi có tín hiệu bán, giá điền 4 tỷ.
3. Giá theo m² («45tr/m2») không thành thuê — ô đối chứng AC-2.
4. Nhóm chưa có tên + < 20 bài chữ bài → «cả hai» → rỗng.
5. `suyLoaiTin: false` cho đúng kết quả cũ (dùng cho AC-9).

### Task 1: Hàm suy loại + ma trận viết tay (AC-1..6, AC-8)

**Files:** Modify `pipeline/transform-zalo.mjs`; Create `pipeline/scripts/transform-zalo-loai-tin.test.mjs`.

**Interfaces (Produces):**
- `NGUON_LOAI: readonly string[]`
- `laYeuCau(text: string): boolean` · `coDauHieuBds(text: string): boolean` · `mucDichTheoTen(ten: string|null): "sale"|"rent_lt"|null`
- `mucDichNhom(bai: {conversation_id, group_name, kind}[]): Map<string, "sale"|"rent_lt"|"ca-hai">`
- `suyLoai(pr, text, mucDich): {kind: "sale"|"rent_lt"|null, nguon: string}` (sửa `pr.priceVnd` khi bán mà giá không đơn vị)
- `demNguonLoai(nguon: string[]): Record<string, number>`

- [ ] Viết ma trận SLT-AC-1..6, 8 + chiều đỏ bằng bản chép tạm; chạy → FAIL; cài; chạy → PASS; commit.

### Task 2: Nối vào `runTransformZalo` (AC-6, AC-8)

- [ ] `runTransformZalo(client, { parse, suyLoaiTin = true })`: parse mọi bài trước, tính `mucDichNhom`, gọi `suyLoai` khi `pr.kind` rỗng; trả và log `nguonLoai`. Chạy bộ `pipeline npm test` → xanh; commit.

### Task 3: Lát nhãn phân tầng + đối chiếu DB (AC-7, AC-9, AC-10)

**Files:** Modify `pipeline/label-sample.mjs`; Create `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`.

**Interfaces (Produces):** `tangLoai(posts): Map<post_id, "chu-bai"|"moi-nhan"|"van-bo">` (transform-zalo.mjs); `chonMauPhanTang(posts, tang, {n, seed})` (label-sample.mjs).

- [ ] SLT-AC-10 thuần + SLT-DC-7/9/10 trên DB (ROLLBACK); chạy → PASS; commit; contract `status: implemented`.
