// do.mjs — hồ sơ sdt-luu-goc-e164 (SD3): phép đo trên DB THỬ chép từ máy thu (db/db-thu.sh, xoá khi xong).
//   node do.mjs mig       E2 — áp 060 hai lần, lần hai không đổi; từ vựng sdt; đỏ 'KHONG IDEMPOTENT'
//   node do.mjs du-lieu   E3 — tin +84…, khoá tin và căn theo E.164; đỏ 'BAM SAI DANG', 'MAT KHOA CAN'
//   node do.mjs danh-ba   E4 — bí danh sdt giữ party_key, nghỉ sdt_bam, lượt hai 0; đỏ 'NGUOI MOI THAY VI GIU'
//   node do.mjs sellers   E5 — view sellers so bảng cũ + câu độc lập, giữ tên; đỏ 'LECH COT n_rent', 'MAT TEN NGUOI BAN'
//   node do.mjs cloud     E7 — câu đọc thật của sync-cloud không mang số gốc; đỏ 'LOT SO GOC'
// Không bao giờ chạy trên DB `oneinvest`; mọi số in là số đếm, không in SĐT.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const MIG = readFileSync(path.join(ROOT, "db/migrations/060_sdt_e164.sql"), "utf8");
const PHAN = process.argv[2];
const TEN = `oneinvest_p4_sd3_${String(PHAN).replace(/-/g, "_")}`;
const DB_URL = `postgres://oneinvest:oneinvest@localhost:5433/${TEN}`;
if (!/^oneinvest_p4_sd3_[a-z_]+$/.test(TEN)) throw new Error("tên DB thử sai khuôn");
const ok = (s) => console.log(`ok ${s}`);
const bam = (s) => createHash("sha256").update(s).digest("hex").slice(0, 32);
const e164 = (so0) => "+84" + so0.slice(1);
const SO0 = /^0[35789]\d{8}$/;

function dbThu(xoa = false) {
  const r = spawnSync("bash", ["db/db-thu.sh", TEN, ...(xoa ? ["--xoa"] : [])], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0 && !xoa) throw new Error(`db-thu lỗi: ${r.stderr.slice(-300)}`);
}
async function moi() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}
const node = (args, env = {}) =>
  spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL, ...env }, timeout: 600_000 });
function dungNguoi() {
  const r = node(["pipeline/dung-nguoi.mjs"]);
  assert.equal(r.status, 0, `dung-nguoi thoát ${r.status}: ${r.stderr.slice(-300)}`);
  return r.stdout;
}
/** refresh-bait-gap ĐỜI TRƯỚC (bảng sellers ghi tay) ở gốc chung với nhánh chính: bung pipeline/ + db/ của gốc đó ra thư mục
 *  tạm, mượn node_modules của pipeline/ — để chụp bảng cũ đúng như đêm cuối trước 060 sẽ để lại. */
function refreshCu() {
  const goc = spawnSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  assert.match(goc, /^[0-9a-f]{40}$/, "không tìm được gốc chung với origin/main");
  const tam = mkdtempSync(path.join(os.tmpdir(), "sd3-refresh-cu-"));
  try {
    const bung = spawnSync("bash", ["-c", `git archive ${goc} pipeline db | tar -x -C "${tam}"`], { cwd: ROOT, encoding: "utf8" });
    assert.equal(bung.status, 0, `bung gốc chung lỗi: ${bung.stderr.slice(-300)}`);
    symlinkSync(path.join(ROOT, "pipeline/node_modules"), path.join(tam, "pipeline/node_modules"));
    const r = node([path.join(tam, "pipeline/refresh-bait-gap.mjs")]);
    assert.equal(r.status, 0, `refresh-bait-gap đời trước thoát ${r.status}: ${r.stderr.slice(-300)}`);
  } finally { rmSync(tam, { recursive: true, force: true }); }
}
/** Chạy `fn` trong BEGIN … ROLLBACK. */
async function thu(c, fn) {
  await c.query("BEGIN");
  try { return await fn(); } finally { await c.query("ROLLBACK"); }
}

