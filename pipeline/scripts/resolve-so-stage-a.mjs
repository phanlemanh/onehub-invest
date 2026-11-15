// resolve-so-stage-a.mjs — hàng resolve-stage-a-theo-tap: chạy Stage A bản CŨ (vòng mỗi cụm, rút từ git) trên một DB thử
// và bản MỚI (theo tập, cây làm việc) trên một DB thử khác cùng dữ liệu, rồi so tập kết quả theo khoá nghiệp vụ.
// Chỉ nhận DB thử oneinvest_suite_*; từ chối oneinvest. In thời gian từng bản, số lệch từng bảng; thoát 1 khi lệch.
//   node scripts/resolve-so-stage-a.mjs --cu oneinvest_suite_sat_cu --moi oneinvest_suite_sat_moi [--rev origin/main] [--chi-moi]
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const SERVER = process.env.SAT_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CU = arg("--cu"), MOI = arg("--moi"), REV = arg("--rev", "origin/main"), CHI_MOI = process.argv.includes("--chi-moi");
// Trần giây cho bản mới (điểm xong của hàng: Stage A dưới 5 phút); --tran-giay 0 là chiều đỏ của chính phép đo.
const TRAN = Number(arg("--tran-giay", "300"));
// Đối chứng dương: lượt so phải thật sự chạy qua đường chèn (gap-probe P1) — đếm căn mới và link mới của lần một.
const TOI_THIEU = Number(arg("--toi-thieu-link", "1"));
const kiemChen = (dong, linkTruoc, linkSau) => {
  const moi = Number((dong ?? "").match(/\+ (\d+) NEW/)?.[1] ?? 0), chen = linkSau - linkTruoc;
  console.log(`đường chèn: ${moi} căn mới · ${chen} link mới`);
  if (moi < 1 || chen < TOI_THIEU) { console.log(`KHÔNG CHẠY QUA ĐƯỜNG CHÈN: ${moi} căn mới, ${chen} link mới < ${TOI_THIEU}`); process.exitCode = 1; }
};
for (const t of [MOI, ...(CHI_MOI ? [] : [CU])])
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(t ?? "")) { console.error(`so-stage-a: DB phải dạng oneinvest_suite_*, nhận «${t}»`); process.exit(2); }

const GOC = join(import.meta.dirname, "..");
const ghiTam = (ten, rev) => {
  const p = join(GOC, ten);
  writeFileSync(p, execFileSync("git", ["show", `${rev}:pipeline/resolve-properties.mjs`], { cwd: GOC }));
  return p;
};

let dongMoi = [];
async function chay(tenDb, modPath, nhan) {
  const c = new pg.Client({ connectionString: `${SERVER}/${tenDb}` });
  await c.connect();
  try {
    const { chayResolve } = await import(modPath);
    const log = [];
    const t0 = Date.now();
    await chayResolve(c, { ghi: (s) => log.push(s) });
    const giay = (Date.now() - t0) / 1000;
    console.log(`[${nhan}] ${tenDb}: ${giay.toFixed(1)} giây · ${log[0]}`);
    if (nhan.startsWith("mới")) dongMoi.push(log[0]);
    return giay;
  } finally { await c.end(); }
}

async function anh(tenDb) {
  const c = new pg.Client({ connectionString: `${SERVER}/${tenDb}` });
  await c.connect();
  try {
    const r = async (sql) => new Set((await c.query(sql)).rows.map((x) => JSON.stringify(x)));
    return {
      properties: await r(`SELECT stable_key, n_evidence, first_seen, last_seen, area_id, kind, property_type,
        ST_AsText(geo) geo, verification, resolved_by, cluster_key FROM properties`),
      property_offers: await r(`SELECT p.stable_key, po.offer_id, po.score, po.signals
        FROM property_offers po JOIN properties p ON p.id = po.property_id`),
    };
  } finally { await c.end(); }
}

function lech(a, b) {
  let n = 0; const mau = [];
  for (const x of a) if (!b.has(x)) { n++; if (mau.length < 3) mau.push(`-${x}`); }
  for (const x of b) if (!a.has(x)) { n++; if (mau.length < 6) mau.push(`+${x}`); }
  return { n, mau };
}

const tmp = [];
try {
  const moi = join(GOC, "resolve-properties.mjs");
  const kiemTran = (g) => {
    if (!(g < TRAN)) { console.log(`VƯỢT TRẦN: bản mới ${g.toFixed(1)} giây ≥ ${TRAN} giây`); process.exitCode = 1; }
  };
  const kiemLan2 = (a, b) => {
    // lần hai trên cùng dữ liệu: không căn mới, không link mới
    if (!/\+ 0 NEW/.test(dongMoi.at(-1) ?? "") || a.property_offers.size !== b.property_offers.size) {
      console.log(`KHÔNG IDEMPOTENT: lần 2 «${dongMoi.at(-1)}» · link ${a.property_offers.size} → ${b.property_offers.size}`);
      process.exitCode = 1;
    }
  };
  if (CHI_MOI) {
    const truoc = (await anh(MOI)).property_offers.size;
    kiemTran(await chay(MOI, moi, "mới"));
    const a = await anh(MOI);
    kiemChen(dongMoi.at(-1), truoc, a.property_offers.size);
    await chay(MOI, moi, "mới lần 2");
    kiemLan2(a, await anh(MOI));
    if (!process.exitCode) console.log(`ĐẠT: dưới trần ${TRAN} giây, lần 2 không đổi`);
  } else {
    const cu = ghiTam(".resolve-cu.tmp.mjs", REV); tmp.push(cu);
    const truoc = (await anh(MOI)).property_offers.size;
    const [gCu, gMoi] = await Promise.all([chay(CU, cu, "cũ"), chay(MOI, moi, "mới")]);
    const [a, b] = await Promise.all([anh(CU), anh(MOI)]);
    kiemChen(dongMoi[0], truoc, b.property_offers.size);
    let tong = 0;
    for (const k of ["properties", "property_offers"]) {
      const d = lech(a[k], b[k]); tong += d.n;
      console.log(`${k}: cũ ${a[k].size} · mới ${b[k].size} · lệch ${d.n}`);
      for (const m of d.mau) console.log(`  ${m.slice(0, 200)}`);
    }
    await chay(MOI, moi, "mới lần 2");
    const c2 = await anh(MOI);
    for (const k of ["properties", "property_offers"]) {
      const d = lech(b[k], c2[k]); tong += d.n;
      console.log(`idempotent ${k}: lệch sau lần 2 ${d.n}`);
    }
    kiemLan2(b, c2);
    // đối chứng âm trong cùng lượt: bỏ một phần tử khỏi ảnh mới thì bộ so phải thấy lệch
    const hong = new Set(b.property_offers); hong.delete(hong.values().next().value);
    if (lech(b.property_offers, hong).n !== 1) throw new Error("so-stage-a: bộ so không thấy lệch khi bỏ một link (đối chứng âm hỏng)");
    console.log(`TỔNG lệch ${tong} · cũ ${gCu.toFixed(1)} giây · mới ${gMoi.toFixed(1)} giây · đối chứng âm thấy lệch 1`);
    kiemTran(gMoi);
    if (tong !== 0) process.exitCode = 1;
  }
} finally { for (const p of tmp) rmSync(p, { force: true }); }
