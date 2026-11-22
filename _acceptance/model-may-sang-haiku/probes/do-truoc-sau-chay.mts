// do-truoc-sau-chay.mts — MH1 AC-8, phần gọi model thật (chạy qua `do-truoc-sau.mjs --chay`, cwd agent/, PGOPTIONS chỉ đọc).
// Haiku 5.5 theo agent/config/model-agent.json (Anthropic thẳng trước, lùi sang Gateway — Mạnh 22/11); sổ cuộc gọi AI không ghi DB
// (recordCall gom tại chỗ, đếm theo đường) — lượt đo
// không ghi gì vào DB máy thu. Trần tiền theo đối số, dừng trước lời gọi vượt trần. Máy giả ở cổng MTPLX_URL đếm yêu cầu (phải 0).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createRequire } from "node:module";
import { join } from "node:path";
// pg nằm ở agent/node_modules — tệp này ở ngoài agent/ nên mượn bộ giải của gói agent.
const pg = createRequire(join(import.meta.dirname, "../../../agent/package.json"))("pg");
import { runAgent } from "../../../agent/src/runtime/loop.js";
import { modelCuaAgent, taoTran } from "../../../agent/src/runtime/model-agent.js";
import { enrichTextAgent, buildEnrichInput } from "../../../agent/src/agents/enrich-text.js";
import { judgeEntityAgent, buildJudgeInput, apNguong } from "../../../agent/src/agents/judge-entity.js";
import { resolveContext } from "../../../agent/src/agents/context-resolver.js";
import { queryPair } from "../../../agent/src/tools/native.js";
import { noiDungThe } from "../../../agent/scripts/judge-run.js";
import { parseGiaiThich } from "../../../agent/src/agents/judge-entity.js";
// @ts-expect-error — mô-đun .mjs không có kiểu
import { TEP, tinhSo, bangMd, kiemNguong } from "./do-truoc-sau.mjs";

const tranUsd = Number(process.argv[2] ?? 1);
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

let mtplx = 0;
const sv = createServer((req, res) => { req.resume(); req.on("end", () => { mtplx += 1; res.writeHead(500); res.end("{}"); }); });
await new Promise<void>((r) => sv.listen(0, "127.0.0.1", r));
process.env.MTPLX_URL = `http://127.0.0.1:${(sv.address() as AddressInfo).port}/v1`;

const c = new pg.Client({ connectionString: DB, application_name: "mh1-do-truoc-sau" });
await c.connect();
const ro = (await c.query("SHOW default_transaction_read_only")).rows[0].default_transaction_read_only;
if (ro !== "on") throw new Error(`từ chối: phiên DB không chỉ đọc (default_transaction_read_only=${ro})`);

const m = modelCuaAgent(enrichTextAgent.name);
const tran = taoTran(tranUsd, m.gia);
const mauEnrich = JSON.parse(readFileSync(TEP.mauEnrich, "utf8")).tin as { offer_id: string }[];
const mauJudge = JSON.parse(readFileSync(TEP.mauJudge, "utf8")).cap as { offer_a: string; offer_b: string }[];
const kq = {
  luc: new Date().toISOString(), model: m.gateway, mau_sha: { enrich: sha(TEP.mauEnrich), judge: sha(TEP.mauJudge) },
  enrich: [] as unknown[], judge: [] as unknown[], chi_usd: 0, mtplx: 0, het_tran: false, duong: {} as Record<string, number>,
};
/** Đếm lời gọi theo `<đường>:<mã gọi>` (cả lời hỏng trước khi lùi), không ghi DB. */
const khongGhi = async (r: { model: string; ok: boolean }) => {
  const k = `${r.model}${r.ok ? "" : " (lỗi)"}`;
  kq.duong[k] = (kq.duong[k] ?? 0) + 1;
};

for (const t of mauEnrich) {
  const { rows } = await c.query(
    `SELECT z.text, z.group_name FROM sale_offers o
       LEFT JOIN LATERAL (SELECT left(s.text, 500) AS text, s.group_name FROM stg_zalo_posts s WHERE s.post_id = ANY(o.post_ids)
                          ORDER BY s.captured_at DESC LIMIT 1) z ON true
      WHERE o.offer_id = $1`, [t.offer_id]);
  const text = rows[0]?.text ?? "";
  const ctx = await resolveContext(rows[0]?.group_name ?? null, text);
  const vao = buildEnrichInput(text, ctx);
  if (!tran.coTheGoi(vao)) { kq.het_tran = true; break; }
  try {
    const r = await runAgent(enrichTextAgent, vao, {}, { recordCall: khongGhi });
    tran.ghi(r.usage.inputTokens, r.usage.outputTokens);
    kq.enrich.push({ offer_id: t.offer_id, raw: r.output, usage: r.usage, duong: r.duong });
  } catch (e) {
    kq.enrich.push({ offer_id: t.offer_id, raw: null, loi: e instanceof Error ? e.name : "Error" });
  }
}
for (const p of mauJudge) {
  const pair = await queryPair(p.offer_a, p.offer_b, c);
  if (!pair) { kq.judge.push({ cap: p, raw: null, loi: "khong-doc-duoc-cap" }); continue; }
  const luat = apNguong(pair);
  const truoc = luat.same_house;
  const vao = buildJudgeInput(pair, luat);
  if (!tran.coTheGoi(vao)) { kq.het_tran = true; break; }
  try {
    const r = await runAgent(judgeEntityAgent, vao, {}, { recordCall: khongGhi });
    tran.ghi(r.usage.inputTokens, r.usage.outputTokens);
    const giai = parseGiaiThich(r.output);
    const sau = noiDungThe(luat, giai, { model: null, trace: null, ok: giai !== null, loi: giai === null ? "sai-khuon" : null }).ketLuan;
    kq.judge.push({ cap: p, raw: r.output, usage: r.usage, duong: r.duong, ket_luan_truoc: truoc, ket_luan_sau: sau });
  } catch (e) {
    const sau = noiDungThe(luat, null, { model: null, trace: null, ok: false, loi: e instanceof Error ? e.name : "Error" }).ketLuan;
    kq.judge.push({ cap: p, raw: null, loi: e instanceof Error ? e.name : "Error", ket_luan_truoc: truoc, ket_luan_sau: sau });
  }
}
await c.end();
sv.close();
kq.chi_usd = tran.daChi();
kq.mtplx = mtplx;
writeFileSync(TEP.json, JSON.stringify(kq, null, 1) + "\n");
const so = tinhSo(kq, JSON.parse(readFileSync(TEP.mauEnrich, "utf8")).tin);
writeFileSync(TEP.md, bangMd(so, kq) + "\n");
const loi = kiemNguong(so);
console.log(`đường: ${Object.entries(kq.duong).map(([k, n]) => `${k} ${n}`).join(" · ") || "—"}`);
console.log(`cỡ mẫu ${so.coEnrich} + ${so.coJudge} · JSON ${so.jsonPct} % · giải thích ${so.giaiPct} % · kết luận đổi ${so.ketLuanDoi} · chi ${so.chiUsd} USD · MTPLX ${so.mtplx}${kq.het_tran ? " · DỪNG VÌ TRẦN" : ""}`);
for (const l of loi) console.error(`ĐỎ ${l}`);
process.exit(loi.length ? 1 : 0);
