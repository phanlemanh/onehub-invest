// that-chi-doc.mjs — E7, E8: chỉ đọc trên DB thử. Cặp trùng đọc từ sổ bằng SQL, độc lập với mã. Chỉ in số lượng, không in khoá.
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { kiem, pg, ROOT, URL_THU } from "../../gan-nhan-theo-nhom-s03/probes/_db.mjs"
import { chiemDuocDbThu, giuDbThu, LENH, voiDotBien } from "./_dot.mjs"
import { DAY_315, dayNhanh, demKhop, quetTep, tepTheoDiff } from "./_quet.mjs"

await giuDbThu()
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
kiem(loi, !(await chiemDuocDbThu()), "do: khoa rieng DB thu", "loi khoa rieng DB thu khong chan dau do khac")
if (cap.length === 0 || KHOA.length === 0) {
  console.log("loi DB thu khong co cap")
  process.exit(1)
}
console.log(`so cap trong so: ${cap.length} · so khoa de quet: ${KHOA.length}`)

const chay = (lenh) => spawnSync("node", [lenh, "--lat", "ndk-that-chi-doc", "--seed", "ndk", "--theo-nhom", "--moi-nhom-lon", "30", "--moi-nhom-nho", "5", "--so-nhom-lon", "10", "--thu"],
  { cwd: ROOT, env: { ...process.env, DATABASE_URL: CHI_DOC }, encoding: "utf8" })
const dem = (chu) => demKhop(chu, KHOA)

function danhGia(r) {
  const phu = cap.flatMap((x) => x.ma.slice(1))
  const dai = cap.map((x) => x.ma[0])
  const dong = (ma) => r.stdout.match(new RegExp(`nhóm ${ma}: chọn (\\d+)/(\\d+)`))
  return {
    tangPhu: phu.filter((m) => dong(m)).length,
    // Hạn mức tính trên cả nhóm thật: tổng chọn của mọi mã cùng khoá không quá `can` của đại diện. Từng tầng riêng lẻ thì `chọn` luôn không quá `can`, vế không thể đỏ.
    vuot: cap.filter(({ ma }) => {
      const d = dong(ma[0])
      if (!d) return false
      const tong = ma.reduce((n, m) => n + Number(dong(m)?.[1] ?? 0), 0)
      return tong > Number(d[2]) || ![5, 30].includes(Number(d[2]))
    }).length,
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
kiem(loi, dot.status === 0 && dot.vuot > 0, "do M1: loi vuot han muc", "loi thuoc han muc khong do: M1 khong vuot")

// E8: các tệp hồ sơ này và nhánh hiện tại đổi, lấy từ git diff, cùng mọi đầu ra không chứa khoá nào của sổ.
const TEP = tepTheoDiff(ROOT, [DAY_315, dayNhanh(ROOT)])
kiem(loi, TEP.length > 0, `AC-8 tep theo git diff (${TEP.length} tep)`, "loi danh sach tep")
const BA_TEP = ["_acceptance/config.yaml", "LO-TRINH.html", "PRODUCT-MAP.md"]
kiem(loi, BA_TEP.every((f) => TEP.includes(f)), "AC-8 co ba tep ban cu bo sot", "loi thieu tep ban cu bo sot")
const trongTep = quetTep(ROOT, TEP, KHOA)
kiem(loi, trongTep === 0, `AC-8 tep doi 0 khop (${TEP.length} tep)`, `loi khoa trong tep: ${trongTep}`)
let rong = false
try { tepTheoDiff(ROOT, ["HEAD..HEAD"]) } catch (e) { rong = e.message === "danh sach tep rong" }
kiem(loi, rong, "do: danh sach rong thi do", "loi thuoc danh sach rong khong do")
const trongRa = dem(that.stdout + that.stderr) + (await voiDotBien("M1", async (lenh) => { const r = chay(lenh); return dem(r.stdout + r.stderr) }))
kiem(loi, trongRa === 0, "AC-8 dau ra 0 khop", `loi khoa trong dau ra: ${trongRa}`)

// Đối chứng dương: khoá mồi lấy từ sổ, chỉ ở kho git tạm ngoài kho.
const tam = mkdtempSync(path.join(os.tmpdir(), "ndk-moi-"))
try {
  const g = (...a) => execFileSync("git", ["-C", tam, "-c", "user.name=thu", "-c", "user.email=thu@local.test", "-c", "core.hooksPath=/dev/null", ...a], { stdio: "ignore" })
  g("init", "-q")
  g("commit", "-q", "--allow-empty", "-m", "goc")
  writeFileSync(path.join(tam, "moi.txt"), `mồi ${KHOA[0]}\n`)
  g("add", "moi.txt")
  g("commit", "-q", "-m", "moi")
  kiem(loi, quetTep(tam, tepTheoDiff(tam, ["HEAD^..HEAD"]), KHOA) > 0, "do: loi khoa trong commit kho tam", "loi thuoc quet tep khong do")
} finally {
  rmSync(tam, { recursive: true, force: true })
}
kiem(loi, dem(`chuỗi mồi ${KHOA[0]}`) > 0, "do: loi khoa trong dau ra", "loi thuoc quet dau ra khong do")

console.log(loi.length ? `THAT CHI DOC FAIL (${loi.length})` : "THAT CHI DOC OK")
process.exit(loi.length ? 1 : 0)
