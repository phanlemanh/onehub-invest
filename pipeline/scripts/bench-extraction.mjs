#!/usr/bin/env node
/**
 * bench-extraction.mjs — C2 DQO: đo chất lượng extractor trên zalo-mock
 * CÓ ground truth (meta.gt) — lợi thế độc nhất của mock (ROADMAP G1).
 *
 * Chạy:  node pipeline/scripts/bench-extraction.mjs
 * Env:   OLLAMA_URL (tùy chọn — OpenAI-compatible /v1/chat/completions),
 *        OLLAMA_MODEL (default qwen2.5:27b), DATABASE_URL.
 *
 * Kết quả: F1 per field cho extractor 'regex' (parsePost của transform) và
 * 'llm' (nếu có OLLAMA_URL). Ghi dq_check_results(check_name='extraction-
 * quality'). Regex: pass khi F1 field-avg >= 0.8 (ngưỡng coverage G1);
 * llm: informational (pass/skip, chưa làm gate).
 *
 * F1 per field = 2PR/(P+R) trên cặp (gt, predicted) — đúng khi bằng nhau
 * (kể cả cùng null), miss khi lệch. items không có meta.gt bị loại khỏi
 * mẫu số (snapshot mock cũ).
 */
import { gunzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { parsePost, matchPhuong } from "../transform-zalo.mjs";

const FIELDS = ["kind", "priceVnd", "pricePerm2Vnd", "areaM2", "bedrooms", "phuong"];
const THRESHOLD = 0.8;

const snapRoot = process.env.SNAPSHOT_ROOT ?? "../collector/snapshots/hanoi";
const city = "hanoi";

// ---- Load snapshot zalo-mock mới nhất có gt ----
const dirs = readdirSync(snapRoot)
  .filter((d) => d.startsWith(`${city}__zalo-mock__`))
  .sort();
let items = [];
let snapId = null;
for (const d of [...dirs].reverse()) {
  const files = readdirSync(join(snapRoot, d)).filter((f) => f.startsWith("items-"));
  const batch = files.flatMap((f) =>
    JSON.parse(gunzipSync(readFileSync(join(snapRoot, d, f))).toString()),
  );
  if (batch.some((i) => i.meta?.gt)) {
    items = batch;
    snapId = d;
    break;
  }
}
if (!snapId) {
  console.error("bench: không tìm thấy snapshot zalo-mock có meta.gt — chạy lại zalo-mock trước.");
  process.exit(1);
}
const sample = items.filter((i) => i.meta?.gt);
console.log(`bench: ${snapId} — ${sample.length}/${items.length} items có gt`);

// ---- Phường list từ DB ----
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
});
await client.connect();
const { rows: areas } = await client.query(
  `SELECT id, name FROM areas WHERE parent_id = 'vn-hanoi' AND region_type = 'submarket'`,
);
const slugs = areas.map((a) => [a.id.replace("vn-hanoi-", ""), a.name]);

// ---- Đối chiếu 1 cặp ----
function predictRegex(text) {
  const p = parsePost(text);
  const m = matchPhuong(text, slugs);
  return {
    kind: p.kind,
    priceVnd: p.priceVnd,
    pricePerm2Vnd: p.pricePerm2Vnd,
    areaM2: p.areaM2,
    bedrooms: p.bedrooms,
    phuong: m?.slug ?? null,
  };
}

// Tên gt (trần: 'Hoàn Kiếm') → slug, không phân biệt prefix Quận/Phường
// của tên DB; không map được → null (field phường loại khỏi chấm của item).
const gtPhuongSlug = (name) => {
  if (!name) return null;
  const exact = slugs.find(([, n]) => n === name);
  if (exact) return exact[0];
  const loose = slugs.find(
    ([, n]) => n.endsWith(' ' + name) || name.endsWith(' ' + n.replace(/^(Quận|Phường|Huyện)\s+/, '')) && n.replace(/^(Quận|Phường|Huyện)\s+/, '') === name,
  );
  return loose?.[0] ?? null;
};

