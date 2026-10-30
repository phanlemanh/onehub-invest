// db.mjs — hồ sơ do-danh-ba-sdt (SD5): E2 (AC-2 đối chứng câu đo độc lập + ma trận Δ) và E3 (AC-3 ghi theo ngày). Chạy trên
// DB THỬ (DDB_DB_URL, probes/db.sh dựng và xoá). Câu đo độc lập viết lại trong tệp này theo audit §7 — KHÔNG nạp
// pipeline/do-danh-ba-sdt.mjs; lệnh được gọi như tiến trình con. Không in SĐT, tên hay khoá băm: chỉ số đếm.
import { spawnSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg")
const LENH = path.join(ROOT, "pipeline/do-danh-ba-sdt.mjs")
const { extractPhones } = await import(pathToFileURL(path.join(ROOT, "pipeline/transform-zalo.mjs")).href)
const { loadStgPosts } = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/test-posts.mjs")).href)

const URL = process.env.DDB_DB_URL ?? ""
if (!/\/oneinvest_[a-z0-9_]+$/.test(URL)) {
  console.error("db.mjs: DDB_DB_URL phải trỏ DB thử oneinvest_<…> (probes/db.sh dựng)")
  process.exit(2)
}
const ok = (s) => console.log(`ok ${s}`)
async function moi() {
  const c = new pg.Client({ connectionString: URL })
  await c.connect()
  return c
}
const chayLenh = (args = [], env = {}) =>
  spawnSync(process.execPath, [LENH, ...args], { encoding: "utf8", env: { ...process.env, DATABASE_URL: URL, ...env }, timeout: 300_000 })

/** Ô so: 12 số. */
const O = ["S03.n1", "S03.n2", "S03.n4n", "S03.n4r", "S03.n5", "S05.n1", "S05.n2", "S05.n4n", "S05.n4r", "S05.n5", "n3.sdt", "n3.sel"]
/** Số của lệnh, đọc từ bảng nó in. */
function soCuaLenh() {
  const r = chayLenh()
  assert.equal(r.status, 0, `lệnh thoát ${r.status}: ${r.stderr.slice(0, 300)}`)
  const v = {}
  for (const l of r.stdout.split("\n")) {
    const m = l.match(/^danh-ba-sdt:(n\d) (\S+) (pass|fail) (.*)$/)
    if (!m) continue
    const kv = Object.fromEntries(m[4].split(" ").map((x) => x.split("=")).map(([k, x]) => [k, Number(x)]))
    if (m[1] === "n3") Object.assign(v, { "n3.sdt": kv.sdt_tren_tin, "n3.sel": kv.sellers })
    else if (m[1] === "n4") Object.assign(v, { [`${m[2]}.n4n`]: kv.nhieu, [`${m[2]}.n4r`]: kv.rong })
    else v[`${m[2]}.${m[1]}`] = kv.so
  }
  for (const o of O) assert.ok(Number.isInteger(v[o]), `lệnh không in ô ${o}`)
  return v
}

/** Câu đo độc lập (audit §7 + offer.mjs/sot.mjs viết lại): chỉ SQL + extractPhones + bộ dò rộng chép từ audit. */
const DO_RONG = /(?<!\d)(?:\(?\+?84\)?|0|[oO])(?:[\s.\-_,/()·•*]{0,3}[\doO]){8,10}(?!\d)/g
async function soDocLap(c) {
  const v = {}
  for (const [nguon, kenh] of [["S03", "zalo"], ["S05", "facebook"]]) {
    const { posts } = await loadStgPosts(c, kenh)
    const bai = new Map(posts.map((p) => [p.post_id, p]))
    const { rows: tin } = await c.query(`SELECT seller_phone, seller_phone_hash, post_ids FROM sale_offers WHERE source = $1`, [nguon])
    const capSdt = new Map()
    const capNguoi = new Map()
    for (const t of tin) {
      if (!t.seller_phone_hash) continue
      for (const pid of t.post_ids ?? []) {
        const s = bai.get(pid)?.sender_id
        if (!s) continue
        capSdt.set(t.seller_phone_hash, new Set([...(capSdt.get(t.seller_phone_hash) ?? []), s]))
        capNguoi.set(s, new Set([...(capNguoi.get(s) ?? []), t.seller_phone_hash]))
      }
    }
    const motMot = [...capSdt].filter(([, ss]) => ss.size === 1 && capNguoi.get([...ss][0]).size === 1).map(([h]) => h)
    const { rows: [n1] } = await c.query(
      `SELECT count(DISTINCT a.value)::int AS n FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key
       WHERE a.retired_at IS NULL AND a.kind IN ('sdt_bam', 'sdt') AND a.source = $1 AND p.status <> 'merged' AND a.value = ANY ($2)`,
      [nguon, motMot])
    v[`${nguon}.n1`] = n1.n
    const { rows: [n2] } = await c.query(
      `SELECT count(DISTINCT a.object_key)::int AS n FROM registry_aliases a
       WHERE a.retired_at IS NULL AND a.kind IN ('sdt_bam', 'sdt') AND a.source = $1
         AND NOT EXISTS (SELECT 1 FROM party_roles r WHERE r.party_key = a.object_key AND r.retracted_at IS NULL)`, [nguon])
    v[`${nguon}.n2`] = n2.n
    let nhieu = 0
    let rong = 0
    for (const t of tin) {
      const so = new Set((t.post_ids ?? []).flatMap((pid) => extractPhones(bai.get(pid)?.text ?? "")))
      if (so.size >= 2) nhieu++
      if (t.seller_phone == null && so.size > 0) rong++
    }
    v[`${nguon}.n4n`] = nhieu
    v[`${nguon}.n4r`] = rong
    let sot = 0
    for (const p of posts) {
      const bat = extractPhones(p.text ?? "")
      if (bat.length >= 3) continue
      const da = new Set(bat.map((s) => s.slice(0, 10)))
      const rongSo = [...(p.text ?? "").matchAll(DO_RONG)]
        .map((m) => { let s = m[0].replace(/[oO]/g, "0").replace(/\D/g, ""); if (s.startsWith("84")) s = "0" + s.slice(2); return s.slice(0, 10) })
        .filter((s) => /^0[35789]\d{8}$/.test(s))
      if (rongSo.some((s) => !da.has(s))) sot++
    }
    v[`${nguon}.n5`] = sot
  }
  const { rows: [n3] } = await c.query(
    `SELECT (SELECT count(*) FROM sellers)::int AS sel, (SELECT count(DISTINCT seller_phone_hash) FROM sale_offers WHERE seller_phone_hash IS NOT NULL)::int AS sdt`)
  v["n3.sdt"] = n3.sdt
  v["n3.sel"] = n3.sel
  return v
}
function soSanh(a, b) {
  for (const o of O) if (a[o] !== b[o]) throw new Error(`LECH ${o}: lệnh ${a[o]} · độc lập ${b[o]}`)
}

// ---------- E2: đối chứng độc lập ----------
const c = await moi()
let truoc
try {
  truoc = soCuaLenh()
  soSanh(truoc, await soDocLap(c))
  console.log(O.map((o) => `${o}=${truoc[o]}`).join(" "))
  ok("E2 mười hai ô của lệnh trùng câu đo độc lập trên bản chép DB máy thu")
  assert.throws(() => soSanh(truoc, { ...truoc, "S05.n2": truoc["S05.n2"] + 1 }), /LECH S05\.n2/)
  ok("E2 đối chứng đỏ: lệch một ô → 'LECH S05.n2'")

  // Ma trận Δ viết trước: mỗi fixture → Δ của 12 ô.
  const snap = (await c.query(`SELECT snapshot_id FROM stg_zalo_posts LIMIT 1`)).rows[0].snapshot_id
  let dem = 0
  const khoa = () => `pty_${String(++dem).padStart(26, "0")}`
  const bai = (id, agent, sender, text) =>
    c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, sender_id, text) VALUES ($1, $2, $3, $4, $5)`, [id, snap, agent, sender, text])
  const tin = (id, nguon, posts, phone, hash) =>
    c.query(`INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, post_ids, source, seller_phone, seller_phone_hash)
             VALUES ($1, 'sale', now(), now(), $2, $3, $4, $5)`, [id, posts, nguon, phone, hash])
  const nguoiSdt = async (nguon, hash) => {
    const k = khoa()
    await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, $2)`, [k, nguon])
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt_bam', $2, $3)`, [k, hash, nguon])
  }
  const AG = { S03: null, S05: "apify-facebook" }
  const FIX = []
  for (const [nguon, d] of [["S03", "1"], ["S05", "2"]]) {
    FIX.push({ ten: `${nguon} cặp một–một + người SĐT không vai`, delta: { [`${nguon}.n1`]: 1, [`${nguon}.n2`]: 1, "n3.sdt": 1 }, lam: async () => {
      await bai(`ddb-thu-${d}a`, AG[nguon], `ddb-thu-gui-${d}a`, `lh 09${d}9000001`)
      await tin(`ddb-thu-${d}a`, nguon, [`ddb-thu-${d}a`], `09${d}9000001`, `ddbthu${d}a`)
      await nguoiSdt(nguon, `ddbthu${d}a`)
    } })
    FIX.push({ ten: `${nguon} tin hai SĐT`, delta: { [`${nguon}.n4n`]: 1, "n3.sdt": 1 }, lam: async () => {
      await bai(`ddb-thu-${d}b1`, AG[nguon], null, `lh 09${d}9000002`)
      await bai(`ddb-thu-${d}b2`, AG[nguon], null, `lh 09${d}9000003`)
      await tin(`ddb-thu-${d}b`, nguon, [`ddb-thu-${d}b1`, `ddb-thu-${d}b2`], `09${d}9000002`, `ddbthu${d}b`)
    } })
    FIX.push({ ten: `${nguon} tin trống SĐT dù bài có số`, delta: { [`${nguon}.n4r`]: 1 }, lam: async () => {
      await bai(`ddb-thu-${d}c`, AG[nguon], null, `lh 09${d}9000004`)
      await tin(`ddb-thu-${d}c`, nguon, [`ddb-thu-${d}c`], null, null)
    } })
    FIX.push({ ten: `${nguon} bài số «ddd dd•dd ddd»`, delta: { [`${nguon}.n5`]: 1 }, lam: async () => {
      await bai(`ddb-thu-${d}d`, AG[nguon], null, `lh 09${d} 90•00 005`)
    } })
  }
  FIX.push({ ten: "dòng sellers mới", delta: { "n3.sel": 1 }, lam: () => c.query(`INSERT INTO sellers (phone_hash, first_seen, last_seen) VALUES ('ddbthu-sel', now(), now())`) })
  let soAssert = 0
  let hien = truoc
  for (const f of FIX) {
    await f.lam()
    const sau = soCuaLenh()
    for (const o of O) {
      const mong = f.delta[o] ?? 0
      if (sau[o] - hien[o] !== mong) throw new Error(`DELTA LECH ${f.ten} · ${o}: ${sau[o] - hien[o]} ≠ ${mong}`)
      soAssert++
    }
    soSanh(sau, await soDocLap(c))
    hien = sau
  }
  assert.equal(soAssert, FIX.length * O.length)
  ok(`E2 ma trận Δ: ${FIX.length} fixture × ${O.length} ô = ${soAssert} assert, mọi bước vẫn trùng câu đo độc lập`)
  console.log("DOI CHUNG OK")
} finally {
  await c.end()
}

