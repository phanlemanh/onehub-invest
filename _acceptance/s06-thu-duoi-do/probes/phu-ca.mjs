// s06-thu-duoi-do — E6, E9: bảng phủ ca và số đo, đếm từ phép đo thật 24 giờ của làn thu (không fixture viết tay).
// Đầu vào: thư mục phép đo (--do <dir>, mặc định $S06_DUOI_DO): nhat-ky.jsonl, bao-cao-chinh-thuc.json, snapshots/.
// Chỉ đọc. Không DB, không mạng. In mã nguồn S0x, không tên nguồn thật.
//   E6: mọi snapshot thật mà nhật ký trỏ tới đọc lại được bằng bộ nạp S06 (readSnapshot kiểm sha256), số tin trong
//       snapshot = số mục «mới» (cờ 0) của lượt đó, mã tin khớp từng cái; bảng phủ ca theo trục.
//   E9: tính lại độ trễ đăng → thu ĐỘC LẬP từ nhật ký (không gọi tinhBaoCao), so với tinhBaoCao và báo cáo chính thức,
//       đặt cạnh thước Mạnh chốt 24/11 (p50 ≤ 30′, p90 ≤ 2 giờ), số lần bị chặn = 0.
// Tự kiểm hai chiều: snapshot chép sang thư mục tạm bị lật một byte → bộ nạp từ chối; nhật ký bị bớt một mã mới →
// phép so báo LECH; độ trễ cộng 3 giờ → VUOT THUOC.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const { readSnapshot } = await import(join(ROOT, "pipeline/import-chotot.mjs"));
const { tinhBaoCao } = await import(join(ROOT, "pipeline/collect-s06-duoi.mjs"));

const i = process.argv.indexOf("--do");
const DO = i >= 0 ? process.argv[i + 1] : process.env.S06_DUOI_DO;
const che = process.argv.includes("--e9") ? "e9" : "e6";
if (!DO || !existsSync(join(DO, "nhat-ky.jsonl"))) {
  console.log(`KHONG CO PHEP DO — thiếu nhat-ky.jsonl ở «${DO ?? "(chưa khai --do / S06_DUOI_DO)"}»`);
  process.exit(2);
}
// ── ghim phép đo bằng băm (gap-probe P1): dữ liệu đổi thì dừng, không đếm trên dữ liệu khác với dữ liệu đã trình ──
const GHIM = {
  "nhat-ky.jsonl": "625c1b6ad118be6ee86aa68cc0be77404f395c98321d71d2f019f021269fffdd",
  "bao-cao-chinh-thuc.json": "92845744314d8a43d3a845aaa37953b2313114ca9ef27f80d881cb40737895e3",
  "snapshots/*/manifest.json": "4b624392ea86cc8b3da2a3a15ac03efb0bac70a0768f84841c556162e37ffe4d",
};
const bam = (buf) => createHash("sha256").update(buf).digest("hex");
function bamManifest(goc) {
  const dongs = [];
  if (existsSync(goc)) for (const city of readdirSync(goc)) for (const d of readdirSync(join(goc, city))) {
    const m = join(goc, city, d, "manifest.json");
    if (existsSync(m)) dongs.push(`${d} ${bam(readFileSync(m))}`);
  }
  return bam(dongs.sort().join("\n") + "\n");
}
const thuc = {
  "nhat-ky.jsonl": bam(readFileSync(join(DO, "nhat-ky.jsonl"))),
  "bao-cao-chinh-thuc.json": existsSync(join(DO, "bao-cao-chinh-thuc.json")) ? bam(readFileSync(join(DO, "bao-cao-chinh-thuc.json"))) : "vang",
  "snapshots/*/manifest.json": bamManifest(join(DO, "snapshots")),
};
const doi = Object.keys(GHIM).filter((k) => GHIM[k] !== thuc[k]);
if (doi.length) { console.log(`PHEP DO DA DOI — băm lệch: ${doi.join(", ")}`); process.exit(3); }
console.log("ghim phep do: băm nhật ký, báo cáo, 231 manifest khớp");
{ const lech = bam(Buffer.concat([readFileSync(join(DO, "nhat-ky.jsonl")), Buffer.from("{}\n")])) !== GHIM["nhat-ky.jsonl"];
  console.log(`tu kiem ghim: thêm một dòng vào bản chép nhật ký → ${lech ? "BAM LECH" : "BAM KHOP (HONG)"}`);
  if (!lech) { console.log("TU KIEM HONG"); process.exit(1); } }
const dong = readFileSync(join(DO, "nhat-ky.jsonl"), "utf8").split("\n").filter((s) => s.trim()).map((s) => JSON.parse(s));
const phien = dong.filter((d) => d.k === "phien");
let loi = 0;
const ok = (dk, msg) => { if (!dk) { loi++; console.log(`  LECH ${msg}`); } return dk; };

