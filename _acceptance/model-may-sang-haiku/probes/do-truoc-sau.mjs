#!/usr/bin/env node
// do-truoc-sau.mjs — MH1 model-may-sang-haiku AC-8: đầu ra enrich-text và judge-entity trước (Qwen, đề xuất đã lưu) và sau (Haiku) trên
// mẫu cố định. Ba chế độ:
//   --chon-mau            đọc DB máy thu (chỉ đọc), ghi mau-enrich.json (100 tin có đề xuất e2_llm của qwen27b) và mau-judge.json
//                         (30 cặp ghép căn chờ), chọn theo băm md5 của khoá — lặp lại cho cùng tập khi dữ liệu không đổi.
//   --chay --tran-usd 1   chạy Haiku thật qua Gateway (do-truoc-sau-chay.mts, mọi kết nối DB chỉ đọc), ghi so-truoc-sau.json + .md.
//   --kiem                (eval E8) không gọi model: băm mẫu khớp, đủ 100 + 30 đầu ra, tính lại tỉ lệ từ đầu ra thô và so với bảng .md.
// Phá thử: --kiem --mau-thieu bỏ một đầu ra enrich → đỏ «AC-8 cỡ mẫu 99 khác 100»; --kiem --bang-lech sửa một tỉ lệ → đỏ «bảng lệch».
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HO_SO = join(dirname(fileURLToPath(import.meta.url)), "..");
const GOC = join(HO_SO, "../..");
export const TEP = {
  mauEnrich: join(HO_SO, "mau-enrich.json"),
  mauJudge: join(HO_SO, "mau-judge.json"),
  json: join(HO_SO, "so-truoc-sau.json"),
  md: join(HO_SO, "so-truoc-sau.md"),
};
export const CO_MAU = { enrich: 100, judge: 30 };
export const NGUONG = { jsonPct: 95, giaiPct: 95, tranUsd: 1 };
/** Trường so: tên ở đầu ra enrich-text → tên trường của enrichment_proposals (null: Qwen không có đề xuất để so). */
export const TRUONG = [
  ["property_type", "property_type", "loại hình"],
  ["bedrooms", "bedrooms", "phòng ngủ"],
  ["bathrooms", "bathrooms", "phòng tắm"],
  ["street", "street_raw", "đường"],
  ["project_name", null, "dự án"],
  ["building", "block_raw", "toà"],
];
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const chuan = (v) => (v === null || v === undefined ? null : String(v).trim().toLowerCase());

