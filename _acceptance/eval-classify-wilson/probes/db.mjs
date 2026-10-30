// db.mjs — hồ sơ eval-classify-wilson (PL9): E5 (AC-5 nhãn vàng từ người) và E7 (AC-7 ghi dq_check_results). Chạy trên
// DB THỬ (ECW_DB_URL, dựng bởi probes/db.sh, fixture nạp bởi probes/nap-nhan.tsx qua bên ghi thật của PL7). Hàm được gọi
// trên client riêng, không chung giao dịch với fixture. Mỗi phép đo chạy trên bản thật (xanh) rồi bản chép hỏng (đỏ, thông
// điệp ghim). Trên DB oneinvest chỉ chạy lệnh --dry (đếm trước/sau bằng nhau). Không in chữ tin hay tên người.
import { spawnSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import assert from "node:assert/strict"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg")
const LIB = path.join(ROOT, "pipeline/lib/eval-classify.mjs")
const CLI = path.join(ROOT, "pipeline/eval-classify.mjs")
const that = await import(pathToFileURL(LIB).href)

const URL = process.env.ECW_DB_URL ?? ""
if (!/\/oneinvest_[a-z0-9_]+$/.test(URL)) {
  console.error("db.mjs: ECW_DB_URL phải trỏ DB thử oneinvest_<…> (probes/db.sh dựng)")
  process.exit(2)
}
const URL_CHUNG = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const NGUOI = ["ecw-thu-nguoi-a", "ecw-thu-nguoi-b"]

async function moi(url = URL) {
  const c = new pg.Client({ connectionString: url })
  await c.connect()
  return c
}
/** Client ghi lại mọi câu lệnh — đo câu đầu của docNhanNguoi. */
function ghiLai(c) {
  const cau = []
  return { cau, query: (sql, v) => (cau.push(String(sql).trim()), c.query(sql, v)) }
}
/** Bản chép hỏng của lõi cạnh bản thật (đường nạp tương đối giữ nguyên), nạp, xoá. */
async function banLib(tim, thay, chay) {
  const goc = readFileSync(LIB, "utf8")
  const moiMa = goc.replace(tim, thay)
  assert.notEqual(moiMa, goc, "bản chép không đổi được lõi — mẫu thay đã lệch mã")
  const ban = path.join(path.dirname(LIB), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-eval-classify.mjs`)
  writeFileSync(ban, moiMa)
  try {
    return await chay(await import(pathToFileURL(ban).href))
  } finally {
    rmSync(ban, { force: true })
  }
}
const ok = (s) => console.log(`ok ${s}`)

// ---------- E5: nhãn vàng từ người ----------
const VANG_DU = { listing_intent: "offer", kind: "sale", property_type: "apartment", project: "ocean park 1", building: "pr2",
  price_min_vnd: "3150000000", price_max_vnd: "3150000000", area_m2: "64.5", bedrooms: "2" }

async function kiemNhanVang(mod) {
  const c = await moi()
  try {
    const rec = ghiLai(c)
    const r = await mod.docNhanNguoi(rec, { lat: "ocp1", split: "test" })
    if (!/^BEGIN TRANSACTION READ ONLY$/i.test(rec.cau[0] ?? "")) throw new Error(`DOC NHAN KHONG READ ONLY: «${rec.cau[0]}»`)
    const tin = r.tin.filter((t) => t.id.startsWith("ecw-thu-"))
    assert.deepEqual(tin.map((t) => t.id), ["ecw-thu-1", "ecw-thu-2", "ecw-thu-3"], "tập tin lát ocp1 split test")
    for (const t of tin) {
      for (const [f, v] of Object.entries(VANG_DU)) {
        if (t.id === "ecw-thu-3" && f === "kind") {
          if (f in t.nhan) throw new Error(`BAT DONG KHONG BI LOAI: ${t.id} kind = ${JSON.stringify(t.nhan.kind)}`)
          continue
        }
        assert.deepEqual(t.nhan[f], { value: v, not_stated: false }, `${t.id} ${f}`)
      }
    }
    assert.equal(r.bat_dong, 1, "bat_dong")
    assert.equal(r.mat_chu, 1, "mat_chu")
    const dev = await mod.docNhanNguoi(c, { lat: "ocp1", split: "dev" })
    assert.deepEqual(dev.tin.filter((t) => t.id.startsWith("ecw-thu-")).map((t) => t.id), ["ecw-thu-5"], "split dev")
  } finally {
    await c.end()
  }
}

await kiemNhanVang(that)
ok("E5 nhãn vàng: 3 tin test, đồng thuận đúng giá trị, bất đồng loại, mất chữ đếm, dev riêng, câu đầu READ ONLY")
await banLib(
  "if (khac.size === 1) nhan[truong] = [...nguoi.values()][0];\n      else bat_dong++;",
  "nhan[truong] = [...nguoi.values()][0];",
  async (m) => assert.rejects(() => kiemNhanVang(m), /BAT DONG KHONG BI LOAI/),
)
ok("E5 đối chứng đỏ: gộp lấy nhãn người đầu → 'BAT DONG KHONG BI LOAI'")
await banLib('"BEGIN TRANSACTION READ ONLY"', '"BEGIN"', async (m) => assert.rejects(() => kiemNhanVang(m), /DOC NHAN KHONG READ ONLY/))
ok("E5 đối chứng đỏ: bỏ READ ONLY → 'DOC NHAN KHONG READ ONLY'")
console.log("NHAN VANG OK")

// ---------- E7: ghi dq_check_results ----------
const demDong = async (url = URL) => {
  const c = await moi(url)
  try {
    const { rows } = await c.query(`SELECT count(*)::int AS n, coalesce(max(id), 0)::int AS max FROM dq_check_results WHERE check_name = 'eval-classify'`)
    return rows[0]
  } finally {
    await c.end()
  }
}
const chayCli = (args, url = URL) =>
  spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, DATABASE_URL: url }, timeout: 120_000 })

/** Quét entity + detail tìm định danh: người gắn của fixture, chữ tin fixture, tên nguồn thật. */
function quetDinhDanh(chuoi, cam) {
  for (const s of chuoi) for (const [nhan, t] of cam) if (s.includes(t)) throw new Error(`${nhan}: «${t}» trong một dòng`)
}

const truoc = await demDong()
const r = chayCli(["--lat", "ocp1"])
assert.equal(r.status, 0, `lệnh ghi thật thoát ${r.status}: ${r.stderr.slice(0, 300)}`)
const soO = Number(r.stdout.match(/^(\d+) ô · /m)?.[1])
assert.ok(soO > 0, "lệnh không in số ô")
const sau = await demDong()
assert.equal(sau.n - truoc.n, soO, `số dòng thêm ${sau.n - truoc.n} ≠ số ô ${soO}`)
const c = await moi()
let moiDong
let tenNguon
let chuTin
try {
  moiDong = (await c.query(`SELECT entity, status, detail FROM dq_check_results WHERE check_name = 'eval-classify' AND id > $1`, [truoc.max])).rows
  tenNguon = (await c.query(`SELECT real_name FROM source_registry`)).rows.map((x) => x.real_name).filter((x) => x && x.length >= 3)
  chuTin = (await c.query(`SELECT text FROM stg_zalo_posts WHERE post_id LIKE 'ecw-thu-%'`)).rows.map((x) => x.text)
} finally {
  await c.end()
}
assert.ok(tenNguon.length > 0, "source_registry rỗng — phép quét tên nguồn không có nghĩa")
assert.equal(moiDong.length, soO)
const runs = new Set()
for (const d of moiDong) {
  assert.match(d.entity, /^ocp1\|[a-z_-]+\|parser\|[a-z_0-9]+$/, d.entity)
  const cap = d.detail.split(" ").map((kv) => kv.split("="))
  const khoa = cap.map(([k]) => k)
  if (khoa.join(",") !== that.KHOA_DETAIL.join(",")) {
    const thieu = that.KHOA_DETAIL.filter((k) => !khoa.includes(k))
    const thua = khoa.filter((k) => !that.KHOA_DETAIL.includes(k))
    throw new Error(`KHOA DETAIL LECH: thiếu [${thieu}] thừa [${thua}] thứ tự ${khoa}`)
  }
  const v = Object.fromEntries(cap)
  runs.add(v.run)
  const truong = d.entity.split("|")[3]
  const coDoc = v.ly_do !== "chua-co-cach-doc"
  const x = that.xepTrangThai(truong, Number(v.n), v.dung === "-" ? 0 : Number(v.dung), coDoc)
  assert.equal(d.status, x.trang_thai, `${d.entity} status`)
}
assert.equal(runs.size, 1, "mọi dòng của lượt chung một run")
const cam = [
  ...NGUOI.map((t) => ["DINH DANH NGUOI GAN LOT", t]),
  ...chuTin.map((t) => ["CHU TIN LOT", t]),
  ...tenNguon.map((t) => ["TEN NGUON THAT LOT", t]),
]
quetDinhDanh(moiDong.flatMap((d) => [d.entity, d.detail]), cam)
ok(`E7 lượt ghi thật: +${soO} dòng = số ô, một run, entity/detail đúng khuôn 12 khoá, status theo AC-2, không định danh`)
assert.throws(() => quetDinhDanh([`${moiDong[0].detail} nguoi=${NGUOI[0]}`], cam), /DINH DANH NGUOI GAN LOT/)
ok("E7 đối chứng đỏ: detail chèn người gắn → 'DINH DANH NGUOI GAN LOT'")

const truocDry = await demDong()
const rd = chayCli(["--lat", "ocp1", "--dry"])
assert.equal(rd.status, 0, rd.stderr)
assert.equal((await demDong()).n, truocDry.n, "--dry đã ghi")
ok("E7 --dry trên DB thử: số dòng không đổi")

const c2 = await moi()
try {
  const { tin, bat_dong, mat_chu } = await that.docNhanNguoi(c2, { lat: "ocp1", split: "test" })
  const o = that.chamO({ tin })
  o[4] = { ...o[4], trang_thai: null }
  const truocLoi = await demDong()
  await assert.rejects(() => that.ghiKetQua(c2, o, { lat: "ocp1", run: "ecw-thu-loi", tap: "nguoi", split: "test", bat_dong, mat_chu }))
  assert.equal((await demDong()).n, truocLoi.n, "lỗi ở ô thứ 5 mà vẫn còn dòng của lượt")
} finally {
  await c2.end()
}
ok("E7 lỗi ở ô thứ 5 (status NULL): cả lượt hoàn tác")

/** Câu ghi trong mã (bỏ chú thích): chỉ được INSERT INTO dq_check_results. */
function quetGhi(ma) {
  const code = ma.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
  for (const m of code.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE|COPY)\s+([a-z_]+)/gi)) {
    if (!(/^INSERT\s+INTO$/i.test(m[1]) && m[2] === "dq_check_results")) throw new Error(`GHI NGOAI dq_check_results: ${m[0]}`)
  }
}
quetGhi(readFileSync(LIB, "utf8") + "\n" + readFileSync(CLI, "utf8"))
assert.throws(() => quetGhi("await c.query(`INSERT INTO eval_labels (item_id) VALUES (1)`)"), /GHI NGOAI dq_check_results/)
ok("E7 quét mã: câu ghi duy nhất là INSERT INTO dq_check_results; đối chứng đỏ 'GHI NGOAI dq_check_results'")

const truocChung = await demDong(URL_CHUNG)
const rc = chayCli(["--lat", "ocp1", "--dry"], URL_CHUNG)
assert.equal(rc.status, 0, rc.stderr)
for (const f of that.TRUONG) assert.match(rc.stdout, new RegExp(`^  tat-ca\\|parser\\|${f} `, "m"), `oneinvest --dry thiếu ô ${f}`)
assert.match(rc.stdout, /--dry: không ghi dq_check_results/)
assert.equal((await demDong(URL_CHUNG)).n, truocChung.n, "--dry trên oneinvest đã ghi")
const tomTat = rc.stdout.match(/^\d+ ô · .*$/m)?.[0]
ok(`E7 --dry trên DB local oneinvest: đủ 9 ô tat-ca, không ghi (${tomTat})`)

// Dọn fixture trên DB thử (DB thử cũng bị xoá ở probes/db.sh).
const c3 = await moi()
try {
  await c3.query(`DELETE FROM eval_label_items WHERE ref_id LIKE 'ecw-thu-%'`)
  await c3.query(`DELETE FROM stg_zalo_posts WHERE post_id LIKE 'ecw-thu-%'`)
  const { rows } = await c3.query(
    `SELECT (SELECT count(*) FROM eval_label_items WHERE ref_id LIKE 'ecw-thu-%')
          + (SELECT count(*) FROM eval_labels WHERE labeler_id LIKE 'ecw-thu-%')
          + (SELECT count(*) FROM stg_zalo_posts WHERE post_id LIKE 'ecw-thu-%') AS con`,
  )
  assert.equal(Number(rows[0].con), 0, "fixture còn sót")
} finally {
  await c3.end()
}
ok("dọn fixture: 0 dòng 'ecw-thu-' còn lại")
console.log("GHI DQ OK")