/** Ánh xạ khoá cũ → E.164 dựng từ bản ghi tin còn dạng 0… (trước 060), bằng node:crypto. */
async function anhXa(c) {
  const { rows } = await c.query(`SELECT DISTINCT seller_phone FROM sale_offer_records WHERE seller_phone IS NOT NULL`);
  const m = new Map();
  for (const { seller_phone: s } of rows) if (SO0.test(s)) m.set(bam(s), e164(s));
  return m;
}

// ---------------------------------------------------------------------------------------------------------- mig (E2)
async function chupLuocDo(c) {
  const { rows: [r] } = await c.query(`
    SELECT md5(coalesce((SELECT string_agg(table_name || '.' || column_name || ':' || data_type, ',' ORDER BY 1)
                         FROM information_schema.columns WHERE table_schema = 'public'
                           AND table_name IN ('registry_aliases', 'sellers', 'sale_offer_records', 'properties')), '')) AS cot,
           md5(coalesce((SELECT string_agg(indexdef, ',' ORDER BY 1) FROM pg_indexes WHERE tablename = 'registry_aliases'), '')) AS idx,
           md5(pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conname = 'registry_aliases_kind_check'))) AS chk,
           md5(coalesce(pg_get_viewdef('sellers'::regclass), '')) AS view,
           md5(coalesce((SELECT string_agg(offer_id || coalesce(seller_phone, '-') || coalesce(seller_phone_hash, '-'), ',' ORDER BY offer_id)
                         FROM sale_offer_records), '')) AS tin,
           md5(coalesce((SELECT string_agg(coalesce(seller_phone_hash, '-'), ',' ORDER BY 1) FROM properties), '')) AS can,
           (SELECT count(*) FROM registry_aliases) AS bi_danh,
           (SELECT count(*) FROM ref_lookup) AS ref`);
  return r;
}
async function mig() {
  const c = await moi();
  try {
    await c.query(MIG);
    const s1 = await chupLuocDo(c);
    await c.query(MIG);
    const s2 = await chupLuocDo(c);
    const soSanh = (a, b) => { for (const k of Object.keys(a)) if (a[k] !== b[k]) throw new Error(`KHONG IDEMPOTENT: ${k}`); };
    soSanh(s1, s2);
    ok(`áp 060 hai lần: lược đồ, chỉ mục, CHECK, view, ${8} chữ ký trùng`);
    const { rows: [k] } = await c.query(`SELECT pg_get_constraintdef(oid) d FROM pg_constraint WHERE conname = 'registry_aliases_kind_check'`);
    assert.match(k.d, /'sdt'::text/);
    const { rows: [ix] } = await c.query(`SELECT indexdef d FROM pg_indexes WHERE indexname = 'registry_aliases_dinh_danh_uq'`);
    assert.match(ix.d, /'sdt'::text/);
    const { rows: ref } = await c.query(`SELECT label_vi FROM ref_lookup WHERE lookup_name = 'alias_kind' AND lookup_value = 'sdt'`);
    assert.equal(ref.length, 1);
    const v = node(["pipeline/vocab.mjs", "--check-db"]);
    assert.equal(v.status, 0, `vocab --check-db thoát ${v.status}: ${(v.stdout + v.stderr).slice(-300)}`);
    ok("CHECK, chỉ mục định danh và ref_lookup có 'sdt'; vocab --check-db exit 0");
    const sai = MIG.replace("WHERE seller_phone ~ '^0[35789][0-9]{8}$';", ";");
    assert.notEqual(sai, MIG);
    await thu(c, async () => {
      await c.query(sai);
      const s3 = await chupLuocDo(c);
      assert.throws(() => soSanh(s2, s3), /KHONG IDEMPOTENT: tin/);
    });
    ok("đối chứng đỏ: bản chép bỏ điều kiện dạng cũ ở bước đổi dạng → bắt 'KHONG IDEMPOTENT: tin'");
    console.log("MIG OK");
  } finally { await c.end(); }
}

