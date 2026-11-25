// da3-dau-cuoi.test.tsx — hồ sơ _acceptance/bang-noi-ma-du-an (DA3), ca «BN-AC-9» (E9). Probe dữ liệu thật, NGOÀI suite chung app:
// chạy trên DB của riêng lượt (db/db-thu.sh oneinvest_suite_* --chay) — bản chép DB máy thu — trong một giao dịch ROLLBACK.
//   1. Mỗi ngả của thẻ S07, S08 (bóng), S09, S10, S16 so với bộ đo S1 đóng băng (probes/s1/do.mjs, đếm độc lập với mã của hàng).
//   2. Ô «Mã nguồn chưa nối» đọc bằng docDanhBa của app: trước (phạm vi cũ S06, S08, S09) · đổi phạm vi · sau nối · sau đảo đủ luật.
// Ghi evidence/dau-cuoi.md và evidence/the-S07.md (đầu vào của E10) vào thư mục DA3_RA. Lệch thì ca đỏ, gọi tên nguồn và ngả.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

import { apThe, daoLuat, dungThe } from "../../pipeline/noi-du-an-nguon.mjs"
import { oSo } from "../src/components/ops/registry/registry-view"
import { docDanhBa, type DanhBa } from "../src/lib/ops/registry/doc"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const RA = process.env.DA3_RA ?? join(ROOT, "_acceptance/bang-noi-ma-du-an/evidence")
const URL_DB = process.env.DATABASE_URL ?? ""
const c = new pg.Client({ connectionString: URL_DB })
const NGUON_AP = ["S07", "S09", "S10", "S16"]
const NGA_S1: Record<string, string> = { "khong-tinh": "khong_tinh", "khong-vi-tri": "khong_tinh", "khong-ten": "ten_rong", "nhieu-nut": "nhieu_nut", "khong-khop": "khong_khop" }
const KHOA = ["khong_tinh", "ten_rong", "K1", "K2", "K3", "T", "K4", "nhieu_nut", "khong_khop"]

before(async () => {
  assert.match(new URL(URL_DB).pathname, /^\/oneinvest_suite_[a-z0-9_]+$/, "BN-AC-9 chỉ chạy trên DB của riêng lượt oneinvest_suite_*")
  await c.connect()
})
after(() => c.end())

type Kq = { nga: string; can_cu?: string; ly_do?: string; bong?: Kq }
const ngaS1 = (kq: Kq): string => { const k = kq.nga === "giu" ? kq.bong! : kq; return k.nga === "noi" ? k.can_cu! : NGA_S1[k.ly_do!] ?? `la:${k.ly_do}` }
const o = (d: DanhBa) => oSo(d.tong).find((x) => x.title === "Mã nguồn chưa nối")!
const chuaNoi = (d: DanhBa, s: string) => d.tong.danhMuc.find((x) => x.source === s)?.chuaNoi ?? 0
const tongO = (d: DanhBa) => d.tong.danhMuc.filter((x) => x.tinhVaoO).reduce((a, x) => a + x.chuaNoi, 0)

