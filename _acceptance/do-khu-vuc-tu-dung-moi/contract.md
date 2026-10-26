---
schema_version: 1
feature: Phép đo gán khu vực tin rao (kiem-tin-rao-gan-khu-vuc --thu) tự dựng tin mồi trỏ khu vực không hợp lệ trong transaction, không dựa vào trạng thái DB thật
slug: do-khu-vuc-tu-dung-moi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: verified
veto_state: mo
veto_opened_at: 2026-10-26T12:55:00Z
design_doc: docs/superpowers/specs/2026-10-26-do-khu-vuc-tu-dung-moi-design.md
---

# Acceptance Contract: do-khu-vuc-tu-dung-moi

## Context

Mạnh 26/10: «phép đo E8 của tin-rao-gan-khu-vuc-dung (và E3 tương tự) tự dựng dữ liệu mồi trong transaction thay vì dựa
vào trạng thái DB thật». Gốc: Ngoài-5 của `tin-rao-gan-khu-vuc-dung` — đối chứng dương của
`scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` đòi tin thật trỏ khu vực không hợp lệ; sau lượt dọn AU9 DB local không còn
tin nào như vậy nên phép đo đỏ và hồ sơ đã ký không ghim lại được. Người gặp: người ghim lại hồ sơ đã ký và mọi PR chạm
transform tin rao (E8 đỏ oan). Thiết kế ở design doc §2; quét phép đo cùng khuôn ở §4.

## Criteria

- AC-1: Given DB local (có hay không có tin thật trỏ khu vực không hợp lệ), When `node scripts/kiem-tin-rao-gan-khu-vuc.mjs
  --thu` chụp gốc, chạy lượt nền ba transform trong MỘT transaction, rồi với mỗi nguồn S03/S05/S06 lấy hai tin có phường
  hợp lệ ở Hà Nội từ kết quả lượt nền và gắn mỗi tin vào một khu vực mồi mang đúng tên phường nền của nó (tin thứ nhất:
  khu vực lạc mồi; tin thứ hai: khu vực không-phải-phường-OSM mồi), Then dòng đối chứng dương «ok   trạng thái trước có
  6 tin mồi trỏ khu vực không hợp lệ (+ <n> tin thật)» in ra, và tập tin trỏ khu vực không hợp lệ ở chụp trước chứa đúng
  sáu `offer_id` mồi.
- AC-2: Given trạng thái của AC-1, Then: (a) trên lượt nền, nối theo `offer_id` từ chụp gốc (DB thật), 0 tin có phường
  hợp lệ bị gỡ hay đổi khu vực, và mỗi nguồn in số tin bị cho nghỉ; (b) chạy lại ba transform (lượt đo), chụp sau: 0 tin
  trỏ khu vực không hợp lệ hay khu vực mồi (so theo id mồi); mỗi nguồn S03, S05, S06 in «<nguồn>: 2 tin mồi → 2 về
  phường cũ» (mỗi tin mồi về đúng `area_id` của nó ở chụp nền); nối theo `offer_id` từ chụp trước (bỏ tin mồi), 0 tin
  có phường hợp lệ bị gỡ hay đổi, kèm đối chứng dương của thước lệch; dòng cuối «kiem-tin-rao-gan: PASS», exit 0.
- AC-3: Given cùng DB, When test chạy ba chiều — bản thường, `--pha khong-sua` (bỏ lượt đo) và `--pha mo-loc` (sáu
  khu vực mồi mang `meta` phường hợp lệ trong lúc chạy lượt đo, trả lại trước chụp sau) — Then bản thường exit 0 với dòng
  PASS; `khong-sua` exit 1, dòng FAIL của khối sau gọi tên sáu tin mồi, mỗi nguồn «<nguồn>: 2 tin mồi → 0 về phường
  cũ»; `mo-loc` exit 1, dòng FAIL «… tin trỏ khu vực mồi» gọi tên ít nhất một `offer_id` mồi đã rơi vào khu vực mồi.
- AC-4: Given DB local, When `--thu` (mọi chiều) kết thúc, Then băm từng bảng mà transform và đối soát ghi
  (`sale_offer_records`, `property_offers`, `property_candidates`, `review_queue`, `enrichment_proposals`, `areas`)
  đọc ngoài transaction bằng băm gốc, `ops_audit` không thêm dòng `transform:%`, không còn khu vực mồi — dòng «ok
  ROLLBACK — 6 bảng băm bằng gốc · ops_audit +0 dòng transform · 0 khu vực mồi»; hàm so băm đỏ đúng khi một bảng
  khác băm (dòng FAIL gọi tên bảng đó — ca thuần trong test).
- AC-5: Given `_acceptance/tin-rao-gan-khu-vuc-dung/evals.yaml`, When đọc eval E8, Then E8 khai `status: not-run` và
  `superseded_by: do-khu-vuc-tu-dung-moi#AC-2`, giữ nguyên `cmd`; design doc của hàng này nêu thẻ
  `tin-rao-gan-khu-vuc-dung/E8` trong bảng «eval cũ → AC mới»; các eval E1…E7 của hồ sơ ấy không khai `status` hay
  `superseded_by`.

## Coverage

Bỏ quét hình thái — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục đã liệt kê tay: {nguồn: S03,
S05, S06} × {khu vực mồi: lạc, không-phải-phường-OSM} (sáu tin mồi, AC-1/AC-2) × {chiều: lượt đo chạy, lượt đo bỏ,
bộ đọc không lọc} (AC-2/AC-3); {mốc thước lệch: DB thật → lượt nền, trạng thái mồi → lượt đo} (AC-2a/b); cộng {dấu
vết: sáu bảng ghi, ops_audit, khu vực mồi} (AC-4) và {thay eval hồ sơ đã ký} (AC-5).

## Out of scope

- Phép đo cần dữ liệu thật có mặt nhưng không bị việc sửa xoá (smoke-review-queue, smoke-listing-no-airdna, luong-7-ngay-do…)
  — khuôn khác, liệt ở design doc §4.
- Sửa transform hay bộ đọc phường; đổi thước lệch sang nối theo bài.
- Ghim lại `tin-rao-gan-khu-vuc-dung` bằng bằng chứng của S4 hàng này — làm SAU chữ ký Cổng Bằng chứng (luật kit chỉ
  nhận con trỏ thay khi hồ sơ thay đã ký), trong cùng PR.

## Notes

- Tin mồi lấy từ kết quả lượt nền chứ không thẳng từ `sale_offers`: đo 26/10, tin S03/S05 chọn thẳng có thể không được
  transform sinh lại và bị cho nghỉ, nên mồi biến mất thay vì được sửa (design doc §2 bước 2).
- Cần dữ liệu stg thật ở DB local cho cả ba nguồn; DB CI dựng từ migration không có, nên các ca DB của test bỏ qua ở CI
  (`scripts/ci-bo-qua.json`). Ca đọc tĩnh AC-5 và ca thuần của hàm so băm chạy cả ở CI.
- Băm bảng đọc ngoài transaction trên DB dùng chung: một tác vụ khác ghi đúng các bảng ấy trong lúc đo (lượt đêm, phiên
  khác) làm dòng ROLLBACK đỏ oan — đỏ ồn, chạy lại là hết.
