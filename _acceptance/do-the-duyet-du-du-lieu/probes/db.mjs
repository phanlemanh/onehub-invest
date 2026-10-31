// db.mjs — hồ sơ do-the-duyet-du-du-lieu (HD11): E2 (AC-2 đối chứng câu đo độc lập + ma trận Δ), E3 (AC-3 ghi theo
// ngày) và E4b (AC-8 dòng lên cloud ở lượt sync kế). Chạy trên DB THỬ (DTD_DB_URL, probes/db.sh dựng và xoá). Câu đo độc
// lập viết lại bằng SQL trong tệp này — KHÔNG nạp pipeline/do-the-duyet.mjs; lệnh được gọi như tiến trình con. Chỉ in số đếm.
import { spawnSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg")
const LENH = path.join(ROOT, "pipeline/do-the-duyet.mjs")

const DB_URL = process.env.DTD_DB_URL ?? ""
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("db.mjs: DTD_DB_URL phải trỏ DB thử oneinvest_<…> (probes/db.sh dựng)")
  process.exit(2)
}
const ok = (s) => console.log(`ok ${s}`)
async function moi() {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  return c
}
const chayLenh = (args = [], env = {}, tep = LENH) =>
  spawnSync(process.execPath, [tep, ...args], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL, ...env }, timeout: 300_000 })

const TRUONG = ["gia", "dt", "gia_m2", "phuong", "loai", "pn", "wc", "duong", "toa", "tang", "nguoi_dang"]
const KIEM3 = { "roi-kho": "roiKho", "anh-ops": "anhOps", "anh-admin": "anhAdmin" }

/** Số của lệnh, đọc từ bảng nó in: ô `<kiểm>.<khoá>` và `do-day.<nguồn>.<khoá>`. */
function soCuaLenh() {
  const r = chayLenh()
  assert.equal(r.status, 0, `lệnh thoát ${r.status}: ${r.stderr.slice(0, 300)}`)
  const v = {}
  for (const l of r.stdout.split("\n")) {
    const m = l.match(/^the-duyet:(\S+) (\S+) (pass|fail) (.*)$/)
    if (!m) continue
    const kv = Object.fromEntries(m[4].split(" ").map((x) => x.split("=")).map(([k, x]) => [k, Number(x)]))
    const dau = m[1] === "do-day" ? `do-day.${m[2]}` : m[1]
    for (const [k, x] of Object.entries(kv)) v[`${dau}.${k}`] = x
  }
  for (const k of Object.keys(KIEM3)) for (const o of ["tong", "so", "ben"]) assert.ok(Number.isInteger(v[`${k}.${o}`]), `lệnh không in ô ${k}.${o}`)
  return v
}

/** Câu đo độc lập: SQL trên review_queue, sale_offers, media (luật ảnh = ràng buộc khuôn local_file của bảng media, hoặc
 *  URL gốc kèm media_key 32 hex mà máy chủ lấy hộ — anh-goc-qua-may-chu; hai vai cùng một bộ ảnh). */
