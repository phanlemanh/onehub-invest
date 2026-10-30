---
schema_version: 1
feature: Ghép căn kết luận bằng luật ngưỡng trong code, LLM chỉ viết lời giải thích; mỗi lần chấm ghi model và trace lên thẻ; mọi cặp ứng viên needs_llm sinh đúng một thẻ ghép căn
slug: judge-nguong-la-code
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-30T07:40:22Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-30-judge-nguong-la-code-design.md
---

# Acceptance Contract: judge-nguong-la-code

## Context

L14: ba luật số quyết «cùng một căn?» nằm trong prompt của `judge-entity`, Qwen tự áp nên kết luận không tất định và
không test được; thẻ không trỏ tới model/trace của lần chấm; cặp `needs_llm` mới không bao giờ thành thẻ (thẻ chỉ seed
một lần ở 029). Hàng PL25 đưa luật vào code, để LLM chỉ viết chữ, ghi model + trace lên thẻ, và cho judge-run sinh thẻ
từ ứng viên.

Source input: hàng PL25 `docs/plan/lo-trinh.json` (câu giao + `bat_khi`) · `opportunity.md` (Cổng Đáng: build, Mạnh
30/10) · vùng hẹp của giám sát: `agent/src/agents/judge-entity.ts`, `agent/scripts/judge-*.ts`, `agent/tests/judge-*`.

## Criteria

- AC-1: Given một cặp tin, When máy chấm, Then kết luận `yes`/`no`/`unsure` do hàm luật trong code quyết theo ba ngưỡng
  khai một chỗ, độ lệch tính như bộ lọc Stage B (|a−b|/lớn hơn), so chặt (giá/m² < 15% và diện tích < 10% và cùng
  phường và cùng loại → yes; giá/m² > 30% hoặc khác phường hoặc khác loại → no; còn lại, thiếu số liệu, hay chỉ một bên
  có phường/loại → unsure), và đổi chỗ hai tin không đổi kết luận.
- AC-2: Given prompt hệ thống và nội dung model THẬT SỰ nhận khi judge-run chấm mọi nhánh luật, When soi chữ, Then không
  chỗ nào chứa số ngưỡng (15/10/30 kèm %, 0.15/0.1/0.3) hay phép so sánh kèm số («<15», «> 30»).
- AC-3: Given model trả một kết luận trái với luật (vd `same_house: "no"` khi luật nói yes), When máy ghi thẻ, Then đề
  xuất trên thẻ vẫn là kết luận luật; chữ của model chỉ vào phần giải thích.
- AC-4: Given một lần chấm có gọi model thành công, When máy ghi thẻ, Then sổ `ai_calls` có đúng một dòng cho cuộc gọi
  ấy, thẻ mang model id và đường trace bằng đúng cột của dòng sổ đó, và lời căn cứ (`ai_reasoning`) kết bằng «LLM
  <model> · trace <tệp>».
- AC-5: Given model lỗi, trả sai khuôn, hoặc chạy với `--khong-llm`, When máy ghi thẻ, Then thẻ vẫn mang kết luận luật
  và lý do luật bằng tiếng Việt; phần chấm ghi model (hoặc trống khi không gọi) cùng lớp lỗi ngắn, không chép prompt.
- AC-6: Given cặp `needs_llm` chưa có thẻ, When chạy judge-run, Then mỗi cặp có đúng một thẻ `entity_match` đang chờ,
  mang dữ liệu hai tin theo đúng bộ khoá thẻ seed 029 và kết luận máy.
- AC-7: Given đã chạy judge-run một lần, When chạy lại (kể cả thẻ cũ ghi cặp theo chiều ngược), Then không thẻ mới nào
  sinh ra; thẻ đang chờ được cập nhật tại chỗ.
- AC-8: Given thẻ của một cặp đã được người quyết (duyệt, bác, hoãn), When chạy judge-run, Then thẻ ấy không bị sửa và
  không có thẻ chờ mới cho cặp đó.
- AC-9: Given judge-run chạy xong, When so dữ liệu, Then `property_candidates` và `sale_offers` không đổi một dòng nào
  (máy chỉ ghi vào hàng duyệt).

## Coverage

Trục quét (morphological-scan, preset entity-feature): **nhánh luật** {yes · no-giá · no-phường · no-loại · unsure-giữa
· unsure-thiếu số} × **đầu ra model** {đúng · trái luật · sai khuôn · ném lỗi · không gọi} × **trạng thái thẻ** {chưa có
· đang chờ · đang chờ chiều ngược · đã quyết} × **dữ liệu ngoài hàng duyệt** {ứng viên · tin}.

- Nhánh luật → AC-1 (ma trận sáu nhánh + đổi chỗ), AC-2 (prompt của mọi nhánh).
- Đầu ra model → AC-3 (trái luật), AC-4 (đúng), AC-5 (sai khuôn · ném lỗi · không gọi).
- Trạng thái thẻ → AC-6 (chưa có), AC-7 (đang chờ · chiều ngược), AC-8 (đã quyết).
- Dữ liệu ngoài hàng duyệt → AC-9.
- Thước CE: số assert ma trận = số ô viết trước trong từng test; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.

## Đường đo

- «Mọi ứng viên needs_llm có thẻ»: câu đếm chỉ đọc ở design doc §4 (cặp `needs_llm` không có thẻ `entity_match` nào, hai
  chiều, mọi trạng thái) = 0. Chạy trong test AC-6 trên DB thử; trên DB local là bước vận hành sau gộp (chạy
  `judge-run` rồi câu đếm). AC-6, AC-7 bảo đảm.
- «Không prompt nào chứa ngưỡng số»: test AC-2 soi prompt hệ thống + nguyên văn prompt model giả nhận trong judge-run
  cho mọi nhánh luật; AC-2 bảo đảm.

## Out of scope

- Lịch chạy định kỳ judge-run (hàng TV13b `sinh-the-ghep-can`).
- Đổi ba số ngưỡng — giữ nguyên số của prompt cũ; chỉnh ngưỡng thuộc tập nhãn PL8/PL9.
- Giao diện `/ops/review` hiện phần chấm thành khối riêng.
- Prompt của `enrich-text` (làn U2, `agent/src/enrich/**`).
- Đổi `property_candidates.status` theo quyết định của người trên thẻ.
- Chạy judge-run thật trên DB `oneinvest` (việc vận hành sau gộp).

## Notes