// ------------------------------------------------------------------------------------------------------ du-lieu (E3)
async function kiemDuLieu(c, truoc) {
  const { rows: [d] } = await c.query(`SELECT count(*)::int n, count(*) FILTER (WHERE seller_phone !~ '^\\+84[35789][0-9]{8}$')::int sai
                                       FROM sale_offer_records WHERE seller_phone IS NOT NULL`);
  if (d.sai) throw new Error(`DANG SAI: ${d.sai}`);
  if (d.n !== truoc.nHopLe) throw new Error(`SO TIN CO SDT LECH: ${truoc.nHopLe} → ${d.n}`);
  const { rows } = await c.query(`SELECT seller_phone, seller_phone_hash FROM sale_offer_records WHERE seller_phone IS NOT NULL`);
  for (const r of rows) if (r.seller_phone_hash !== bam(r.seller_phone)) throw new Error("BAM SAI DANG: khoá tin không bằng sha256 của E.164");
  const { rows: can } = await c.query(`SELECT id::text, seller_phone_hash FROM properties WHERE seller_phone_hash IS NOT NULL`);
  if (can.length !== truoc.can.size) throw new Error(`MAT KHOA CAN: khác null ${truoc.can.size} → ${can.length}`);
  for (const r of can) {
    const cu = truoc.can.get(r.id);
    const mong = truoc.map.has(cu) ? bam(truoc.map.get(cu)) : cu;
    if (r.seller_phone_hash !== mong) throw new Error("MAT KHOA CAN: khoá căn không theo ánh xạ");
  }
  return { tin: d.n, can: can.length };
}
async function duLieu() {
  const c = await moi();
  try {
    // Hôm nay không căn nào mang khoá SĐT: gắn khoá cũ của 3 số cho 3 căn (fixture trên DB thử) để phép đo có ô.
    const map = await anhXa(c);
    const cu = [...map.keys()].slice(0, 3);
    await c.query(`UPDATE properties SET seller_phone_hash = x.h FROM (SELECT id, (ARRAY[$1, $2, $3])[row_number() OVER (ORDER BY id)] h
                   FROM properties ORDER BY id LIMIT 3) x WHERE properties.id = x.id`, cu);
    const { rows: [n] } = await c.query(`SELECT count(*)::int n FROM sale_offer_records WHERE seller_phone ~ '^0[35789][0-9]{8}$'`);
    const { rows: can } = await c.query(`SELECT id::text, seller_phone_hash FROM properties WHERE seller_phone_hash IS NOT NULL`);
    const truoc = { nHopLe: n.n, map, can: new Map(can.map((r) => [r.id, r.seller_phone_hash])) };
    for (const [ten, tim, thay, bat] of [
      ["băm từ dạng 0…", "seller_phone_hash = left(encode(sha256(convert_to('+84' || substr(seller_phone, 2), 'UTF8')), 'hex'), 32)\nWHERE seller_phone ~",
        "seller_phone_hash = left(encode(sha256(convert_to(seller_phone, 'UTF8')), 'hex'), 32)\nWHERE seller_phone ~", /BAM SAI DANG/],
      ["đặt null khoá căn", "SET seller_phone_hash = m.moi", "SET seller_phone_hash = NULL", /MAT KHOA CAN/],
    ]) {
      const sai = MIG.replace(tim, thay);
      assert.notEqual(sai, MIG, `bản chép «${ten}» không đổi được`);
      await thu(c, async () => { await c.query(sai); await assert.rejects(kiemDuLieu(c, truoc), bat); });
      ok(`đối chứng đỏ: ${ten} → bắt ${bat}`);
    }
    await c.query(MIG);
    const kq = await kiemDuLieu(c, truoc);
    ok(`sau 060: ${kq.tin} tin có SĐT đều +84… (trước: ${truoc.nHopLe} số hợp lệ), khoá tin = sha256(E.164), ${kq.can} khoá căn theo ánh xạ`);
    console.log("DU LIEU OK");
  } finally { await c.end(); }
}

