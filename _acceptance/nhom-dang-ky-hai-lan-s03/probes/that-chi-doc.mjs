// that-chi-doc.mjs — E7, E8: chỉ đọc trên DB thử. Cặp trùng đọc từ sổ bằng SQL, độc lập với mã. Chỉ in số lượng, không in khoá.
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { kiem, pg, ROOT, URL_THU } from "../../gan-nhan-theo-nhom-s03/probes/_db.mjs"
import { LENH, voiDotBien } from "./_dot.mjs"

const CHI_DOC = `${URL_THU}?options=-c%20default_transaction_read_only%3Don`
const c = new pg.Client({ connectionString: CHI_DOC })
await c.connect()
const NGOAI_FIXTURE = `group_key NOT LIKE '%ndk-%' AND group_key NOT LIKE 'conv-gcn-%'`
const CHUAN = `regexp_replace(group_key, '^([^:]+:)?group:(.+)$', '\\2')`
const { rows: cap } = await c.query(`
  WITH so AS (SELECT unit_code, group_key, ${CHUAN} AS khoa FROM collection_units WHERE source_code = 'S03' AND ${NGOAI_FIXTURE}),
       trung AS (SELECT khoa FROM so GROUP BY 1 HAVING count(*) > 1)
  SELECT so.khoa, array_agg(so.unit_code ORDER BY so.group_key = so.khoa DESC, so.unit_code) AS ma
    FROM so JOIN trung USING (khoa)
   WHERE EXISTS (SELECT 1 FROM stg_zalo_posts p WHERE ${CHUAN.replace("group_key", "p.conversation_id")} = so.khoa)
   GROUP BY so.khoa`)
const { rows: khoaSo } = await c.query(`SELECT group_key, ${CHUAN} AS khoa FROM collection_units WHERE source_code = 'S03' AND ${NGOAI_FIXTURE}`)
const KHOA = [...new Set(khoaSo.flatMap((r) => [r.group_key, r.khoa]))]
await c.end()

const loi = []
if (cap.length === 0 || KHOA.length === 0) {
  console.log("loi DB thu khong co cap")
  process.exit(1)
}
console.log(`so cap trong so: ${cap.length} · so khoa de quet: ${KHOA.length}`)

const chay = (lenh) => spawnSync("node", [lenh, "--lat", "ndk-that-chi-doc", "--seed", "ndk", "--theo-nhom", "--moi-nhom-lon", "30", "--moi-nhom-nho", "5", "--so-nhom-lon", "10", "--thu"],
  { cwd: ROOT, env: { ...process.env, DATABASE_URL: CHI_DOC }, encoding: "utf8" })
const dem = (chu) => KHOA.reduce((n, k) => n + (chu.includes(k) ? 1 : 0), 0)

function danhGia(r) {
  const phu = cap.flatMap((x) => x.ma.slice(1))
  const dai = cap.map((x) => x.ma[0])
  const dong = (ma) => r.stdout.match(new RegExp(`nhóm ${ma}: chọn (\\d+)/(\\d+)`))
  return {
    tangPhu: phu.filter((m) => dong(m)).length,
    vuot: dai.filter((m) => { const d = dong(m); return d && (Number(d[1]) > Number(d[2]) || ![5, 30].includes(Number(d[2]))) }).length,
    daiCoMat: dai.filter((m) => dong(m)).length,
    gop: (r.stdout.match(/^gộp đơn vị trùng: /gm) ?? []).length,
    khoa: dem(r.stdout + r.stderr),
  }
}

const that = chay(LENH)
kiem(loi, that.status === 0, "lenh chay", `loi lenh: exit ${that.status}`)
const d = danhGia(that)
kiem(loi, d.tangPhu === 0 && d.daiCoMat === cap.length, "AC-7 khong tang phu", `loi tang phu: ${d.tangPhu}, dai dien co mat ${d.daiCoMat}/${cap.length}`)
kiem(loi, d.vuot === 0, "AC-7 khong vuot han muc", `loi vuot han muc: ${d.vuot}`)
kiem(loi, d.gop === cap.length, "AC-7 so dong gop bang so cap", `loi so dong gop: ${d.gop}/${cap.length}`)
kiem(loi, d.khoa === 0, "AC-7 khong in khoa that", `loi in khoa that: ${d.khoa}`)

const dot = await voiDotBien("M1", async (lenh) => { const r = chay(lenh); return { ...danhGia(r), status: r.status } })
kiem(loi, dot.status === 0 && dot.tangPhu > 0, "do M1: loi tang phu", "loi thuoc khong do: M1 khong tao tang phu")

// E8: các tệp vòng này đổi và mọi đầu ra không chứa khoá nào của sổ.
const REL = "_acceptance/nhom-dang-ky-hai-lan-s03"
const duyet = (d) => readdirSync(d).flatMap((t) => { const f = path.join(d, t); return statSync(f).isDirectory() ? duyet(f) : [f] })
const TEP = [
  ...duyet(path.join(ROOT, REL)),
  ...["docs/superpowers/specs/2026-11-04-nhom-dang-ky-hai-lan-s03-design.md", "docs/superpowers/plans/2026-11-04-nhom-dang-ky-hai-lan-s03.md",
    "pipeline/label-sample.mjs", "pipeline/lib/eval-labels.mjs", "pipeline/lib/eval-labels.test.mjs"].map((f) => path.join(ROOT, f)),
]
const quet = (ds) => ds.reduce((n, f) => n + dem(readFileSync(f, "utf8")), 0)
const trongTep = quet(TEP)
kiem(loi, trongTep === 0, `AC-8 tep doi 0 khop (${TEP.length} tep)`, `loi khoa trong tep: ${trongTep}`)
const trongRa = dem(that.stdout + that.stderr) + (await voiDotBien("M1", async (lenh) => { const r = chay(lenh); return dem(r.stdout + r.stderr) }))
kiem(loi, trongRa === 0, "AC-8 dau ra 0 khop", `loi khoa trong dau ra: ${trongRa}`)

// Đối chứng dương: khoá mồi lấy từ sổ, chỉ ở tệp tạm ngoài kho.
const tam = mkdtempSync(path.join(os.tmpdir(), "ndk-moi-"))
try {
  const f = path.join(tam, "moi.txt")
  writeFileSync(f, `mồi ${KHOA[0]}\n`)
  kiem(loi, quet([f]) > 0, "do: loi khoa trong tep", "loi thuoc quet tep khong do")
} finally {
  rmSync(tam, { recursive: true, force: true })
}
kiem(loi, dem(`chuỗi mồi ${KHOA[0]}`) > 0, "do: loi khoa trong dau ra", "loi thuoc quet dau ra khong do")

console.log(loi.length ? `THAT CHI DOC FAIL (${loi.length})` : "THAT CHI DOC OK")
process.exit(loi.length ? 1 : 0)
