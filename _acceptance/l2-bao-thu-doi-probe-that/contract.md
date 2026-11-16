---
schema_version: 1
feature: Bước bóc số nhà trước dấu phẩy (L2) của bộ tách ô đường chỉ bóc khi đoạn sau là tiền tố tên đường; năm probe dữ liệu thật còn lại ra khỏi suite chung agent và app sang chỗ chạy có người đọc; agent/probes vào tsconfig
slug: l2-bao-thu-doi-probe-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-11-15
design_doc: docs/superpowers/specs/2026-11-15-l2-bao-thu-doi-probe-that-design.md
---

# Acceptance Contract: l2-bao-thu-doi-probe-that

## Context

Hàng nối tiếp `tach-o-duong-dau-vao-ban` (#460). Mạnh ký Cổng Bằng chứng ngày 15/11, Ngoài-2 và Ngoài-3 «mở hợp đồng
mới»; Hỏi-2 «dời bốn probe ở hàng riêng»; Ngoài-1 tsconfig. GS gộp ba việc thành một hàng, thêm ca app TPL-AC-6.
Bảng phủ ca đo trên DB máy thu ở design doc §1.

## Acceptance Criteria

- **AC-1** Given ô đường mở đầu bằng số rồi dấu phẩy, When đoạn sau phẩy mở đầu bằng Đường/Phố/Đ./duong/pho hoặc
  Hẻm/Ngõ/Ngách/Kiệt, Then L2 bóc số nhà. Ca cần ra Khớp:
  - «46, Đường Điện Biên Phủ, Phường Hòa Khê, Quận Thanh Khê, Đà Nẵng» ↔ «Điện Biên Phủ»;
  - «237/6, Hẻm 237 Đường Hoàng Diệu» ↔ «Hoàng Diệu»;
  - «33/3, Đường 25A» ↔ «Đường 25A».
- **AC-2** Given đoạn sau phẩy KHÔNG phải tiền tố tên đường, When so, Then L2 không bóc.
  - Ra Thiếu khi so với «Lê Lợi»: «3,5m», «4,5m», «7,5m», «4,3m», «15, Q1», «208, P12», «12, Phuong 5», «50 , Tân
    Khánh , tân Uyên , Tp , Hcm», «12, Phong Phú», «8, Phổ Quang» (ranh giới từ của tiền tố không dấu).
  - Khoá của «2A, Khu dân cư Vĩnh Phú 1» không có «khu dan cu».
  - «3/2, Phường 12, Quận 10» ↔ «3/2» và «19/5, Tân Bình» ↔ «Đường 19/5» ra Khớp.
  - «208, Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, Tp Hồ Chí Minh» ↔ «Nguyễn Hữu Cảnh» ra Thiếu: đổi có tên
    kỳ vọng của ca CD-AC-9 L2 đã ký.
- **AC-3** (cross-layer) Given ma trận AC-1, AC-2 cộng ma trận cũ (CD-AC-1…9), When chạy trên luật judge và bản thẻ
  duyệt rút từ `app/src/lib/ops/review-can-cu.ts`, Then hai bên cùng kết quả ở mọi cặp. Trên DB máy thu, so với khoá của main
  f78e7382 (chép đóng băng):
  - mọi giá trị trong bảng đổi khoá của design §1 (9 giá trị) nằm trong tập đổi khoá — tập con, chịu được dữ liệu mới;
  - mỗi giá trị đổi khoá có khoá mới là Thiếu hoặc khoá số; khoá đường mới mà main không có thì đỏ;
  - số đếm chỉ in ra, không assert bằng.
- **AC-4** Given ca KD-AC-6 phần (b) và hai ca LT-AC-6, When dời sang `agent/probes/khong-dau-that.test.ts` và
  `agent/probes/judge-luat-that.test.ts`, Then:
  - `executors.test.judge_entity_khong_dau` và `executors.test.judge_luat` chạy cả tệp probe tương ứng;
  - các ca dời xanh trên DB máy thu, tên ca giữ nguyên;
  - KD-AC-1…5, KD-AC-6(a), LT-AC-1…5 còn trong suite.
- **AC-5** Given ca «AC-9 chỉ kết quả land đổi trên tin thật của DB local» của context-resolver, When dời sang
  `agent/probes/context-resolver-that.test.ts`, Then:
  - ca dời xanh trên DB máy thu, và «AC-9 E1 đất từ nội dung tin» còn trong suite;
  - eval E9 của enrich-hau-ky được xử theo lựa chọn ở Hỏi-2: trỏ `superseded_by` về AC này, kèm một executor
    `context_resolver_that` chạy cả tệp suite lẫn tệp probe.
- **AC-6** (cross-layer) Given ca TPL-AC-6 của app, When dời sang `app/probes/the-duyet-phuong-that.test.tsx`, Then:
  - `executors.test.the_duyet_phuong` chạy cả tệp đó;
  - ca dời xanh trên DB máy thu. Hôm nay nó đỏ trên main vì chiều đỏ ghim đúng một giá trị («phuong-liet»), mà dữ liệu
    mới làm giá trị đứng đầu đổi thành «phuong-duc». Thông điệp ghim chuyển sang khuôn lớp
    `TPL-AC-6 probe: .* cùng phường mà báo lech`, không phụ thuộc thứ tự dữ liệu;
  - TPL-AC-1…5 còn trong suite app.
- **AC-7** Given glob suite agent (`tests/*.test.ts`) và app (`tests/*.test.tsx`), When quét, Then:
  - suite agent không tệp nào còn dấu `t.skip("cần DB máy thu`;
  - suite app chỉ còn đúng danh sách nợ đo ngày 15/11 (9 ca ở 6 tệp: anh-goc-doi-chieu 1, danh-ba-nguoi-doi-chieu 2,
    sellers-chip 1, the-duyet-du-can-cu 3, the-so-gia-tri-song 1, the-duyet-hien-nguoi-dang 1). Số ca mỗi tệp không vượt
    danh sách. Dời 9 ca này là hàng riêng (dòng sổ descope S3);
  - không tệp suite nào khai tên ca của năm probe đã dời.
  - Chiều đỏ: chèn một dấu probe vào một tệp suite thì ca đỏ, gọi tên tệp.
- **AC-8** Given `scripts/probe-du-lieu-that.sh`, When chạy trên DB máy thu, Then:
  - in mỗi tệp probe một dòng ✅ hay ❌; toàn ✅ thì thoát 0, có ❌ thì thoát 1 kèm ca đỏ;
  - `PROBE_GIA_DO=<tên tệp probe>` làm đúng tệp ấy ❌, script thoát 1 và gọi đúng tên tệp;
  - `scripts/audit-all.sh` mục B5 gọi script trong nhánh pass/fail; người đọc là `/ops-check`;
  - lượt trong-script không ghi tệp đột biến.
- **AC-9** Given `agent/tsconfig.json`, When chạy `cd agent && npx tsc --noEmit`, Then `include` có `probes/**/*.ts`,
  và không có lỗi trong tệp nào dưới `agent/probes/`. Chiều đỏ: chèn một lỗi kiểu vào bản sao probe thì tsc báo đúng
  tệp đó.
- **AC-10** Given bản chép DB máy thu mới nhất, When chạy `cd agent && npm test` và `cd app && npm test`, Then cả hai
  exit 0.

## Coverage

Quét theo preset test-matrix (design §1–§2):
- **Trục A — L2 theo đoạn sau phẩy:** tiền tố đường (AC-1), cụm vị trí (AC-1), bề rộng (AC-2), viết tắt hành chính
  (AC-2), tên phường không tiền tố (AC-2), ngày/tháng (AC-2), tên đường không tiền tố (AC-2 — đổi có tên).
  [CE: đếm DB máy thu 15/11]
- **Trục B — probe × module:** agent ba tệp (AC-4, AC-5), app một tệp (AC-6); hồ sơ đã ký đo qua executor riêng
  (AC-4, AC-6), đo qua suite (AC-5, Hỏi-2). [CE: grep evals.yaml các hồ sơ đã ký]
- **Trục C — nơi chạy:** suite chung (AC-7, AC-10), eval hồ sơ (AC-4–6), /ops-check (AC-8), tsc (AC-9).

## Đường đo

Không có ô cơ hội (hàng do GS giao). Số đổi khoá trên DB đo bằng AC-3. Suite xanh đo bằng AC-10.

## Out of scope

- Số nhà dính chữ đứng một mình («2A», «44d/17») vẫn ra khoá số như trước vòng.
- Probe dữ liệu thật ở pipeline và data-api.
- Đẩy cảnh báo chủ động khi probe ❌.

## Notes

- `_acceptance/config.yaml` chồng vùng với hàng P2 `ngoai-n-tu-dinh-tuyen-bat` — chỉ sửa các dòng executor nêu trên.
