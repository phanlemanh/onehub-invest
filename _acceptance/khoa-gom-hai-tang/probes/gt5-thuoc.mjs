#!/usr/bin/env node
// GT5 E9 (AC-9): thước chất lượng của khoá gom, tính lại từ nhãn thô mỗi lần.
//   Mẫu giữ riêng (research-local, gitignored): payload.json (băm khớp payload.sha256), map.json (bản chữ → bài), nhãn thô của hai model
//   (nhan-opus*.json, nhan-sonnet*.json). Nhãn = chỗ hai model cùng «mot-can» và cùng cách chia nhóm; cùng «ro»/«tim-mua» thì ngoài đơn vị;
//   còn lại là bất đồng (bị loại, đếm). Đơn vị: tin cũ có nhãn đồng thuận; «gộp nhầm» = có tin trong thành phần đang xét chứa bài của
//   hai nhóm nhãn khác nhau. Ước lượng điểm + cận Wilson 95%.
//   Tách nhầm: 40 cặp audit 09–10/11 (sample_tach.csv + nhan-tach-40.csv); cặp nhãn «cung» mà hai tin cũ không chung một tin.
//   Tách nhóm (--tach-nhom, Hỏi-6 lối B, Mạnh 20/11; mẫu ba trở đi): nhóm cùng căn của nhãn đồng thuận có bài nằm ở từ hai tin của
//   thành phần đang xét; mẫu số = mọi nhóm của các tin có nhãn đồng thuận. Ngưỡng ≤ 35%.
//   Đạt: gộp nhầm sau < 5%, n ≥ 60, bất đồng ≤ 20% mẫu, tách nhầm sau ≤ trước (và tách nhóm sau ≤ 35% khi có cờ). Quét payload: 0 tên nguồn thật (source_registry).
// Dùng: node gt5-thuoc.mjs --mau <dir> --audit <dir> --truoc s1.json --sau s4.json --ra <bao-cao.json> | --kiem <bao-cao.json>
//   (DATABASE_URL = DB thử oneinvest_gt5_* để đọc bài của cặp audit và tên nguồn)
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const { findSourceNames } = await import(join(ROOT, "pipeline/lib/mask-source-names.mjs"));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const [MAU, AUDIT, TRUOC, SAU, RA, KIEM] = ["--mau", "--audit", "--truoc", "--sau", "--ra", "--kiem"].map(arg);
const TACH_NHOM = process.argv.includes("--tach-nhom");
const URL_ = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_gt5_[a-z0-9_]+$/.test(URL_.replace(/\?.*$/, ""))) { console.error("ĐỎ: DATABASE_URL phải là DB thử oneinvest_gt5_*"); process.exit(2); }
const J = (p) => JSON.parse(readFileSync(p, "utf8"));
const NGUONG = { gopNham: 0.05, nToiThieu: 60, batDong: 0.2, tachNhom: 0.35 };

function wilson(k, n) {
  if (!n) return [0, 1];
  const z = 1.96, p = k / n, d = 1 + z * z / n, m = p + z * z / (2 * n), r = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(m - r) / d, (m + r) / d].map((x) => Math.round(x * 1e4) / 1e4);
}

// ---- mẫu giữ riêng ----
const raw = readFileSync(join(MAU, "payload.json"), "utf8");
const bamGhi = readFileSync(join(MAU, "payload.sha256"), "utf8").split(/\s+/)[0];
if (createHash("sha256").update(raw).digest("hex") !== bamGhi) { console.log("ĐỎ: payload.json đổi sau khi dựng (băm lệch)"); process.exit(1); }
const payload = JSON.parse(raw);
const c = new pg.Client({ connectionString: URL_ });
await c.connect();
const ten = (await c.query(`SELECT code, real_name FROM source_registry WHERE real_name IS NOT NULL AND real_name <> ''`)).rows.map((r) => ({ code: r.code, realName: r.real_name }));
if (!ten.length) { console.log("ĐỎ: source_registry rỗng — không quét được tên nguồn (đóng chặt)"); process.exit(1); }
const lo = payload.flatMap((t) => t.ban_chu.filter((b) => findSourceNames(b.chu, ten).length).map((b) => b.id));
console.log(`quét payload: ${payload.reduce((s, t) => s + t.ban_chu.length, 0)} bản chữ · tên nguồn thật ${lo.length}`);
if (lo.length) { console.log(`ĐỎ: payload còn tên nguồn thật ở ${lo.slice(0, 5).join(", ")}`); process.exit(1); }