// ------------------------------------------------------------------------------------------------------ danh-ba (E4)
async function kiemDanhBa(c, truoc) {
  const { rows: sdt } = await c.query(`SELECT object_key, value FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL`);
  const theo = new Map();
  for (const r of sdt) theo.set(r.object_key, new Set([...(theo.get(r.object_key) ?? []), r.value]));
  for (const [pty, so] of truoc.nguoi) {
    const mong = new Set([...so].filter((h) => truoc.map.has(h)).map((h) => truoc.map.get(h)));
    if (!mong.size) continue;
    const co = theo.get(pty) ?? new Set();
    if ([...mong].some((x) => !co.has(x))) throw new Error("NGUOI MOI THAY VI GIU: người cũ không mang bí danh sdt của số cũ");
  }
  const { rows: [d] } = await c.query(`SELECT (SELECT count(*) FROM registry_aliases WHERE kind = 'sdt_bam' AND retired_at IS NULL)::int song,
                                              (SELECT count(*) FROM registry_aliases WHERE kind = 'sdt_bam')::int tong`);
  assert.equal(d.song, 0, "còn sdt_bam hiệu lực");
  assert.equal(d.tong, truoc.tongBam, "dòng sdt_bam cũ bị xoá");
  return { nguoiSdt: theo.size };
}
async function danhBa() {
  const c = await moi();
  try {
    const map = await anhXa(c);
    const { rows } = await c.query(`SELECT object_key, value FROM registry_aliases WHERE kind = 'sdt_bam' AND retired_at IS NULL`);
    const nguoi = new Map();
    for (const r of rows) nguoi.set(r.object_key, new Set([...(nguoi.get(r.object_key) ?? []), r.value]));
    const truoc = { map, nguoi, tongBam: rows.length };
    const coMap = [...nguoi.values()].filter((s) => [...s].some((h) => map.has(h))).length;
    // Đối chứng đỏ: bản chép bộ dựng bỏ tra sdt_bam đời trước, chạy trong giao dịch.
    const LIB = path.join(ROOT, "pipeline/lib/danh-ba-nguoi.mjs");
    const goc = readFileSync(LIB, "utf8");
    const sai = goc.replace("    if (cu) return themBiDanh(source, ALIAS_KIND.sdt, e164, cu);\n", "");
    assert.notEqual(sai, goc);
    const ban = path.join(path.dirname(LIB), `.ban-${process.pid}-danh-ba-nguoi.mjs`);
    writeFileSync(ban, sai);
    try {
      const m = await import(pathToFileURL(ban).href);
      await thu(c, async () => {
        await c.query(MIG);
        await m.dungNguoi(c, { out: () => {} });
        await assert.rejects(kiemDanhBa(c, truoc), /NGUOI MOI THAY VI GIU/);
      });
    } finally { rmSync(ban, { force: true }); }
    ok("đối chứng đỏ: bản chép bỏ tra sdt_bam đời trước → bắt 'NGUOI MOI THAY VI GIU'");
    await c.query(MIG);
    dungNguoi();
    const kq = await kiemDanhBa(c, truoc);
    const dem = async () => (await c.query(`SELECT (SELECT count(*) FROM registry_aliases)::int a, (SELECT count(*) FROM parties)::int p`)).rows[0];
    const l1 = await dem();
    dungNguoi();
    assert.deepEqual(await dem(), l1, "lượt hai thêm bí danh hoặc người");
    ok(`người có sdt_bam trước 060: ${nguoi.size} (có số hợp lệ ${coMap}) · người có sdt sau: ${kq.nguoiSdt} · sdt_bam hiệu lực 0, ${truoc.tongBam} dòng cũ giữ với retired_at · lượt hai +0`);
    console.log("DANH BA OK");
  } finally { await c.end(); }
}

