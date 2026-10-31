# Quét không gian AC — sdt-luu-goc-e164 (preset entity-feature)

## Ngữ cảnh
- Thực thể: SĐT người bán — chân sản phẩm: audit `docs/research/audit-bang-nguoi-sdt-3010.md` [SUY-TỪ-REPO] · chân ngành:
  RESO DD 2.1 `MemberMobilePhone`, số quốc tế có «+» đứng đầu [NGÀNH: RESO DD 2.1, audit §5b].

## Trục
- Chỗ lưu: bộ bóc | sale_offer_records | properties | registry_aliases | sellers | cloud [CE: audit §3.1, §6.1]
- Thời điểm: dữ liệu cũ (migration) | dữ liệu mới (transform) | chạy lại [CE: luật idempotent AGENTS.md, 055 chỉ-thêm]
- Người đọc: bait gap | deals | sync-cloud | /ops/people | bộ đo [CE: dò mã 31/10]

## Core
1. Bộ bóc + transform ra E.164 — AC-1
2. 060 lược đồ + từ vựng, idempotent — AC-2
3. 060 đổi dạng dữ liệu tin + căn — AC-3
4. Bí danh sdt giữ party_key, nghỉ sdt_bam — AC-4
5. sellers view đúng cột + giữ tên — AC-5
6. Người ghi sellers thôi ghi — AC-6
7. Cloud không lộ số gốc — AC-7
8. Người đọc còn lại theo E.164, che trên /ops/people — AC-8

## Later
- Hiện số gốc cho vai Vận hành/admin (U1) · gộp người SĐT với tài khoản (gop-nguoi-sdt-tai-khoan).

## Never
- Dùng SĐT làm khoá Người — RESO và audit §5b: SĐT đổi chủ, dùng chung.
- Đưa số gốc lên cloud ở vòng này — Hỏi-A chưa mở.
