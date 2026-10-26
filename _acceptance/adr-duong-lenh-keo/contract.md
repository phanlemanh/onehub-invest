---
schema_version: 1
feature: ADR-0015 «đường lệnh kéo một chiều cloud → máy thu» và bản sửa đổi ADR-0007, kèm thuật ngữ mới và ROADMAP §2.3–2.4 khớp thực tế
slug: adr-duong-lenh-keo
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ văn bản luật + thuật ngữ + ROADMAP; mọi tệp đổi khớp t1_skip_globs (docs/**, CONTEXT.md)
surfaces: [docs]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; Mạnh duyệt ADR trước khi mở PR, người gộp PR là người chốt
---

# Acceptance Contract: adr-duong-lenh-keo

## Context

Hàng TV0 của `docs/plan/lo-trinh.json` (phủ TV0 + TVN7), đợt `tu-van-hanh-2510`. Ô cơ hội đã quyết `build`
(`opportunity.md`, commit 20b5ec4). Mạnh chốt ngày 25/10, theo `docs/research/ops-tu-van-hanh-nguon-saas.md` §3.1, §3.7
và §4.8 (PR #79): đội vận hành làm từ xa qua cloud; nội dung bài, ảnh tin và thẻ duyệt lên cloud; tên nguồn thật chỉ ở
máy thu. Hai chốt này trái ADR-0014 (cloud chỉ đọc) và luật 6, nên phải thành luật trước khi hàng TV1–TV14 nào code.

Hồ sơ này chỉ có contract, theo tiền lệ `_acceptance/nang-kit-2-34-0/`. Lý do là hàng T1 đã có ô cơ hội trong
`_acceptance/`. Mọi tệp PR đổi đều khớp `t1_skip_globs`.

## Criteria

- AC-1: Given `docs/adr/0015-duong-lenh-keo-mot-chieu.md`, When đọc, Then trạng thái là `accepted`, có ghi người duyệt và ngày, và đủ chín điều: cloud chỉ ghi lệnh có khuôn · máy thu kéo bằng token `ops:pull` · một bộ áp sáu bước · danh sách loại lệnh đóng · máy trạng thái + lệnh đảo + `idempotency_key` · bảng vai + người thứ hai cho S03 · khoá cấm Zalo + `checkZaloInvariants` + kiểm sau hai phía + phanh · kết quả qua `push-ops-facts` · QR/khoá/phiên không qua đường lệnh. ADR-0014 dòng trạng thái trỏ ADR-0015.
- AC-2: Given `docs/adr/0007-collector-operating-principles.md`, When đọc mục «Sửa đổi 2026-10-26», Then có danh sách đủ bốn thứ của tầng A, câu `review_queue` ra khỏi tầng A, và sáu ràng buộc: chỉ vai ops · điều kiện 037 + `--kiem-anon` · che tên trước khi lên · ảnh thu nhỏ có trần · chỉ ở `/ops/**` · leak gate đổi cùng TV9/TV13.
- AC-3: Given `CONTEXT.md`, When đọc mục «Vận hành», Then có bốn khối Đơn vị thu, Lệnh, Quy định ngữ cảnh, Mục tiêu phủ; khối nào cũng có nhãn, dòng `Code`, dòng `Slug URL`; `node scripts/glossary/acceptance.mjs w6`, test `route-slugs` và các test `ops-nhan-*` thoát 0. Kèm điều kiện: `… glossary` đỏ sẵn trên đỉnh 20b5ec4 ở «tự thu (_Avoid_ của Listing tự thu)». Đỏ ấy có từ trước PR, và PR không thêm dòng đỏ nào.
- AC-4: Given ROADMAP §2.3–2.4, When so với `launchctl list` và `airdna_markets` đo ngày 26/10, Then S01 là thu tuần (CN 19:30) và 20:00 là smoke; S02 là 43 market; mọi nhãn `com.oneinvest.*` đang nạp đều có trong §2.4; cột nguồn của §2.3 chỉ gọi bằng mã + vai trò.
- AC-5: Given các dòng PR thêm vào, When soát bằng `guardValues` của `pipeline/lib/tier-a-guard.mjs` với `real_name` và `source_ids` từ `source_registry` local, Then mọi chỗ trúng chỉ là tên hạ tầng Zalo hay nhãn job, tên bảng đã có trong kho. Không thêm tên nguồn thật nào vào văn xuôi.
- AC-6: Given đỉnh PR, When chạy `bash scripts/pre-merge-check.sh . --base origin/main` và `node scripts/product-map.mjs --root . --check`, Then cả hai sạch.

## Out of scope

- Code của bất kỳ hàng TV nào (`change_requests`, bộ áp, bảng vai, `checkZaloInvariants`, đổi leak gate). Mỗi hàng có
  hồ sơ riêng.
- Đổi luật leak gate hay `CLOUD_ALLOW`: việc của TV9 và TV13.
- Dọn tên nguồn thật khỏi migration và tài liệu cũ: chấp nhận như lịch sử (§4.8 #8).
- `docs/architecture/portals.md`, BOI-CANH: chưa sửa theo bảng vai bốn bậc; việc của TV1.