const gom = (re) => readdirSync(MAU).filter((f) => re.test(f)).sort().flatMap((f) => J(join(MAU, f)));
const [nhanA, nhanB] = [gom(/^nhan-opus(-them)?\.json$/), gom(/^nhan-sonnet(-them)?\.json$/)];
const theo = (ds) => new Map(ds.map((x) => [x.tin, x]));
const [A, B] = [theo(nhanA), theo(nhanB)];
const chuan = (n) => n.map((g) => [...g].sort().join("+")).sort().join(" | ");
const map = new Map(J(join(MAU, "map.json")).map((m) => [m.id, m.post_ids]));
const nhan = []; let batDong = 0, ngoai = 0;
for (const t of payload) {
  const [a, b] = [A.get(t.tin), B.get(t.tin)];
  if (!a || !b) { batDong++; continue; }
  if (a.loai === "mot-can" && b.loai === "mot-can" && chuan(a.nhom) === chuan(b.nhom)) nhan.push({ tin: t.tin, nhom: a.nhom });
  else if (a.loai === b.loai && (a.loai === "ro" || a.loai === "tim-mua")) ngoai++;
  else batDong++;
}
const tinCua = (snap) => { const m = new Map(); for (const [k, ps] of Object.entries(snap)) for (const p of ps) m.set(p, k); return m; };
const [T, S] = [tinCua(J(TRUOC)), tinCua(J(SAU))];
function gopNham(thanhPhan) {
  let k = 0; const ds = [];
  for (const x of nhan) {
    const nhomCuaTin = new Map(); // offer → tập chỉ số nhóm nhãn
    x.nhom.forEach((g, i) => { for (const id of g) for (const p of map.get(id) ?? []) { const o = thanhPhan.get(p); if (o) nhomCuaTin.set(o, new Set([...(nhomCuaTin.get(o) ?? []), i])); } });
    if ([...nhomCuaTin.values()].some((s) => s.size > 1)) { k++; ds.push(x.tin); }
  }
  return { k, ds };
}
const [g0, g1] = [gopNham(T), gopNham(S)];
function tachNhom(thanhPhan) {
  let k = 0, tong = 0;
  for (const x of nhan) x.nhom.forEach((g) => {
    tong++;
    const o = new Set(g.flatMap((id) => (map.get(id) ?? []).map((p) => thanhPhan.get(p)).filter(Boolean)));
    if (o.size > 1) k++;
  });
  return { k, tong };
}
const n = nhan.length, soCung = nhan.filter((x) => x.nhom.length === 1).length;

// ---- tách nhầm: 40 cặp audit ----
const csv = (f) => { const [h, ...d] = readFileSync(join(AUDIT, f), "utf8").trim().split("\n"); const k = h.split(","); return d.map((l) => Object.fromEntries(l.split(",").map((v, i) => [k[i], v]))); };
const cap = csv("sample_tach.csv"), nhanCap = csv("nhan-tach-40.csv");
const ids = [...new Set(cap.flatMap((r) => [r.a, r.b]))];
const baiCua = new Map((await c.query(`SELECT offer_id, post_ids FROM sale_offer_records WHERE offer_id = ANY($1::text[])`, [ids])).rows.map((r) => [r.offer_id, r.post_ids]));
await c.end();
const cungTin = (tp, a, b) => { const oa = new Set((baiCua.get(a) ?? []).map((p) => tp.get(p)).filter(Boolean)); return (baiCua.get(b) ?? []).some((p) => oa.has(tp.get(p))); };
const capCung = cap.map((r, i) => ({ ...r, nhan: nhanCap[i]?.nhan })).filter((r) => r.nhan === "cung");
const tach = (tp) => capCung.filter((r) => !cungTin(tp, r.a, r.b)).length;
const [t0, t1] = [tach(T), tach(S)];