// ------------------------------------------------------------------------------------------------------ sellers (E5)
const COT = ["phone_hash", "name", "sources", "n_ads", "first_seen", "last_seen", "f.n_sale", "f.n_rent", "f.median_gap_pct", "f.n_good_deals", "f.multi_channel", "f.sources"];
function oCua(r) {
  const f = r.flags ?? {};
  return [r.phone_hash, r.name, [...(r.sources ?? [])].sort().join(","), Number(r.n_ads), +new Date(r.first_seen), +new Date(r.last_seen),
    Number(f.n_sale), Number(f.n_rent), f.median_gap_pct == null ? null : Number(f.median_gap_pct).toFixed(3), Number(f.n_good_deals),
    Boolean(f.multi_channel), [...(f.sources ?? [])].sort().join(",")];
}
function soSanhView(view, docLap) {
  if (view.size !== docLap.size) throw new Error(`LECH SO DONG: view ${view.size} ≠ ${docLap.size}`);
  let n = 0;
  for (const [h, a] of docLap) {
    const b = view.get(h);
    if (!b) throw new Error("LECH SO DONG: thiếu dòng");
    COT.forEach((k, i) => { if (a[i] !== b[i]) throw new Error(`LECH COT ${k.replace("f.", "")}`); n++; });
  }
  return n;
}
async function sellers() {
  const c = await moi();
  try {
    refreshCu();
    const map = await anhXa(c);
    // Số không đúng dạng 10 chữ số (vd 11 chữ số) trên tin: 060 bước 4b cố ý bỏ — đếm riêng, không tính là mất.
    const { rows: sai } = await c.query(`SELECT DISTINCT seller_phone s FROM sale_offer_records WHERE seller_phone IS NOT NULL`);
    const bamSai = new Set(sai.filter(({ s }) => !SO0.test(s)).map(({ s }) => bam(s)));
    const { rows: cu } = await c.query(`SELECT phone_hash, name, first_seen, last_seen FROM sellers`);
    const tenCu = cu.filter((r) => (r.name ?? "").trim() !== "");
    // Đối chứng đỏ «MAT TEN NGUOI BAN»: bản chép bỏ bước chép tên.
    const kiemTen = async () => {
      const { rows } = await c.query(`SELECT DISTINCT a.value FROM registry_aliases a JOIN registry_aliases s ON s.object_key = a.object_key
                                      WHERE a.kind = 'ten' AND s.kind IN ('sdt', 'sdt_bam') AND s.value = ANY($1::text[])`,
        [[...new Set(tenCu.flatMap((r) => [r.phone_hash, map.get(r.phone_hash)].filter(Boolean)))]]);
      const co = new Set(rows.map((r) => r.value));
      const mat = tenCu.filter((r) => !co.has(r.name.trim()));
      if (mat.length) throw new Error(`MAT TEN NGUOI BAN: ${mat.length}/${tenCu.length}`);
    };
    const saiTen = MIG.replace(/    INSERT INTO registry_aliases \(object_key, kind, value, source\)\n    SELECT DISTINCT a\.object_key, 'ten'[\s\S]*?ON CONFLICT DO NOTHING;\n/, "    NULL;\n");
    assert.notEqual(saiTen, MIG);
    await thu(c, async () => { await c.query(saiTen); await assert.rejects(kiemTen(), /MAT TEN NGUOI BAN/); });
    ok("đối chứng đỏ: bản chép 060 bỏ bước chép tên → bắt 'MAT TEN NGUOI BAN'");
    await c.query(MIG);
    dungNguoi();
    await kiemTen();
    const { rows: [rk] } = await c.query(`SELECT relkind FROM pg_class WHERE relname = 'sellers' AND relnamespace = 'public'::regnamespace`);
    assert.equal(rk.relkind, "v");
    const { rows: v } = await c.query(`SELECT * FROM sellers`);
    const view = new Map(v.map((r) => [r.phone_hash, oCua(r)]));
    // Câu độc lập theo luật cũ của refresh-bait-gap (số giảm từ thước, tính trên mọi tin sống của số).
    const { rows: dl } = await c.query(`
      WITH g AS (SELECT o.*, CASE WHEN o.price_tier = 'P1' AND o.kind = 'sale' AND o.price_perm2 > 0 AND r.m IS NOT NULL
                                  THEN round((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) END gap
                 FROM sale_offers o LEFT JOIN v_ruler_p2_area r ON r.area_id = o.area_id WHERE o.seller_phone IS NOT NULL)
      SELECT seller_phone_hash phone_hash,
             (SELECT btrim(seller_name) FROM sale_offers x WHERE x.seller_phone = g.seller_phone AND btrim(coalesce(seller_name, '')) <> ''
               ORDER BY last_seen DESC LIMIT 1) name,
             array_agg(DISTINCT source) sources, count(*) n_ads,
             (SELECT min(first_seen) FROM sale_offer_records y WHERE y.seller_phone = g.seller_phone) first_seen,
             (SELECT max(last_seen) FROM sale_offer_records y WHERE y.seller_phone = g.seller_phone) last_seen,
             jsonb_build_object('n_sale', count(*) FILTER (WHERE kind = 'sale'), 'n_rent', count(*) FILTER (WHERE kind = 'rent_lt'),
               'median_gap_pct', percentile_cont(0.5) WITHIN GROUP (ORDER BY gap) FILTER (WHERE gap IS NOT NULL),
               'n_good_deals', count(*) FILTER (WHERE gap >= 10), 'multi_channel', count(DISTINCT source) > 1,
               'sources', to_jsonb(array_agg(DISTINCT source))) flags
      FROM g GROUP BY seller_phone_hash, seller_phone`);
    const docLap = new Map(dl.map((r) => [r.phone_hash, oCua(r)]));
    const nO = soSanhView(view, docLap);
    assert.equal(nO, docLap.size * COT.length);
    const hongRent = new Map([...view].map(([h, o]) => [h, o.map((x, i) => (i === 7 ? x + 1 : x))]));
    assert.throws(() => soSanhView(hongRent, docLap), /LECH COT n_rent/);
    ok(`view: ${view.size} dòng = số SĐT trên tin sống; ${nO} ô trùng câu độc lập (${COT.length} cột/dòng); đối chứng 'LECH COT n_rent'`);
    // So bảng cũ chụp trước 060: 0 dòng mất, first_seen không muộn hơn, last_seen không sớm hơn.
    let mat = 0;
    let lech = 0;
    let boCoY = 0;
    for (const r of cu) {
      if (bamSai.has(r.phone_hash)) { boCoY++; continue; }
      const so = map.get(r.phone_hash);
      const b = so && v.find((x) => x.phone_hash === bam(so));
      if (!b) { mat++; continue; }
      if (+new Date(b.first_seen) > +new Date(r.first_seen) || +new Date(b.last_seen) < +new Date(r.last_seen)) lech++;
    }
    assert.equal(mat, 0, `bảng cũ mất ${mat}/${cu.length} dòng`);
    assert.equal(lech, 0, `${lech} dòng first_seen muộn hơn hoặc last_seen sớm hơn bảng cũ`);
    assert.ok(boCoY <= bamSai.size);
    ok(`so bảng cũ chụp trước 060 (${cu.length} dòng, ${tenCu.length} có tên; ${boCoY} dòng số sai dạng 060 bước 4b bỏ có chủ ý): 0 dòng mất, 0 dòng lệch ngày; tên cũ còn trong bí danh ten`);
    const dl2 = spawnSync(process.execPath, ["--import", "tsx", "-e", "import('./src/lib/deals.ts').then(m=>m.getDeals(5)).then(r=>{console.log('deals '+r.length);process.exit(0)})"],
      { cwd: path.join(ROOT, "app"), encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL }, timeout: 120_000 });
    assert.equal(dl2.status, 0, `deals.ts lỗi: ${dl2.stderr.slice(-300)}`);
    ok(`truy vấn deals.ts thật chạy trên view: ${dl2.stdout.trim()}`);
    console.log("SELLERS OK");
  } finally { await c.end(); }
}

