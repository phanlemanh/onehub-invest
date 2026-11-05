// _dot.mjs — bản đột biến của lệnh lấy mẫu: chép vào thư mục tạm trong pipeline/, đổi đúng một chỗ, các import khác trỏ về bản thật.
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { pg, ROOT, URL_THU } from "../../gan-nhan-theo-nhom-s03/probes/_db.mjs"

export const LENH = path.join(ROOT, "pipeline/label-sample.mjs")
const PIPE = path.join(ROOT, "pipeline")
const MOC_KHOA = 'String(khoa).replace(/^(?:[^:]+:)?group:(?=.)/, "")'
const MOC_XEP = "khac_nhau: new Set(ds.map((x) => x.h)).size"

const KHOA_DB_THU = 7315

/** Giữ khoá riêng của DB thử tới hết tiến trình: hai đầu dò cùng chạy thì đầu dò sau chờ, không thấy fixture đang dựng của đầu dò trước. Chờ quá 5 phút thì ném. */
export async function giuDbThu() {
  const k = new pg.Client({ connectionString: URL_THU })
  await k.connect()
  await k.query(`SET lock_timeout = '300s'`)
  await k.query(`SELECT pg_advisory_lock($1)`, [KHOA_DB_THU])
  return k
}

/** Một kết nối khác có chiếm được khoá riêng không; chiếm được thì nhả ngay. */
export async function chiemDuocDbThu() {
  const k = new pg.Client({ connectionString: URL_THU })
  await k.connect()
  const { rows: [{ duoc }] } = await k.query(`SELECT pg_try_advisory_lock($1) AS duoc`, [KHOA_DB_THU])
  await k.end()
  return duoc
}

/** Mỗi đột biến: [tệp, chỗ cũ, chỗ mới]. Chỗ cũ không còn thì ném: thước không được xanh vì đột biến không áp được. */
export const DOT_BIEN = {
  M1: ["lib/eval-labels.mjs", MOC_KHOA, "String(khoa)"],
  M2: ["lib/eval-labels.mjs", "(a.group_key === khoa ? 0 : 1) - (b.group_key === khoa ? 0 : 1) || ", ""],
  M3: ["label-sample.mjs", "console.log(`gộp đơn vị trùng: ${g.unit_code} ← ${g.gop_tu.join(\", \")} · bài ở khoá phụ ${g.bai_khoa_phu}`);", ""],
  M4: ["lib/eval-labels.mjs", MOC_KHOA, 'String(khoa).replace(/^.*:/, "")'],
  M5: ["lib/eval-labels.mjs", MOC_XEP, "khac_nhau: Math.max(...[...new Set(ds.map((x) => x.conversation_id))].map((k) => new Set(ds.filter((x) => x.conversation_id === k).map((x) => x.h)).size))"],
  M6: ["lib/eval-labels.mjs", MOC_XEP, "khac_nhau: ds.length"],
}

/** Chạy `viec(lenh)` với lệnh đột biến, dọn thư mục tạm dù có lỗi. */
export async function voiDotBien(ma, viec) {
  const [tep, cu, moi] = DOT_BIEN[ma]
  const dir = mkdtempSync(path.join(PIPE, ".ndk-dot-"))
  try {
    mkdirSync(path.join(dir, "lib"))
    const doc = (f) => readFileSync(path.join(PIPE, f), "utf8")
    const ban = { "label-sample.mjs": doc("label-sample.mjs"), "lib/eval-labels.mjs": doc("lib/eval-labels.mjs") }
    if (!ban[tep].includes(cu)) throw new Error(`chỗ đột biến ${ma} không còn trong ${tep}`)
    ban[tep] = ban[tep].replace(cu, moi)
    const veThat = (src, goc, giu) => src.replace(/from "\.\/([^"]+)"/g, (m, rel) => (giu.includes(rel) ? m : `from ${JSON.stringify(pathToFileURL(path.join(goc, rel)).href)}`))
    writeFileSync(path.join(dir, "label-sample.mjs"), veThat(ban["label-sample.mjs"], PIPE, ["lib/eval-labels.mjs"]))
    writeFileSync(path.join(dir, "lib/eval-labels.mjs"), veThat(ban["lib/eval-labels.mjs"], path.join(PIPE, "lib"), []))
    return await viec(path.join(dir, "label-sample.mjs"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
