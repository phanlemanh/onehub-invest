// judge-run.ts — A2/PL25: chấm cặp ghép căn và ghi đề xuất vào hàng duyệt (review_queue, item_type='entity_match').
// Tập chấm = cặp property_candidates 'needs_llm' ∪ thẻ entity_match đang chờ. Kết luận do LUẬT (`apNguong`); model chỉ
// viết lời giải thích. Mỗi lần chấm ghi model + trace của cuộc gọi vào evidence.cham (sổ ai_calls vẫn nhận dòng của nó).
// Cặp chưa có thẻ → sinh thẻ; thẻ đang chờ → cập nhật tại chỗ; thẻ người đã quyết → bỏ qua. KHÔNG tự quyết (status
// vẫn pending, người quyết ở /ops/review) và KHÔNG ghi property_candidates / sale_offers (luật 7).
// Chạy: npx tsx scripts/judge-run.ts [--khong-llm]
import { realpathSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import type { LanguageModel } from "ai";
import { runAgent } from "../src/runtime/loop.js";
import { recordCallDb, tenLop, type AiCallRecord, type RecordCall } from "../src/runtime/ai-call-log.js";
import {
  PHIEN_BAN_NGUONG,
  apNguong,
  buildJudgeInput,
  judgeEntityAgent,
  lyDoChu,
  parseGiaiThich,
  type KetQuaLuat,
} from "../src/agents/judge-entity.js";
import { queryPair, type PairData } from "../src/tools/native.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

export type ChamDeps = {
  queryPair: (a: string, b: string) => Promise<PairData | null>;
  model?: LanguageModel;
  recordCall?: RecordCall;
  khongLlm?: boolean;
};

export type Cham = {
  phien_ban_nguong: string;
  ket_luan: KetQuaLuat["same_house"];
  ly_do: KetQuaLuat["ly_do"];
  lech: KetQuaLuat["lech"];
  model: string | null;
  trace: string | null;
  ok: boolean;
  loi: string | null;
  luc: string;
};

/** Đường đo «mọi ứng viên needs_llm có thẻ»: số cặp needs_llm chưa có thẻ entity_match nào (hai chiều, mọi trạng thái). */
export const CAU_DEM_THIEU_THE = `SELECT count(*)::int AS n FROM property_candidates pc
WHERE pc.status = 'needs_llm'
  AND NOT EXISTS (SELECT 1 FROM review_queue r WHERE r.item_type = 'entity_match'
    AND r.item_id IN ('pair:' || pc.offer_a || '|' || pc.offer_b, 'pair:' || pc.offer_b || '|' || pc.offer_a))`;

/** Xin model lời giải thích; bản bọc chép bản ghi cuộc gọi rồi gọi tiếp writer sổ thật. */
async function giaiThich(
  pair: PairData,
  kq: KetQuaLuat,
  deps: ChamDeps,
): Promise<{ giai: string | null; cuocGoi: Pick<Cham, "model" | "trace" | "ok" | "loi"> }> {
  if (deps.khongLlm) return { giai: null, cuocGoi: { model: null, trace: null, ok: false, loi: "khong-llm" } };
  let ban: AiCallRecord | null = null;
  const so = deps.recordCall ?? recordCallDb;
  const boc: RecordCall = async (r) => {
    ban = r;
    await so(r);
  };
  const daGhi = () => ban as AiCallRecord | null;
  try {
    const res = await runAgent(judgeEntityAgent, buildJudgeInput(pair, kq), {}, { model: deps.model, recordCall: boc });
    const giai = parseGiaiThich(res.output);
    return {
      giai,
      cuocGoi: { model: daGhi()?.model ?? null, trace: daGhi()?.trace ?? res.tracePath, ok: giai !== null, loi: giai === null ? "sai-khuon" : null },
    };
  } catch (e) {
    return { giai: null, cuocGoi: { model: daGhi()?.model ?? null, trace: daGhi()?.trace ?? null, ok: false, loi: tenLop(e) } };
  }
}

/** Lời căn cứ cho người duyệt — cùng khuôn basisOf của enrich: «… · LLM <model> · trace <tệp>». */
function canCu(kq: KetQuaLuat, giai: string | null, c: Pick<Cham, "model" | "trace" | "ok" | "loi">): string {
  const phan = [lyDoChu(kq)];
  if (giai) phan.push(giai);
  if (c.model) phan.push(c.ok ? `LLM ${c.model}` : `LLM ${c.model} lỗi ${c.loi}`);
  if (c.model && c.trace) phan.push(`trace ${basename(c.trace)}`);
  return phan.join(" · ");
}

/** Dữ liệu hai tin trên thẻ — đúng bộ khoá thẻ seed 029 (bên đọc /ops/review). */
function evidenceThe(p: PairData) {
  const tin = (t: PairData["a"] | PairData["b"]) => ({
    offer_id: t.offerId,
    source: t.source,
    price_vnd: t.priceVnd,
    area_m2: t.areaM2,
    price_perm2: t.pricePerm2,
    bedrooms: t.bedrooms,
    phuong: t.phuong,
    property_type: t.propertyType,
  });
  return {
    offer_a: { ...tin(p.a), text: p.a.text },
    offer_b: { ...tin(p.b), subject: p.b.subject },
    stage_b_score: p.score,
  };
}

const tieuDe = (p: PairData) =>
  `Cùng căn? ${p.a.phuong ?? "?"} ${p.a.areaM2 ?? 0}m² ↔ ${p.b.areaM2 ?? 0}m² (score ${p.score})`;

export async function chamMotLuot(
  db: pg.ClientBase,
  deps: ChamDeps,
): Promise<{ sinh: number; capNhat: number; boQua: number; loi: number }> {
  const dem = { sinh: 0, capNhat: 0, boQua: 0, loi: 0 };
  const caps = new Map<string, [string, string]>();
  const them = (a: string, b: string) => {
    const k = [a, b].sort().join("|");
    if (!caps.has(k)) caps.set(k, [a, b]);
  };
  const { rows: ung } = await db.query(
    `SELECT offer_a, offer_b FROM property_candidates WHERE status = 'needs_llm' ORDER BY id`,
  );
  for (const u of ung) them(u.offer_a, u.offer_b);
  const { rows: cho } = await db.query(
    `SELECT item_id FROM review_queue WHERE status = 'pending' AND item_type = 'entity_match' ORDER BY id`,
  );
  for (const t of cho) {
    const m = String(t.item_id).match(/^pair:(.+)\|(.+)$/);
    if (m) them(m[1], m[2]);
  }

  for (const [a, b] of caps.values()) {
    const { rows: the } = await db.query(
      `SELECT id, status FROM review_queue WHERE item_type = 'entity_match' AND item_id = ANY($1) ORDER BY id`,
      [[`pair:${a}|${b}`, `pair:${b}|${a}`]],
    );
    if (the.some((t) => t.status !== "pending")) {
      dem.boQua++; // người đã quyết cặp này — không sửa, không sinh lại
      continue;
    }
    const pair = await deps.queryPair(a, b);
    if (!pair) {
      dem.loi++;
      continue;
    }
    const kq = apNguong(pair);
    const { giai, cuocGoi } = await giaiThich(pair, kq, deps);
    const cham: Cham = {
      phien_ban_nguong: PHIEN_BAN_NGUONG,
      ket_luan: kq.same_house,
      ly_do: kq.ly_do,
      lech: kq.lech,
      ...cuocGoi,
      luc: new Date().toISOString(),
    };
    const lyDo = canCu(kq, giai, cuocGoi);
    if (the.length > 0) {
      await db.query(
        `UPDATE review_queue SET ai_suggestion = $1, ai_reasoning = $2, ai_confidence = NULL,
           evidence = evidence || jsonb_build_object('cham', $3::jsonb)
         WHERE id = ANY($4)`,
        [kq.same_house, lyDo, JSON.stringify(cham), the.map((t) => t.id)],
      );
      dem.capNhat++;
    } else {
      await db.query(
        `INSERT INTO review_queue (item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, ai_confidence)
         VALUES ('entity_match', $1, $2, $3::jsonb, $4, $5, NULL)
         ON CONFLICT DO NOTHING`,
        [`pair:${a}|${b}`, tieuDe(pair), JSON.stringify({ ...evidenceThe(pair), cham }), kq.same_house, lyDo],
      );
      dem.sinh++;
    }
  }
  return dem;
}

async function main() {
  const khongLlm = process.argv.includes("--khong-llm");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const dem = await chamMotLuot(c, { queryPair, khongLlm });
    const { rows } = await c.query(CAU_DEM_THIEU_THE);
    console.log(`═══ JUDGE RUN XONG ═══`);
    console.log(`thẻ mới ${dem.sinh} | cập nhật ${dem.capNhat} | bỏ qua (người đã quyết) ${dem.boQua} | lỗi đọc cặp ${dem.loi}`);
    console.log(`cặp needs_llm chưa có thẻ: ${rows[0].n}`);
    console.log(`→ Mở /ops/review để phán quyết`);
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
