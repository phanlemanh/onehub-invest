---
schema_version: 1
feature: Dòng «ca dữ liệu thật» của lượt chấm nêu cả lần đỏ mới nhất trên main khi nó mới hơn lần xanh cuối, và nói rõ khi không đọc được sổ
slug: dong-du-lieu-that-neu-lan-do-moi-nhat
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
veto_state: mo
veto_opened_at: 2026-11-26T03:15:00Z
design_doc: docs/superpowers/specs/2026-11-26-dong-du-lieu-that-neu-lan-do-moi-nhat-design.md
---

# Acceptance Contract: dong-du-lieu-that-neu-lan-do-moi-nhat

## Context

Hàng HT30, cắt từ mục Ngoài-5 của hồ sơ HT9 `db-thu-tach-khoi-cum-that` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng
26/11). Dòng «ca dữ liệu thật» hiện chỉ báo lần xanh cuối của sổ soát hằng ngày; lần đỏ mới hơn bị giấu, và sổ không đọc
được trông như sổ trống.

## Acceptance Criteria

- **AC-1** Given sổ có dòng xanh rồi dòng đỏ mới hơn, When lượt chấm không kích `pipeline_that`, Then dòng in nêu cả lần xanh
  gần nhất lẫn «ĐỎ mới hơn: <ngày> (<sha9>) — ca đỏ: <tên>», tên ca tối đa ba cái kèm «(+n)» khi nhiều hơn.
- **AC-2** Given sổ chỉ có dòng đỏ, Then dòng in «chưa có lần xanh nào trên main; ĐỎ mới nhất: <ngày> (<sha9>) — ca đỏ: …»,
  không bao giờ có «lần xanh gần nhất» kèm ngày.
- **AC-3** Given dòng cuối của sổ là xanh (kể cả có đỏ cũ hơn), hoặc sổ vắng/rỗng, hoặc lượt kích `pipeline_that`, Then dòng in
  giữ đúng chữ của bản HT9 cho ba ca ấy.
- **AC-4** Given `git rev-parse --git-common-dir` lỗi (thư mục không phải kho git) và không có `PIPELINE_THAT_SO`, Then `duongSo`
  trả null và dòng in «không đọc được sổ soát hằng ngày (…)» thay vì «chưa có lần xanh nào»; lỗi đọc sổ khác «không có tệp»
  cũng vậy; dòng cuối không rỗng của sổ không đọc được JSON (đang ghi dở) → «không đọc được sổ soát hằng ngày (dòng cuối hỏng)» —
  không lặng lẽ lấy dòng xanh trước nó. Dòng sổ thiếu khoá `ca_do` (khuôn cũ) đọc như `ca_do` rỗng. Đối chứng: bản sao `duongSo` cũ (rơi về đường tương đối) → ghim «sổ không đọc được trông như sổ trống».

## Out of scope

- Đối chiếu trên sổ thật của máy thu: sổ do GS chạy hằng ngày, test không đọc tệp máy thật (không tất định).

- Thẻ Cổng Bằng chứng của kit tự rút dòng này: việc của kit (đề xuất ở hồ sơ HT9 `de-xuat-kit.md`).
- Đổi bên ghi sổ (`pipeline-that-hang-ngay.mjs`) hay khuôn dòng sổ.

## Coverage

- Trục trạng thái sổ: vắng · rỗng · chỉ xanh · xanh rồi đỏ · chỉ đỏ · đỏ rồi xanh · không đọc được [thước CE: các ca của
  `scripts/pipeline-that-hang-ngay.test.mjs`] — AC-1, AC-2, AC-3, AC-4.
- Trục tên ca đỏ: thiếu khoá · rỗng · một · ba (không cắt) · bốn (cắt «+1») — AC-1, AC-2, AC-4.
- Trục dòng sổ hỏng: dòng giữa hỏng (bỏ qua) · dòng cuối hỏng (báo) — AC-4.