const bao = {
  mau: { tin: payload.length, nhan_dong_thuan: n, cung: soCung, khac: n - soCung, ngoai_don_vi: ngoai, bat_dong: batDong, ti_le_bat_dong: +(batDong / payload.length).toFixed(4) },
  gop_nham: { truoc: { k: g0.k, n, ti_le: n ? +(g0.k / n).toFixed(4) : null, wilson95: wilson(g0.k, n) }, sau: { k: g1.k, n, ti_le: n ? +(g1.k / n).toFixed(4) : null, wilson95: wilson(g1.k, n), tin: g1.ds } },
  tach_nham: { cap_cung: capCung.length, truoc: { k: t0, wilson95: wilson(t0, capCung.length) }, sau: { k: t1, wilson95: wilson(t1, capCung.length) } },
};
if (TACH_NHOM) {
  const [a, b] = [tachNhom(T), tachNhom(S)];
  bao.tach_nhom = { nhom: a.tong, truoc: { k: a.k, wilson95: wilson(a.k, a.tong) }, sau: { k: b.k, ti_le: a.tong ? +(b.k / a.tong).toFixed(4) : null, wilson95: wilson(b.k, b.tong) } };
}
const pc = (x) => `${(x * 100).toFixed(1)}%`;
console.log(`mẫu ${bao.mau.tin} tin · nhãn đồng thuận ${n} (cùng căn ${soCung}, khác căn ${n - soCung}) · ngoài đơn vị ${ngoai} · bất đồng ${batDong} (${pc(bao.mau.ti_le_bat_dong)})`);
console.log(`gộp nhầm: trước ${g0.k}/${n} = ${pc(g0.k / (n || 1))} [${bao.gop_nham.truoc.wilson95.map(pc).join("; ")}] → sau ${g1.k}/${n} = ${pc(g1.k / (n || 1))} [${bao.gop_nham.sau.wilson95.map(pc).join("; ")}]`);
console.log(`tách nhầm (cặp audit nhãn cùng căn ${capCung.length}): trước ${t0} → sau ${t1}`);
if (bao.tach_nhom) console.log(`tách nhóm cùng căn: trước ${bao.tach_nhom.truoc.k}/${bao.tach_nhom.nhom} → sau ${bao.tach_nhom.sau.k}/${bao.tach_nhom.nhom} = ${pc(bao.tach_nhom.sau.ti_le ?? 0)} [${bao.tach_nhom.sau.wilson95.map(pc).join("; ")}]`);

if (KIEM) {
  const cu = J(KIEM);
  if (JSON.stringify(cu) !== JSON.stringify(bao)) { console.log(`ĐỎ: báo cáo ${KIEM.split("/").pop()} lệch số tính lại từ nhãn thô`); process.exit(1); }
  console.log("đạt: báo cáo khớp số tính lại từ nhãn thô");
}
if (RA) writeFileSync(RA, JSON.stringify(bao, null, 1) + "\n");
let rc = 0;
const chk = (dk, msg) => { console.log(`${dk ? "đạt" : "ĐỎ"}: ${msg}`); if (!dk) rc = 1; };
chk(n >= NGUONG.nToiThieu, `n ${n} ≥ ${NGUONG.nToiThieu}`);
chk(bao.mau.ti_le_bat_dong <= NGUONG.batDong, `bất đồng ${pc(bao.mau.ti_le_bat_dong)} ≤ 20%`);
chk(n > 0 && g1.k / n < NGUONG.gopNham, `gộp nhầm sau ${pc(g1.k / (n || 1))} < 5%`);
chk(t1 <= t0, `tách nhầm không tăng (${t0} → ${t1})`);
if (bao.tach_nhom) chk(bao.tach_nhom.nhom > 0 && bao.tach_nhom.sau.k / bao.tach_nhom.nhom <= NGUONG.tachNhom, `tách nhóm sau ${pc(bao.tach_nhom.sau.ti_le ?? 0)} ≤ 35%`);
process.exit(rc);