test("BN-AC-9 dau-cuoi tren ban chep: nga bang bo do S1, o tach hai hieu ung, dao ve cot doi pham vi", async () => {
  const r = spawnSync(process.execPath, [join(ROOT, "_acceptance/bang-noi-ma-du-an/probes/s1/do.mjs")],
    { env: { ...process.env, DATABASE_URL: URL_DB }, encoding: "utf8", maxBuffer: 1 << 28 })
  assert.equal(r.status, 0, `bộ đo S1 lỗi: ${r.stderr.slice(-300)}`)
  const s1 = JSON.parse(r.stdout) as { bong: Record<string, Record<string, number>> }

  await c.query("BEGIN")
  try {
    const lech: string[] = []
    const md: string[] = ["# DA3 đầu–cuối trên bản chép DB máy thu", "", `Lúc đo: ${new Date().toISOString()}`, "",
      "## Ngả của thẻ so với bộ đo S1 đóng băng", "", "| Nguồn | Ngả | DA3 | Bộ đo S1 | Hiệu |", "|---|---|---|---|---|"]
    const the: Record<string, Awaited<ReturnType<typeof dungThe>>> = {}
    for (const n of ["S07", "S08", "S09", "S10", "S16"]) {
      the[n] = await dungThe(c, n)
      const dem: Record<string, number> = {}
      for (const d of the[n].ds) dem[ngaS1(d.kq)] = (dem[ngaS1(d.kq)] ?? 0) + 1
      for (const k of new Set([...KHOA, ...Object.keys(dem)])) {
        const a = dem[k] ?? 0, b = s1.bong[n][k] ?? 0
        if (a || b) md.push(`| ${n} | ${k} | ${a} | ${b} | ${a - b} |`)
        if (a !== b) lech.push(`${n} ${k}: DA3 ${a}, bộ đo S1 ${b}`)
      }
    }
    mkdirSync(RA, { recursive: true })
    writeFileSync(join(RA, "the-S07.md"), the.S07.markdown)

    const d0 = await docDanhBa(c)
    const truocCu = ["S06", "S08", "S09"].reduce((a, s) => a + chuaNoi(d0, s), 0)
    const luat: number[] = []
    for (const n of NGUON_AP) {
      const t = await dungThe(c, n)
      luat.push(...(await apThe(c, { nguon: n, bam: t.bam, nguoi: "do-dau-cuoi", giaoDich: "ngoai" })).rules.map((x) => x.id))
    }
    const d1 = await docDanhBa(c)
    for (const id of luat) await daoLuat(c, { ruleId: id, nguoi: "do-dau-cuoi", giaoDich: "ngoai" })
    const d2 = await docDanhBa(c)

    md.push("", "## Ô «Mã nguồn chưa nối» (docDanhBa của app)", "",
      "Trước: phạm vi cũ (S06, S08, S09). Đổi phạm vi: ô đếm thêm S07, S16; S10 hiện riêng. Sau nối: áp thẻ S07, S09, S10, S16. Sau đảo: đảo đủ mọi luật.", "",
      "| Nguồn | Trước | Đổi phạm vi | Sau nối | Sau đảo |", "|---|---|---|---|---|")
    for (const x of d0.tong.danhMuc) {
      const cu = ["S06", "S08", "S09"].includes(x.source) ? String(x.chuaNoi) : "—"
      md.push(`| ${x.source}${x.tinhVaoO ? "" : ` (${x.lyDoRieng}, không cộng)`} | ${cu} | ${x.chuaNoi}/${x.daNap} | ${chuaNoi(d1, x.source)}/${x.daNap} | ${chuaNoi(d2, x.source)}/${x.daNap} |`)
    }
    md.push(`| **Ô** | **${truocCu}** | **${tongO(d0)}** | **${tongO(d1)}** | **${tongO(d2)}** |`, "",
      `Ô dựng trên màn: đổi phạm vi «${o(d0).value}», sau nối «${o(d1).value}».`, "")
    if (lech.length) md.push("## Lệch", "", ...lech.map((l) => `- ${l}`), "")
    writeFileSync(join(RA, "dau-cuoi.md"), md.join("\n"))
    console.log(md.join("\n"))

    assert.deepEqual(lech, [], "ngả của thẻ phải bằng bộ đo S1")
    const noiS07 = (s1.bong.S07.K3 ?? 0) + (s1.bong.S07.T ?? 0)
    assert.equal(chuaNoi(d1, "S07"), chuaNoi(d0, "S07") - noiS07, "S07 giảm đúng số K3 + T")
    assert.equal(tongO(d2), tongO(d0), "đảo đủ luật thì ô về cột đổi phạm vi")
    for (const s of ["S07", "S09", "S16"]) assert.equal(chuaNoi(d2, s), chuaNoi(d0, s), `${s} về cột đổi phạm vi`)
  } finally {
    await c.query("ROLLBACK")
  }
})