/** Cùng luật parseEnrichOutput: lấy khối {…} đầu tới cuối rồi JSON.parse; hỏng → null. */
export function docEnrich(raw) {
  const m = String(raw ?? "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}
/** Cùng luật parseGiaiThich: giai_thich là chuỗi không rỗng. */
export function docGiai(raw) {
  const j = docEnrich(raw);
  const g = j?.giai_thich;
  return typeof g === "string" && g.trim() ? g.trim().slice(0, 500) : null;
}
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);

/** Tính số đo từ đầu ra thô (một nguồn cho --chay và --kiem). */
export function tinhSo(kq, mauEnrich) {
  const qwen = new Map(mauEnrich.map((t) => [t.offer_id, t.qwen]));
  const docDuoc = kq.enrich.filter((e) => docEnrich(e.raw) !== null).length;
  const truong = TRUONG.map(([ra, field, nhan]) => {
    let co = 0;
    let trung = 0;
    let haikuCo = 0;
    for (const e of kq.enrich) {
      const j = docEnrich(e.raw);
      const h = j ? chuan(j[ra]) : null;
      if (h !== null) haikuCo += 1;
      if (!field) continue;
      const q = chuan(qwen.get(e.offer_id)?.[field]);
      if (q === null) continue;
      co += 1;
      if (h === q) trung += 1;
    }
    return { nhan, co, trung, trungPct: field ? pct(trung, co) : null, haikuCo };
  });
  const giai = kq.judge.filter((j) => docGiai(j.raw) !== null).length;
  return {
    coEnrich: kq.enrich.length,
    coJudge: kq.judge.length,
    jsonPct: pct(docDuoc, kq.enrich.length),
    giaiPct: pct(giai, kq.judge.length),
    ketLuanDoi: kq.judge.filter((j) => j.ket_luan_truoc !== j.ket_luan_sau).length,
    chiUsd: Math.round(kq.chi_usd * 1e6) / 1e6,
    mtplx: kq.mtplx,
    truong,
  };
}

export function bangMd(so, kq) {
  const d = [
    "# Số đo trước/sau — MH1 model-may-sang-haiku (AC-8)",
    "",
    `Lượt đo: ${kq.luc} · model ${kq.model} · DB máy thu chỉ đọc · trần ${NGUONG.tranUsd} USD. Máy sinh bằng`,
    "`node _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs --chay --tran-usd 1`; eval E8 tính lại từ so-truoc-sau.json.",
    "",
    "| Số đo | Giá trị | Ngưỡng |",
    "|---|---|---|",
    `| cỡ mẫu enrich | ${so.coEnrich} | ${CO_MAU.enrich} |`,
    `| cỡ mẫu judge | ${so.coJudge} | ${CO_MAU.judge} |`,
    `| JSON đọc được (enrich) | ${so.jsonPct} % | ≥ ${NGUONG.jsonPct} % |`,
    `| lời giải thích hợp lệ (judge) | ${so.giaiPct} % | ≥ ${NGUONG.giaiPct} % |`,
    `| kết luận luật đổi | ${so.ketLuanDoi} | 0 |`,
    `| tiền đã chi | ${so.chiUsd} USD | ≤ ${NGUONG.tranUsd} USD |`,
    `| yêu cầu tới cổng MTPLX | ${so.mtplx} | 0 |`,
    "",
    "Độ trùng với đề xuất Qwen đã lưu, theo trường — số báo, không phải ngưỡng (Qwen không phải đáp án đúng):",
    "",
    "| Trường | Tin Qwen có đề xuất | Trùng | Tỉ lệ trùng | Tin Haiku điền |",
    "|---|---|---|---|---|",
    ...so.truong.map((t) => `| ${t.nhan} | ${t.co} | ${t.trung} | ${t.trungPct === null ? "không có đề xuất Qwen để so" : `${t.trungPct} %`} | ${t.haikuCo} |`),
    "",
  ];
  return d.join("\n");
}

/** Lý do chưa đạt, rỗng là đạt. */
export function kiemNguong(so) {
  const out = [];
  if (so.coEnrich !== CO_MAU.enrich) out.push(`AC-8 cỡ mẫu ${so.coEnrich} khác ${CO_MAU.enrich}`);
  if (so.coJudge !== CO_MAU.judge) out.push(`AC-8 cỡ mẫu judge ${so.coJudge} khác ${CO_MAU.judge}`);
  if (!(so.jsonPct >= NGUONG.jsonPct)) out.push(`AC-8 JSON đọc được ${so.jsonPct} % dưới ${NGUONG.jsonPct} %`);
  if (!(so.giaiPct >= NGUONG.giaiPct)) out.push(`AC-8 lời giải thích ${so.giaiPct} % dưới ${NGUONG.giaiPct} %`);
  if (so.ketLuanDoi !== 0) out.push(`AC-8 kết luận luật đổi ${so.ketLuanDoi}`);
  if (!(so.chiUsd <= NGUONG.tranUsd)) out.push(`AC-8 chi ${so.chiUsd} USD vượt ${NGUONG.tranUsd} USD`);
  if (so.mtplx !== 0) out.push(`AC-8 cổng MTPLX nhận ${so.mtplx} yêu cầu`);
  return out;
}

async function chonMau() {
  const require = createRequire(join(GOC, "agent/package.json"));
  const pg = require("pg");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", application_name: "mh1-chon-mau" });
  await c.connect();
  try {
    await c.query("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY");
    const { rows: tin } = await c.query(`
      SELECT ep.offer_id, jsonb_object_agg(ep.field, ep.value_key) AS qwen
        FROM enrichment_proposals ep JOIN sale_offers o USING (offer_id)
       WHERE ep.source = 'e2_llm' AND ep.model = 'qwen27b'
       GROUP BY ep.offer_id ORDER BY md5(ep.offer_id) LIMIT ${CO_MAU.enrich}`);
    const { rows: cap } = await c.query(`
      SELECT pc.offer_a, pc.offer_b FROM property_candidates pc
       WHERE pc.status = 'needs_llm'
         AND EXISTS (SELECT 1 FROM sale_offers a WHERE a.offer_id = pc.offer_a)
         AND EXISTS (SELECT 1 FROM sale_offers b WHERE b.offer_id = pc.offer_b)
       ORDER BY md5(pc.offer_a || '|' || pc.offer_b) LIMIT ${CO_MAU.judge}`);
    writeFileSync(TEP.mauEnrich, JSON.stringify({ chon: "md5(offer_id), đề xuất e2_llm qwen27b, tin còn trong sale_offers", luc: new Date().toISOString(), tin }, null, 1) + "\n");
    writeFileSync(TEP.mauJudge, JSON.stringify({ chon: "md5(offer_a|offer_b), property_candidates needs_llm, hai tin còn trong sale_offers", luc: new Date().toISOString(), cap }, null, 1) + "\n");
    console.log(`mẫu: ${tin.length} tin enrich · ${cap.length} cặp judge`);
  } finally {
    await c.end();
  }
}

function kiem({ mauThieu = false, bangLech = false } = {}) {
  const loi = [];
  if (!existsSync(TEP.json) || !existsSync(TEP.md)) {
    console.error("ĐỎ AC-8 chưa có so-truoc-sau.json / .md — lượt đo thật chưa chạy");
    process.exit(1);
  }
  const kq = JSON.parse(readFileSync(TEP.json, "utf8"));
  if (mauThieu) kq.enrich = kq.enrich.slice(1);
  if (kq.mau_sha?.enrich !== sha(TEP.mauEnrich)) loi.push("AC-8 băm mau-enrich.json khác lúc đo");
  if (kq.mau_sha?.judge !== sha(TEP.mauJudge)) loi.push("AC-8 băm mau-judge.json khác lúc đo");
  const mau = JSON.parse(readFileSync(TEP.mauEnrich, "utf8")).tin;
  const so = tinhSo(kq, mau);
  loi.push(...kiemNguong(so));
  let md = readFileSync(TEP.md, "utf8");
  if (bangLech) md = md.replace(/\| JSON đọc được \(enrich\) \| [^|]+\|/, "| JSON đọc được (enrich) | 12.3 % |");
  if (md.trim() !== bangMd(so, kq).trim()) loi.push("AC-8 bảng lệch đầu ra thô (so-truoc-sau.md khác bảng tính lại)");
  console.log(`cỡ mẫu ${so.coEnrich} + ${so.coJudge} · JSON ${so.jsonPct} % · giải thích ${so.giaiPct} % · kết luận đổi ${so.ketLuanDoi} · chi ${so.chiUsd} USD · MTPLX ${so.mtplx}`);
  if (loi.length) {
    for (const l of loi) console.error(`ĐỎ ${l}`);
    process.exit(1);
  }
  console.log("AC-8 ĐẠT");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const a = process.argv.slice(2);
  if (a.includes("--chon-mau")) await chonMau();
  else if (a.includes("--kiem")) kiem({ mauThieu: a.includes("--mau-thieu"), bangLech: a.includes("--bang-lech") });
  else if (a.includes("--chay")) {
    const i = a.indexOf("--tran-usd");
    const tran = i >= 0 ? a[i + 1] : String(NGUONG.tranUsd);
    const r = spawnSync(process.execPath, ["--import", "tsx", join(HO_SO, "probes/do-truoc-sau-chay.mts"), tran], {
      cwd: join(GOC, "agent"), stdio: "inherit",
      // Mọi kết nối pg của tiến trình chạy chỉ đọc: một lần ghi lạc vào DB máy thu sẽ lỗi thay vì ghi.
      env: { ...process.env, PGOPTIONS: "-c default_transaction_read_only=on" },
    });
    process.exit(r.status ?? 1);
  } else {
    console.error("dùng: do-truoc-sau.mjs --chon-mau | --chay [--tran-usd 1] | --kiem");
    process.exit(2);
  }
}
