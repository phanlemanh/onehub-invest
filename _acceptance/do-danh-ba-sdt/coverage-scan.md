## Ngữ cảnh

- Sản phẩm: onehub-invest, phép đo đêm trục SĐT của danh bạ Người (SD5) — chân sản phẩm: audit
  [SUY-TỪ-REPO: docs/research/audit-bang-nguoi-sdt-3010.md] §0, §7 · chân ngành: kiểm chất lượng dữ liệu theo quy tắc,
  một dòng mỗi kiểm × đối tượng [NGÀNH: DQO — pipeline/sql/450_dq_checks.sql, ADR-0007].
- Preset: test-matrix.

## Trục

- Trục A — số đo: N1 cặp 1–1 chưa gộp | N2 người SĐT không vai | N3 sellers ↔ SĐT trên tin | N4 tin nhiều SĐT / tin rỗng SĐT |
  N5 bài sót [thước CE: audit §0 bảng N1–N5]
- Trục B — nguồn: S03 | S05 (S06 không có SĐT — N9) [thước CE: audit §1.1]
- Trục C — trạng thái: pass | fail [thước CE: Hỏi-1]
- Trục D — đường ra: bảng in | --write | chạy lại trong ngày | job đêm | /ops/quality [thước CE: câu giao + bật khi]

## Core (≤20%)

1. Mười số trùng câu đo độc lập của audit trên cùng bản chép DB (AC-2).
2. Chạy lại trong ngày không nhân dòng (AC-3).
3. Không SĐT/khoá băm lên dq_check_results (AC-3).
4. Dòng kiểm diễn giải được, không đỏ ON12 (AC-5).

## Later

- Ngưỡng cảnh báo theo xu hướng; S06 khi SH3 mở.

## Never

- So số cứng 30/10 — DB 30/10 không còn.

## Cross-cutting áp mọi ô Core

- Mỗi phép đo âm có đối chứng đỏ ghim thông điệp.