// ── tìm thư mục snapshot theo mã ─────────────────────────────────────────────
const thuMuc = new Map();
const gocSnap = join(DO, "snapshots");
if (existsSync(gocSnap)) for (const city of readdirSync(gocSnap)) for (const d of readdirSync(join(gocSnap, city))) thuMuc.set(d, join(gocSnap, city, d));

/** So một lượt với snapshot của nó: trả null khi khớp, chuỗi lý do khi lệch. */
function soLuot(d, items) {
  const moi = d.trang.flatMap((t) => t.tin.filter((x) => x[3] === 0).map((x) => `ct-${x[0]}`));
  const tuSnap = items.map((it) => it.sourceId);
  if (moi.length !== tuSnap.length) return `số tin ${tuSnap.length} ≠ số mục mới ${moi.length}`;
  const a = new Set(moi);
  const thua = tuSnap.filter((s) => !a.has(s));
  return thua.length ? `${thua.length} mã trong snapshot không có trong nhật ký` : null;
}

if (che === "e6") {
  // ── bảng phủ ca ────────────────────────────────────────────────────────────
  const dem = (f) => phien.reduce((m, d) => { const k = f(d); m[k] = (m[k] ?? 0) + 1; return m; }, {});
  const inTruc = (ten, m) => console.log(`truc ${ten}: ${Object.entries(m).sort().map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  console.log(`phep do: ${phien.length} lượt · ${phien.reduce((s, d) => s + d.soLoiGoi, 0)} lời gọi · nguồn S06`);
  inTruc("ly-do-dung", dem((d) => d.lyDoDung ?? "null"));
  inTruc("so-trang", dem((d) => String(d.trang.length)));
  inTruc("ket-cuc", dem((d) => (d.chan ? "bi-chan" : d.dbLoi ? "db-loi" : d.loiNguon ? "loi-mang" : d.vuotTran ? "vuot-tran" : "chay-duoc")));
  inTruc("http", phien.flatMap((d) => d.trang).reduce((m, t) => { const k = `${t.http}/lan${t.soLan}`; m[k] = (m[k] ?? 0) + 1; return m; }, {}));
  inTruc("trang1-tin-moi", dem((d) => { const n = d.trang[0]?.soMoi ?? -1; return n < 0 ? "khong-trang" : n === 0 ? "0" : n <= 5 ? "1-5" : n <= 20 ? "6-20" : ">20"; }));
  const tron = phien.flatMap((d) => d.trang).filter((t) => t.soMoi > 0 && t.soDaCo > 0);
  console.log(`truc trang-tron (mới lẫn đã có): ${tron.length} trang · tin mới ở trang 2–3: ${phien.flatMap((d) => d.trang).filter((t) => t.so > 1 && t.soMoi > 0).length} trang`);
  const tin = phien.flatMap((d) => d.trang.flatMap((t) => t.tin));
  console.log(`truc gio-dang: có orig_list_time ${tin.filter((x) => x[2]).length} · không có ${tin.filter((x) => !x[2]).length}`);

  // ── đọc lại từng snapshot thật bằng bộ nạp ────────────────────────────────
  const coSnap = phien.filter((d) => d.snapshot);
  let docDuoc = 0, tongTin = 0;
  for (const d of coSnap) {
    const dir = thuMuc.get(d.snapshot);
    if (!ok(dir, `lượt ${d.phien}: không thấy thư mục snapshot ${d.snapshot}`)) continue;
    const s = await readSnapshot(dir);
    docDuoc++;
    tongTin += s.items.length;
    const ly = soLuot(d, s.items);
    ok(!ly, `lượt ${d.phien} (${d.snapshot}): ${ly}`);
    ok(s.items.every((it) => it.source === "chotot-ads" && /^ct-\d+$/.test(it.sourceId) && it.kind === "ad" && it.meta?.page >= 1), `lượt ${d.phien}: item lệch khuôn bộ nạp`);
  }
  const khongSnapCoMoi = phien.filter((d) => !d.snapshot && d.trang.some((t) => t.soMoi > 0));
  ok(khongSnapCoMoi.length === 0, `${khongSnapCoMoi.length} lượt có tin mới mà không ghi snapshot`);
  console.log(`snapshot: nhật ký trỏ ${coSnap.length} · đọc lại được ${docDuoc} (sha256 khớp manifest) · tổng ${tongTin} tin = tổng mục mới ${phien.reduce((s, d) => s + d.trang.reduce((a, t) => a + t.soMoi, 0), 0)}`);

  // ── tự kiểm ────────────────────────────────────────────────────────────────
  const mau = coSnap.find((d) => thuMuc.get(d.snapshot));
  if (mau) {
    const tam = mkdtempSync(join(tmpdir(), "s06-duoi-phu-ca-"));
    try {
      const dst = join(tam, mau.snapshot);
      cpSync(thuMuc.get(mau.snapshot), dst, { recursive: true });
      const gz = readdirSync(dst).find((f) => f.startsWith("items-"));
      const b = readFileSync(join(dst, gz)); b[b.length - 1] ^= 0xff; writeFileSync(join(dst, gz), b);
      let tuChoi = false;
      try { await readSnapshot(dst); } catch { tuChoi = true; }
      console.log(`tu kiem: lật một byte trong bản chép → bộ nạp ${tuChoi ? "TU CHOI" : "NHAN (HONG)"}`);
      if (!tuChoi) { loi++; console.log("TU KIEM HONG"); }
      const s = await readSnapshot(thuMuc.get(mau.snapshot));
      const bot = structuredClone(mau);
      const t = bot.trang.find((x) => x.tin.some((y) => y[3] === 0));
      t.tin.find((y) => y[3] === 0)[3] = 1;
      const ly = soLuot(bot, s.items);
      console.log(`tu kiem: bớt một mã mới khỏi nhật ký → ${ly ? "LECH" : "KHOP (HONG)"}`);
      if (!ly) { loi++; console.log("TU KIEM HONG"); }
    } finally { rmSync(tam, { recursive: true, force: true }); }
  }
  console.log(loi ? `PHU-CA DO (${loi})` : "PHU-CA OK");
  process.exit(loi ? 1 : 0);
}

// ── E9: số đo ────────────────────────────────────────────────────────────────
const bc = JSON.parse(readFileSync(join(DO, "bao-cao-chinh-thuc.json"), "utf8"));
const t0 = Date.parse(bc.cuaSo.t0), t1 = Date.parse(bc.cuaSo.t1);
function doTreDocLap(ds, lech = 0) {
  const xs = [];
  for (const d of ds) {
    if (d.dbLoi || d.chan || d.loiNguon) continue;
    for (const t of d.trang) for (const [, lt, ot, daCo] of t.tin) {
      if (daCo !== 0) continue;
      const g = ot || lt;
      if (g < t0 || g >= t1) continue;
      const s = (Date.parse(t.luc) + lech - g) / 1000;
      if (s >= 0) xs.push(Math.round(s * 10) / 10);
    }
  }
  xs.sort((a, b) => a - b);
  const pv = (p) => (xs.length ? xs[Math.max(0, Math.ceil(p * xs.length) - 1)] : null);
  return { n: xs.length, p50: pv(0.5), p90: pv(0.9) };
}
const thuoc = (r) => r.p50 !== null && r.p50 <= 30 * 60 && r.p90 <= 120 * 60;
const dl = doTreDocLap(phien);
const tb = tinhBaoCao(dong, { t0, t1 });
const chan = phien.reduce((s, d) => s + (d.chan ?? 0), 0);
console.log(`do tre doc lap: ${dl.n} tin · p50 ${(dl.p50 / 60).toFixed(1)}′ · p90 ${(dl.p90 / 60).toFixed(1)}′`);
ok(dl.n === tb.doTre.soLuong && dl.p50 === tb.doTre.p50 && dl.p90 === tb.doTre.p90, `tính độc lập lệch tinhBaoCao (${tb.doTre.soLuong}/${tb.doTre.p50}/${tb.doTre.p90})`);
ok(dl.n === bc.doTre.soLuong && dl.p50 === bc.doTre.p50 && dl.p90 === bc.doTre.p90, `tính độc lập lệch báo cáo chính thức (${bc.doTre.soLuong}/${bc.doTre.p50}/${bc.doTre.p90})`);
console.log(`bat duoc (báo cáo chính thức, so lượt quét đủ đã nạp xong): ${bc.batDuoc?.batDuoc}/${bc.batDuoc?.tinMoi} · bị chặn ${chan} · lời gọi/phút ${tb.loiGoiMoiPhut}`);
ok(chan === 0, `bị chặn ${chan} lần`);
ok(bc.batDuoc?.tiLe === 1 && bc.quetDuNapXong?.xong === true, "tỉ lệ bắt được không phải 1 trên lượt quét đủ đã nạp xong");
console.log(`thuoc 24/11 (p50 ≤ 30′, p90 ≤ 2 giờ): ${thuoc(dl) ? "DAT" : "VUOT THUOC"}`);
ok(thuoc(dl), "vượt thước");
const pha = doTreDocLap(phien, 3 * 3600_000);
console.log(`tu kiem: cộng 3 giờ vào giờ lấy → ${thuoc(pha) ? "DAT (HONG)" : "VUOT THUOC"}`);
if (thuoc(pha)) { loi++; console.log("TU KIEM HONG"); }
console.log(loi ? `SO-DO DO (${loi})` : "SO-DO OK");
process.exit(loi ? 1 : 0);