async function soDocLap(c) {
  const v = {}
  const { rows } = await c.query(`
    WITH the AS (SELECT id, evidence FROM review_queue WHERE item_type = 'entity_match' AND status = 'pending'),
    ben AS (
      SELECT t.id, b.k, t.evidence -> b.k ->> 'offer_id' AS oid
      FROM the t CROSS JOIN (VALUES ('offer_a'), ('offer_b')) b(k)
      WHERE jsonb_typeof(t.evidence -> b.k -> 'offer_id') = 'string'),
    co AS (
      SELECT ben.*,
        EXISTS (SELECT 1 FROM sale_offers s WHERE s.offer_id = ben.oid) AS song,
        EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = ben.oid
                  AND ((m.local_file ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]*/media/[A-Za-z0-9][A-Za-z0-9_.-]*$'
                        AND position('..' in m.local_file) = 0)
                    OR (m.media_url IS NOT NULL AND m.media_key ~ '^[0-9a-f]{32}$'))) AS ops
      FROM ben)
    SELECT (SELECT count(*) FROM the)::int AS tong,
      count(DISTINCT id) FILTER (WHERE NOT song)::int AS roi_so, count(*) FILTER (WHERE NOT song)::int AS roi_ben,
      count(DISTINCT id) FILTER (WHERE NOT ops)::int AS ops_so, count(*) FILTER (WHERE NOT ops)::int AS ops_ben,
      count(DISTINCT id) FILTER (WHERE NOT ops)::int AS admin_so, count(*) FILTER (WHERE NOT ops)::int AS admin_ben
    FROM co`)
  const r = rows[0]
  for (const k of Object.keys(KIEM3)) v[`${k}.tong`] = r.tong
  Object.assign(v, {
    "roi-kho.so": r.roi_so, "roi-kho.ben": r.roi_ben, "anh-ops.so": r.ops_so, "anh-ops.ben": r.ops_ben,
    "anh-admin.so": r.admin_so, "anh-admin.ben": r.admin_ben,
  })
  const coChu = (c) => `(${c} IS NOT NULL AND btrim(${c}::text) <> '')`
  const { rows: day } = await c.query(`
    WITH ids AS (
      SELECT DISTINCT t.evidence -> b.k ->> 'offer_id' AS oid
      FROM review_queue t CROSS JOIN (VALUES ('offer_a'), ('offer_b')) b(k)
      WHERE t.item_type = 'entity_match' AND t.status = 'pending' AND jsonb_typeof(t.evidence -> b.k -> 'offer_id') = 'string')
    SELECT s.source, count(*)::int AS tong,
      count(*) FILTER (WHERE ${coChu("price_vnd")})::int AS gia, count(*) FILTER (WHERE ${coChu("area_m2")})::int AS dt,
      count(*) FILTER (WHERE ${coChu("price_perm2")})::int AS gia_m2, count(*) FILTER (WHERE ${coChu("area_id")})::int AS phuong,
      count(*) FILTER (WHERE ${coChu("property_type")} AND property_type <> 'unknown')::int AS loai,
      count(*) FILTER (WHERE ${coChu("bedrooms")})::int AS pn, count(*) FILTER (WHERE ${coChu("bathrooms")})::int AS wc,
      count(*) FILTER (WHERE ${coChu("street_raw")})::int AS duong, count(*) FILTER (WHERE ${coChu("block_raw")})::int AS toa,
      count(*) FILTER (WHERE ${coChu("floor_raw")})::int AS tang,
      count(*) FILTER (WHERE ${coChu("seller_phone_hash")} OR ${coChu("seller_name")})::int AS nguoi_dang
    FROM ids JOIN sale_offers s ON s.offer_id = ids.oid GROUP BY s.source`)
  for (const d of day) for (const k of ["tong", ...TRUONG]) v[`do-day.${d.source}.${k}`] = d[k]
  return v
}

function soSanh(lenh, docLap) {
  const o = [...new Set([...Object.keys(lenh), ...Object.keys(docLap)])].sort()
  for (const k of o) if (lenh[k] !== docLap[k]) throw new Error(`LECH ${k}: lệnh ${lenh[k]} ≠ câu độc lập ${docLap[k]}`)
  return o.length
}

