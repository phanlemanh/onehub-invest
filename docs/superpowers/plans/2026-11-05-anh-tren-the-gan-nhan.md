# Ảnh trên thẻ gắn nhãn Implementation Plan

> **For agentic workers:** thực thi tuần tự trong phiên chính.

**Goal:** Thẻ gắn nhãn hiện ảnh bài, ẩn link, xem lớn được, thêm căn cứ «Ảnh».

**Architecture:** Hàm thuần `labels-anh.ts`, chế độ `?nhan=&anh=` của `/api/zalo-media`, thành phần `anh-bai.tsx`, migration 075.

**Tech Stack:** Next.js 16, ReUI base-nova, `node:test`, jsdom.

**Spec:** `docs/superpowers/specs/2026-11-05-anh-tren-the-gan-nhan-design.md`

## Global Constraints

- Không ghi snapshot, không ghi DB `oneinvest`, không đưa URL hay tên miền nguồn xuống trình duyệt.
- 36 bài mất ảnh giữ trong mẫu, không loại bài nào.

## Review Focus

- `media`, `media_files` là `null`, chuỗi JSON hay mảng có phần tử rỗng: không vỡ.
- Bài có link không thuộc ảnh: đếm, không hiện câu trống.
- `file` trong DB có `..`: không ra ngoài snapshot.
- Băm chữ khi ghi nhãn vẫn trên chữ gốc.
- Đầu thẻ dính: ô ảnh nhỏ, không che biểu mẫu trên khổ 375.

---

### Task 1: `app/src/lib/labels-anh.ts` + `app/tests/labels-anh.test.ts` (E1, E2)
### Task 2: chế độ `?nhan=&anh=` của `zalo-media.ts`, sổ bề mặt API (E3, E9)
### Task 3: `tinKe`, `doiChieu` trả `chu`, `anh`, `soLinkKhac` (E6)
### Task 4: `anh-bai.tsx`, đầu thẻ, lượt hai (E4, E5, E10)
### Task 5: migration 075, `BASIS`, nút «Ảnh» (E8, E11)
### Task 6: `probes/` seed, nap, that, kin (E6–E9)
