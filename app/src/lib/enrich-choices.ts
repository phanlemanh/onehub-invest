// enrich-choices.ts — chọn đề xuất nào được áp khi người duyệt thẻ agent_output (AC-11).
// Field có từ hai đề xuất chờ = luật E1 và LLM trái nhau (migration 033 + agent/src/enrich):
// người phải chọn một bên (hoặc bỏ cả hai) cho từng field đó; field khác áp như cũ.
// Route decide áp các id trả về bằng apply_enrichment rồi bác phần còn lại bằng
// decide_enrichment_review(...,'rejected') — logic áp vẫn nằm trong hai hàm SQL của 033.

export type QueuedProposal = { id: number; field: string };

/** field → id đề xuất được chọn, hoặc null = bỏ cả hai. */
export type EnrichChoices = Record<string, number | null>;

export type EnrichPlan = { ok: true; applyIds: number[] } | { ok: false; error: string };

export function planEnrichApproval(queued: QueuedProposal[], choices: EnrichChoices | undefined): EnrichPlan {
  const byField = new Map<string, number[]>();
  for (const p of queued) byField.set(p.field, [...(byField.get(p.field) ?? []), p.id]);

  const applyIds: number[] = [];
  for (const [field, ids] of byField) {
    if (ids.length === 1) {
      applyIds.push(ids[0]);
      continue;
    }
    if (!choices || !(field in choices)) return { ok: false, error: `thiếu lựa chọn: ${field}` };
    const chosen = choices[field];
    if (chosen === null) continue;
    if (!ids.includes(chosen)) return { ok: false, error: `lựa chọn không thuộc trường ${field}: ${chosen}` };
    applyIds.push(chosen);
  }
  return { ok: true, applyIds: applyIds.sort((a, b) => a - b) };
}