// ---------- E2: đối chứng + ma trận Δ ----------
let FIXTURE_IDS = []
const c = await moi()
try {
  const truoc = soCuaLenh()
  const n0 = soSanh(truoc, await soDocLap(c))
  ok(`E2 trên bản chép DB máy thu: lệnh trùng câu đo độc lập ở ${n0} ô`)
  assert.throws(() => soSanh({ ...truoc, "anh-ops.ben": truoc["anh-ops.ben"] + 1 }, truoc), /LECH anh-ops\.ben/)
  ok("E2 đối chứng đỏ: hàm so trên số lệch một ô → bắt 'LECH anh-ops.ben'")

  // Hai tin sống cùng nguồn, chưa ở thẻ chờ nào, chưa có dòng media — đặt đủ 11 trường để Δ độ đầy biết trước.
  const { rows: chon } = await c.query(`
    SELECT s.offer_id, s.source FROM sale_offers s
    WHERE NOT EXISTS (SELECT 1 FROM media m WHERE m.resource_record_key = s.offer_id)
      AND NOT EXISTS (SELECT 1 FROM review_queue t WHERE t.item_type = 'entity_match' AND t.status = 'pending'
                        AND s.offer_id IN (t.evidence -> 'offer_a' ->> 'offer_id', t.evidence -> 'offer_b' ->> 'offer_id'))
      AND s.source = (SELECT source FROM sale_offers GROUP BY source ORDER BY count(*) DESC LIMIT 1)
    ORDER BY s.offer_id LIMIT 2`)
  assert.equal(chon.length, 2, "bản chép không có hai tin sống chưa có ảnh để dựng fixture")
  const [P, Q] = chon.map((r) => r.offer_id)
  const S = chon[0].source
  FIXTURE_IDS = [P, Q]
  await c.query(`UPDATE sale_offer_records SET price_vnd = 5e9, area_m2 = 80, price_perm2 = 6.25e7,
      area_id = (SELECT area_id FROM sale_offers WHERE area_id IS NOT NULL LIMIT 1), property_type = 'apartment', bedrooms = 2,
      bathrooms = 2, street_raw = 'Phố thử', block_raw = 'Toà thử', floor_raw = '9', seller_name = 'Người thử'
    WHERE offer_id = ANY ($1)`, [[P, Q]])
  let hien = soCuaLenh()
  let soThe = 0
  const theCho = (a, b, status = "pending") => c.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence, status) VALUES ('entity_match', $1, 'dtd-thu', $2, $3)`,
    [`dtd-thu-${++soThe}`, JSON.stringify({ offer_a: { offer_id: a }, offer_b: { offer_id: b } }), status])
  const anh = (khoa, oid, url, file) => c.query(
    `INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key,
       media_order, media_modification_timestamp, media_url, local_file) VALUES ($1, $2, $3, $1, 0, now(), $4, $5)`,
    [khoa, oid, S, url, file])
  const khoaDung = (x) => createHash("md5").update(`dtd-thu-${x}`).digest("hex")
  const day = (n) => Object.fromEntries(["tong", ...TRUONG].map((k) => [`do-day.${S}.${k}`, n]))
  const FIX = [
    { ten: "thẻ chờ có bên rời kho (P, tin không có)", lam: () => theCho(P, "dtd-thu-khong-co"),
      delta: { "roi-kho.tong": 1, "anh-ops.tong": 1, "anh-admin.tong": 1, "roi-kho.so": 1, "roi-kho.ben": 1,
        "anh-ops.so": 1, "anh-ops.ben": 2, "anh-admin.so": 1, "anh-admin.ben": 2, ...day(1) } },
    { ten: "bên P có dòng URL gốc khoá sai khuôn (không lấy hộ được)", lam: () => anh(`dtd-thu-${P}-u`, P, "https://anh.example/p0.jpg", null),
      delta: {} },
    { ten: "bên P có dòng URL gốc khoá đúng khuôn (máy chủ lấy hộ)", lam: () => anh(khoaDung(P), P, "https://anh.example/p.jpg", null),
      delta: { "anh-ops.ben": -1, "anh-admin.ben": -1 } },
    { ten: "thẻ chờ (Q, P), Q 0 dòng media", lam: () => theCho(Q, P),
      delta: { "roi-kho.tong": 1, "anh-ops.tong": 1, "anh-admin.tong": 1, "anh-ops.so": 1, "anh-ops.ben": 1,
        "anh-admin.so": 1, "anh-admin.ben": 1, ...day(1) } },
    { ten: "bên Q thiếu PN", lam: () => c.query(`UPDATE sale_offer_records SET bedrooms = NULL WHERE offer_id = $1`, [Q]),
      delta: { [`do-day.${S}.pn`]: -1 } },
    { ten: "bên Q có ảnh đã tải", lam: () => anh(`dtd-thu-${Q}-l`, Q, null, `hanoi__dtd-thu__x/media/q.jpg`),
      delta: { "anh-ops.so": -1, "anh-ops.ben": -1, "anh-admin.so": -1, "anh-admin.ben": -1 } },
    { ten: "thẻ đã quyết (không đếm)", lam: () => theCho("dtd-thu-a", "dtd-thu-b", "approved"), delta: {} },
  ]
  let soAssert = 0
  for (const f of FIX) {
    await f.lam()
    const sau = soCuaLenh()
    const o = [...new Set([...Object.keys(hien), ...Object.keys(sau)])].sort()
    for (const k of o) {
      const d = (sau[k] ?? 0) - (hien[k] ?? 0)
      const mong = f.delta[k] ?? 0
      if (d !== mong) throw new Error(`DELTA LECH ${f.ten} · ${k}: ${d} ≠ ${mong}`)
      soAssert++
    }
    for (const k of Object.keys(f.delta)) assert.ok(o.includes(k), `ô viết trước ${k} không có trong bảng lệnh in`)
    soSanh(sau, await soDocLap(c))
    hien = sau
  }
  ok(`E2 ma trận Δ: ${FIX.length} fixture, ${soAssert} ô so, mọi bước vẫn trùng câu đo độc lập`)
  console.log("DOI CHUNG OK")
} finally {
  await c.end()
}

// ---------- E3: ghi theo ngày ----------
const MUI = "Asia/Ho_Chi_Minh"
async function demHomNay(cl) {
  const { rows: [r] } = await cl.query(
    `SELECT count(*)::int AS n FROM dq_check_results WHERE check_name LIKE 'the-duyet:%'
       AND (checked_at AT TIME ZONE '${MUI}')::date = (now() AT TIME ZONE '${MUI}')::date`)
  return r.n
}
const soDongIn = (out) => out.split("\n").filter((l) => /^the-duyet:/.test(l)).length
const c2 = await moi()
try {
  await c2.query(`INSERT INTO dq_check_results (checked_at, check_name, entity, status, detail)
    VALUES ((date_trunc('day', now() AT TIME ZONE '${MUI}') + interval '6 hours 30 minutes') AT TIME ZONE '${MUI}', 'the-duyet:roi-kho', 'entity_match', 'fail', 'tong=999 so=999 ben=999')`)
  const PHIEN_UTC = { PGOPTIONS: "-c TimeZone=UTC" }
  const show = (env) => spawnSync(process.execPath, ["-e", `const pg=require(${JSON.stringify(path.join(ROOT, "pipeline/node_modules/pg"))});const c=new pg.Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query("SHOW TimeZone")).then(r=>{console.log(r.rows[0].TimeZone);return c.end()})`],
    { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL, ...env } }).stdout.trim()
  if (show(PHIEN_UTC) !== "UTC") throw new Error("PHIEN KHONG PHAI UTC")
  assert.equal(show({ PGOPTIONS: `-c TimeZone=${MUI}` }), MUI, "đối chứng: PGOPTIONS đổi được múi giờ phiên")
  ok("E3 phiên UTC dựng thật (SHOW TimeZone = UTC; đối chứng đặt Asia/Ho_Chi_Minh đổi được)")
  for (const lan of [1, 2]) {
    const r = chayLenh(["--write"], PHIEN_UTC)
    assert.equal(r.status, 0, `lượt ${lan} có dòng fail mà lệnh thoát ${r.status} — FAIL DOI MA THOAT\n${r.stderr}`)
    const n = await demHomNay(c2)
    if (n !== soDongIn(r.stdout)) throw new Error(`NHAN DONG TRONG NGAY: lượt ${lan} có ${n} dòng, lệnh in ${soDongIn(r.stdout)}`)
  }
  const { rows } = await c2.query(`SELECT check_name, entity, status, detail FROM dq_check_results WHERE check_name LIKE 'the-duyet:%'`)
  assert.equal(rows.filter((r) => r.detail.includes("999")).length, 0, "dòng cũ 06:30 giờ máy thu không bị thay")
  const fail3 = rows.filter((r) => r.status === "fail").map((r) => r.check_name).sort()
  assert.deepEqual([...new Set(fail3)], ["the-duyet:anh-admin", "the-duyet:anh-ops", "the-duyet:roi-kho"], "fixture có so>0 ở cả ba kiểm đầu")
  for (const r of rows) {
    assert.match(r.detail, /^([a-z_0-9]+=\d+)( [a-z_0-9]+=\d+)*$/, r.detail)
    const v = Object.fromEntries(r.detail.split(" ").map((x) => x.split("=")).map(([k, x]) => [k, Number(x)]))
    const dat = r.check_name === "the-duyet:do-day" ? true : v.so === 0
    assert.equal(r.status, dat ? "pass" : "fail", `${r.check_name} ${r.entity}`)
  }
  // Quét LỚP: mọi offer_id của bảng bản ghi tin (kể cả tin đã nghỉ) + mọi offer_id thẻ duyệt nhắc tới + định danh fixture.
  const { rows: ids } = await c2.query(`
    SELECT offer_id FROM sale_offer_records
    UNION SELECT t.evidence -> b.k ->> 'offer_id' FROM review_queue t CROSS JOIN (VALUES ('offer_a'), ('offer_b')) b(k)
    WHERE jsonb_typeof(t.evidence -> b.k -> 'offer_id') = 'string'`)
  const tapId = new Set([...ids.map((x) => x.offer_id), ...FIXTURE_IDS, "dtd-thu-khong-co", "dtd-thu-a", "dtd-thu-b"])
  assert.ok(FIXTURE_IDS.length === 2 && FIXTURE_IDS.every((id) => tapId.has(id)), "tập quét thiếu định danh fixture P, Q")
  const quetLot = (dong) => {
    for (const r of dong) for (const s of [r.entity, r.detail]) {
      if (/https?:|\/\//.test(s)) throw new Error(`DINH DANH TIN LOT: URL ở ${r.check_name}`)
      for (const tu of s.split(/[\s=]+/)) if (tapId.has(tu)) throw new Error(`DINH DANH TIN LOT: ${r.check_name}`)
    }
  }
  quetLot(rows)
  for (const id of [...FIXTURE_IDS, "dtd-thu-khong-co"])
    assert.throws(() => quetLot([{ check_name: "x", entity: "entity_match", detail: `tong=1 ben=${id}` }]), /DINH DANH TIN LOT/)
  ok(`E3 hai lượt --write phiên UTC: số dòng hôm nay = số dòng lệnh in, dòng 06:30 bị thay, ba kiểm đầu fail mà thoát 0, detail chỉ khoá=số, 0 định danh tin trên tập ${tapId.size} offer_id gồm hai fixture P, Q (đối chứng 'DINH DANH TIN LOT' cho P, Q và tin không có)`)
  const ma = readFileSync(LENH, "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n")
  const quetGhi = (t) => {
    for (const m of t.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE|COPY)\s+([a-z_]+)/gi))
      if (m[2] !== "dq_check_results" || /UPDATE|TRUNCATE|COPY/i.test(m[1])) throw new Error(`GHI NGOAI dq_check_results: ${m[0]}`)
  }
  quetGhi(ma)
  assert.throws(() => quetGhi("DELETE FROM review_queue"), /GHI NGOAI dq_check_results/)
  ok("E3 quét mã: chỉ DELETE/INSERT dq_check_results; đối chứng 'GHI NGOAI dq_check_results'")
  const goc = readFileSync(LENH, "utf8")
  const banChep = async (tim, thay, chay) => {
    const moiMa = goc.replace(tim, thay)
    assert.notEqual(moiMa, goc, "bản chép không đổi được — mẫu thay đã lệch mã")
    const ban = path.join(path.dirname(LENH), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-do-the-duyet.mjs`)
    writeFileSync(ban, moiMa)
    try {
      return await chay(ban)
    } finally {
      rmSync(ban, { force: true })
    }
  }
  await banChep(/await client\.query\(\s*`DELETE FROM dq_check_results[\s\S]*?\[Object\.values\(KIEM\)\]\);/, "", async (ban) => {
    const r = chayLenh(["--write"], {}, ban)
    assert.equal(r.status, 0, r.stderr)
    const n = await demHomNay(c2)
    assert.throws(() => { if (n !== soDongIn(r.stdout)) throw new Error(`NHAN DONG TRONG NGAY: ${n} dòng`) }, /NHAN DONG TRONG NGAY/)
  })
  await c2.query(`DELETE FROM dq_check_results WHERE check_name LIKE 'the-duyet:%'`)
  ok("E3 đối chứng đỏ: bỏ bước xoá → nhân dòng, bắt 'NHAN DONG TRONG NGAY'")
  await banChep('if (args.includes("--write")) console.log',
    'if (dong.some((d) => d.status === "fail")) process.exitCode = 1;\n    if (args.includes("--write")) console.log', async (ban) => {
      const r = chayLenh(["--write"], {}, ban)
      assert.throws(() => assert.equal(r.status, 0, "FAIL DOI MA THOAT"), /FAIL DOI MA THOAT/)
    })
  ok("E3 đối chứng đỏ: bản chép thoát 1 khi có dòng fail → bắt 'FAIL DOI MA THOAT'")
  const dong = spawnSync(process.execPath, [LENH], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:1/khong" } })
  assert.notEqual(dong.status, 0, "DB không tới được mà lệnh thoát 0")
  ok("E3 DB không tới được → lệnh thoát ≠ 0")
  console.log("GHI DQ OK")

  // ---------- E4b: dòng lên cloud ở lượt sync kế (AC-8) ----------
  const sc = await import(pathToFileURL(path.join(ROOT, "pipeline/sync-cloud.mjs")).href)
  const coLenCloud = (fill) => { if (!fill.includes("dq_check_results")) throw new Error("KHONG LEN CLOUD: FILL thiếu dq_check_results") }
  coLenCloud(sc.FILL)
  assert.throws(() => coLenCloud(sc.FILL.filter((t) => t !== "dq_check_results")), /KHONG LEN CLOUD/)
  const r = chayLenh(["--write"])
  assert.equal(r.status, 0, r.stderr)
  const { rows: cot } = await c2.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dq_check_results' ORDER BY ordinal_position`)
  const { sql } = sc.selectList("dq_check_results", cot.map((x) => x.column_name))
  const { rows: len } = await c2.query(sc.localReadSql("dq_check_results", sql))
  const homNay = new Date().toLocaleDateString("en-CA", { timeZone: MUI })
  const lenTheDuyet = len.map((x) => JSON.parse(x.j)).filter((x) => /^the-duyet:/.test(x.check_name)
    && new Date(x.checked_at).toLocaleDateString("en-CA", { timeZone: MUI }) === homNay)
  const nDb = await demHomNay(c2)
  if (lenTheDuyet.length !== nDb || nDb !== soDongIn(r.stdout)) throw new Error(`KHONG LEN CLOUD: câu đọc sync mang ${lenTheDuyet.length}/${nDb} dòng`)
  ok(`E4b FILL có dq_check_results; câu đọc thật của bước sync mang đủ ${nDb} dòng the-duyet:* hôm nay; đối chứng 'KHONG LEN CLOUD'`)
  console.log("CLOUD OK")
} finally {
  await c2.end()
}