// -------------------------------------------------------------------------------------------------------- cloud (E7)
async function cloud() {
  const c = await moi();
  try {
    await c.query(MIG);
    dungNguoi();
    const sc = await import(pathToFileURL(path.join(ROOT, "pipeline/sync-cloud.mjs")).href);
    assert.ok(sc.FILL.includes("sellers") && sc.FILL.includes("sale_offers") && sc.FILL.includes("properties"));
    // Số gốc = mọi SĐT người bán trên bản ghi tin, cả dạng +84… lẫn dạng 0… đời trước. Quét giá trị theo đúng tập này
    // (chuỗi 10 chữ số trong cột khác — vd street_raw của một tin S06 có trước SD3 — không phải SĐT người bán, ghi ở
    // review-findings, không nằm trong lời hứa của E7), cộng mọi chuỗi dạng +84 chín chữ số.
    const { rows: soRows } = await c.query(`SELECT DISTINCT seller_phone s FROM sale_offer_records WHERE seller_phone IS NOT NULL`);
    const soGoc = new Set(soRows.flatMap(({ s }) => [s, s.startsWith("+84") ? "0" + s.slice(3) : s]));
    const quet = (bang, rows) => {
      for (const r of rows) {
        for (const k of ["seller_phone", "seller_name", ...(bang === "sellers" ? ["name"] : [])]) if (k in r) throw new Error(`LOT SO GOC: ${bang}.${k}`);
        const j = JSON.stringify(r);
        if (/\+84\d{9}/.test(j) || (j.match(/(?<![0-9a-f])(?:\+84|0)[35789]\d{8}(?![0-9a-f])/g) ?? []).some((x) => soGoc.has(x))) throw new Error(`LOT SO GOC: giá trị ở ${bang}`);
      }
    };
    assert.ok(soGoc.size > 0, "không có SĐT người bán nào để quét");
    let n = 0;
    for (const bang of ["sale_offers", "sellers", "properties"]) {
      const { rows: cot } = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`, [bang]);
      const ten = cot.map((x) => x.column_name);
      const { rows } = await c.query(sc.localReadSql(bang, sc.selectList(bang, ten).sql));
      const ds = rows.map((r) => JSON.parse(r.j));
      quet(bang, ds);
      n += ds.length;
      if (bang === "sale_offers") {
        const lo = `SELECT row_to_json(x)::text AS j FROM (SELECT ${ten.map((t) => `"${t}"`).join(", ")} FROM sale_offers) x`;
        const raw = (await c.query(lo)).rows.map((r) => JSON.parse(r.j));
        assert.throws(() => quet(bang, raw), /LOT SO GOC/);
      }
    }
    ok(`${n} dòng đọc bằng selectList + localReadSql thật: 0 cột seller_phone/seller_name/name, 0 giá trị số gốc; đối chứng (bỏ PII_EXCLUDE) bắt 'LOT SO GOC'`);
    const t = node(["--test", "pipeline/scripts/sync-cloud-pii.test.mjs", "pipeline/scripts/soat-tang-a.test.mjs"]);
    assert.equal(t.status, 0, `test chặn rò đỏ: ${(t.stdout + t.stderr).slice(-400)}`);
    ok("sync-cloud-pii.test.mjs và soat-tang-a.test.mjs xanh");
    console.log("CLOUD OK");
  } finally { await c.end(); }
}

const BUOC = { mig, "du-lieu": duLieu, "danh-ba": danhBa, sellers, cloud };
if (!BUOC[PHAN]) { console.error(`do.mjs: phần lạ «${PHAN}»`); process.exit(2); }
dbThu(true);
dbThu();
try {
  await BUOC[PHAN]();
} finally {
  dbThu(true);
}