// ---------- E3: ghi theo ngày ----------
const MUI = "Asia/Ho_Chi_Minh"
async function demHomNay(cl) {
  const { rows: [r] } = await cl.query(
    `SELECT count(*)::int AS n FROM dq_check_results WHERE check_name LIKE 'danh-ba-sdt:%'
       AND (checked_at AT TIME ZONE '${MUI}')::date = (now() AT TIME ZONE '${MUI}')::date`)
  return r.n
}
const c2 = await moi()
try {
  // Dòng cũ: 06:30 sáng nay giờ máy thu = 23:30 UTC hôm trước.
  await c2.query(`INSERT INTO dq_check_results (checked_at, check_name, entity, status, detail)
    VALUES ((date_trunc('day', now() AT TIME ZONE '${MUI}') + interval '6 hours 30 minutes') AT TIME ZONE '${MUI}', 'danh-ba-sdt:n1', 'S03', 'fail', 'so=999 tong=999')`)
  for (const lan of [1, 2]) {
    const r = chayLenh(["--write"], { PGTZ: "UTC" })
    assert.equal(r.status, 0, r.stderr)
    const n = await demHomNay(c2)
    if (n !== 9) throw new Error(`NHAN DONG TRONG NGAY: lượt ${lan} có ${n} dòng`)
  }
  const { rows } = await c2.query(`SELECT check_name, entity, status, detail FROM dq_check_results WHERE check_name LIKE 'danh-ba-sdt:%'`)
  assert.equal(rows.filter((r) => r.detail === "so=999 tong=999").length, 0, "dòng cũ 06:30 giờ máy thu không bị thay")
  for (const r of rows) {
    assert.match(r.detail, /^([a-z_0-9]+=\d+)( [a-z_0-9]+=\d+)*$/, r.detail)
    const kq = r.check_name.slice(-2)
    const v = Object.fromEntries(r.detail.split(" ").map((x) => x.split("=")).map(([k, x]) => [k, Number(x)]))
    const dat = kq === "n1" ? v.so === 0 : kq === "n2" ? v.so <= 10 : kq === "n3" ? v.sellers === v.sdt_tren_tin : kq === "n4" ? v.rong === 0 : v.so === 0
    assert.equal(r.status, dat ? "pass" : "fail", `${r.check_name} ${r.entity}`)
    for (const s of [r.entity, r.detail]) {
      assert.doesNotMatch(s, /(?:\+84|\b0)[35789]\d{8}\b/, "SĐT lọt")
      assert.doesNotMatch(s, /\b[0-9a-f]{32}\b/, "khoá băm lọt")
    }
  }
  ok("E3 hai lượt --write với phiên UTC: 9 dòng hôm nay sau mỗi lượt, dòng 06:30 giờ máy thu bị thay, status theo ngưỡng, không SĐT/khoá băm")
  // Câu ghi trong mã: chỉ DELETE/INSERT trên dq_check_results.
  const ma = readFileSync(LENH, "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n")
  const quetGhi = (t) => {
    for (const m of t.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE|COPY)\s+([a-z_]+)/gi))
      if (m[2] !== "dq_check_results" || /UPDATE|TRUNCATE|COPY/i.test(m[1])) throw new Error(`GHI NGOAI dq_check_results: ${m[0]}`)
  }
  quetGhi(ma)
  assert.throws(() => quetGhi("DELETE FROM sellers"), /GHI NGOAI dq_check_results/)
  ok("E3 quét mã: chỉ DELETE/INSERT dq_check_results; đối chứng 'GHI NGOAI dq_check_results'")
  // Đối chứng đỏ: bản chép bỏ bước xoá → lượt hai nhân dòng.
  const goc = readFileSync(LENH, "utf8")
  const moiMa = goc.replace(/await client\.query\(\s*`DELETE FROM dq_check_results[\s\S]*?\[d\.check_name, d\.entity\]\);/, "")
  assert.notEqual(moiMa, goc, "không bỏ được bước xoá trong bản chép")
  const ban = path.join(path.dirname(LENH), `.ban-${process.pid}-do-danh-ba-sdt.mjs`)
  writeFileSync(ban, moiMa)
  try {
    const r = spawnSync(process.execPath, [ban, "--write"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: URL } })
    assert.equal(r.status, 0, r.stderr)
    const n = await demHomNay(c2)
    assert.throws(() => { if (n !== 9) throw new Error(`NHAN DONG TRONG NGAY: ${n} dòng`) }, /NHAN DONG TRONG NGAY: 18 dòng/)
  } finally {
    rmSync(ban, { force: true })
  }
  ok("E3 đối chứng đỏ: bỏ bước xoá → 18 dòng, bắt 'NHAN DONG TRONG NGAY'")
  const dong = spawnSync(process.execPath, [LENH], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:1/khong" } })
  assert.notEqual(dong.status, 0, "DB không tới được mà lệnh thoát 0")
  ok("E3 DB không tới được → lệnh thoát ≠ 0")
  console.log("GHI DQ OK")
} finally {
  await c2.end()
}