function f1ByField(predictOf) {
  const stats = Object.fromEntries(FIELDS.map((f) => [f, { tp: 0, fp: 0, fn: 0 }]));
  // Phường so theo TÊN tương đương (bỏ prefix), không theo slug — DB có
  // 2 area trùng tên khác cấp ("Tây Hồ" vs "Quận Tây Hồ"), slug-khớp chặt
  // phạt đúng-tên-sai-cấp.
  const nameBySlug = new Map(slugs);
  const bareName = (x) => (x ?? "").normalize("NFC").replace(/^(quận|huyện|phường|thị xã|thị trấn|xã)\s+/i, "").toLowerCase();
  for (const it of sample) {
    const gtSlug = gtPhuongSlug(it.meta.gt.phuong);
    const gt = { ...it.meta.gt, phuong: gtSlug };
    const pr = predictOf(it.payload.text, it.meta.gt);
    for (const f of FIELDS) {
      let g = gt[f] ?? null;
      let p = pr[f] ?? null;
      if (f === "phuong") {
        g = g ? bareName(nameBySlug.get(g) ?? it.meta.gt.phuong) : null;
        p = p ? bareName(nameBySlug.get(p) ?? p) : null;
      }
      const eq = g === null && p === null ? true : g !== null && p !== null && g === p;
      if (g !== null && eq) stats[f].tp++;
      else if (g !== null && !eq) { stats[f].fn++; if (p !== null) stats[f].fp++; }
      else if (g === null && p !== null) stats[f].fp++;
    }
  }
  const out = {};
  for (const f of FIELDS) {
    const { tp, fp, fn } = stats[f];
    const P = tp + fp > 0 ? tp / (tp + fp) : 0;
    const R = tp + fn > 0 ? tp / (tp + fn) : 0;
    out[f] = P + R > 0 ? (2 * P * R) / (P + R) : 0;
  }
  return out;
}

function show(name, f1) {
  const avg = Object.values(f1).reduce((a, b) => a + b, 0) / FIELDS.length;
  console.log(
    `${name.padEnd(6)} F1: ` +
      FIELDS.map((f) => `${f}=${f1[f].toFixed(2)}`).join(" ") +
      ` — avg ${avg.toFixed(3)}`,
  );
  return avg;
}

async function record(client2, entity, f1, avg, status) {
  await client2.query(
    `INSERT INTO dq_check_results (check_name, entity, status, detail)
     VALUES ('extraction-quality', $1, $2, $3)`,
    [entity, status, Object.keys(f1).length === 0 ? "samples=0" : `samples=${sample.length} avgF1=${avg.toFixed(3)} ` + FIELDS.map((f) => `${f}=${f1[f].toFixed(2)}`).join(" ")],
  );
}

// ---- Regex ----
const regexF1 = f1ByField((text) => predictRegex(text));
const regexAvg = show("regex", regexF1);
await record(client, "regex", regexF1, regexAvg, regexAvg >= THRESHOLD ? "pass" : "fail");

// ---- LLM (tùy chọn) ----
const ollama = process.env.OLLAMA_URL;
if (ollama) {
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:27b";
  const PROMPT = (text) =>
    `Trích xuất từ tin rao bất động sản tiếng Việt, trả JSON đúng schema (null khi không có):\n` +
    `{"kind":"sale"|"rent_lt","priceVnd":số VND|null,"pricePerm2Vnd":số|null,"areaM2":số|null,"bedrooms":số|null,"phuong":tên phường|null}\n` +
    `Lưu ý: "2.9 tỷ"=2900000000 (chấm thập phân); "45tr/m²"=45000000 VND/m²; "8tr/tháng" là thuê.\nTin: """${text}"""`;
  const preds = [];
  let llmFail = 0;
  for (const it of sample) {
    try {
      const res = await fetch(`${ollama}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: PROMPT(it.payload.text) }],
          temperature: 0,
        }),
      });
      const j = await res.json();
      const raw = j.choices?.[0]?.message?.content ?? "";
      const m = raw.match(/\{[\s\S]*\}/);
      const p = m ? JSON.parse(m[0]) : {};
      preds.push({
        kind: p.kind ?? null,
        priceVnd: typeof p.priceVnd === "number" ? p.priceVnd : null,
        pricePerm2Vnd: typeof p.pricePerm2Vnd === "number" ? p.pricePerm2Vnd : null,
        areaM2: typeof p.areaM2 === "number" ? p.areaM2 : null,
        bedrooms: typeof p.bedrooms === "number" ? p.bedrooms : null,
        phuong: typeof p.phuong === "string" ? p.phuong : null,
      });
    } catch {
      llmFail++;
      preds.push(Object.fromEntries(FIELDS.map((f) => [f, null])));
    }
  }
  // phường LLM trả tên — quy về slug để so
  let i = 0;
  const llmF1 = f1ByField((text, gt) => {
    const p = preds[i++];
    return { ...p, phuong: p.phuong ? gtPhuongSlug(p.phuong) : null };
  });
  const llmAvg = show("llm", llmF1);
  console.log(`llm lỗi gọi: ${llmFail}/${sample.length}`);
  await record(client, "llm", llmF1, llmAvg, llmFail === sample.length ? "skip" : "pass");
} else {
  console.log("llm: OLLAMA_URL chưa đặt — skip (informational)");
  await record(client, "llm", {}, 0, "skip"); // samples=0 — route hiển thị null
}

await client.end();
console.log("bench: đã ghi dq_check_results (extraction-quality)");
