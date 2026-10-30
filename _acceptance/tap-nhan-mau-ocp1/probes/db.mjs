// db.mjs — hồ sơ tap-nhan-mau-ocp1 (PL8): E5 (AC-5 khuôn rút từ tin gốc), E6 (AC-6 không định danh), E8b (AC-8 không dòng
// mẫu nào trong canonical/stg). Đọc DB local `oneinvest` trong MỘT giao dịch READ ONLY — không ghi gì. Mỗi phần chạy hàm
// kiểm trên dữ liệu thật (xanh) rồi trên bản hỏng trong bộ nhớ (đỏ, thông điệp ghim). Đối chứng của E8b chạy CÙNG câu đếm
// trên một bảng VALUES chứa post_id «mau-thu» thay cho bảng thật — chứng câu đếm bắt được dòng mẫu mà không ghi DB.
// Không in chữ tin, tên người hay tên nguồn: chỉ in mã khuôn và số đếm.
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg")
const nap = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const { loadStgPosts } = await nap("pipeline/lib/test-posts.mjs")
const { LAT_NHOM, textHash } = await nap("pipeline/lib/eval-labels.mjs")
const { normText } = await nap("pipeline/transform-zalo.mjs")
const { KHUON } = await nap("pipeline/lib/khuon-mau-ocp1.mjs")
const { sinhTapMau } = await nap("pipeline/lib/tap-mau.mjs")

const URL = process.env.TNM_DB_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
const PHU_TOI_THIEU = 0.8
const KE_LE = 4
const SEEDS = ["a", "pl9", "kiem"]

/** Bỏ SĐT và URL khỏi chữ tin gốc trước khi so (cùng cách transform đọc số trên chữ đã gạt URL/SĐT). */
const gatSo = (s) => (s ?? "").replace(/https?:\/\/\S+/g, " ").replace(/(?:\+?84|0)\d(?:[ .]?\d){7,10}/g, " ")

/**
 * Phần chữ cố định của khung có mặt theo thứ tự trong tin gốc: mỗi đoạn giữa hai ô tách thành từ (normText), tìm chuỗi
 * từ liền nhau dài nhất từ con trỏ trở đi; chuỗi ≥ 2 từ (hoặc đoạn chỉ có một từ) được tính và đẩy con trỏ; từ lẻ chỉ
 * tính khi nằm trong KE_LE từ ngay sau con trỏ.
 * @returns {number} tỉ lệ ký tự của chữ cố định khớp
 */
export function phu(khung, goc) {
  const g = normText(gatSo(goc)).split(" ").filter(Boolean)
  const doan = khung.split(/\{[a-z_]+\}/).map((s) => normText(s).split(" ").filter(Boolean)).filter((t) => t.length)
  let con = 0, tong = 0, khop = 0
  for (const t of doan) {
    tong += t.reduce((s, w) => s + w.length, 0)
    let i = 0
    while (i < t.length) {
      let dai = 0, tai = -1
      for (let j = con; j < g.length; j++) {
        let l = 0
        while (i + l < t.length && j + l < g.length && g[j + l] === t[i + l]) l++
        if (l > dai) { dai = l; tai = j }
      }
      if (dai >= (t.length === 1 ? 1 : 2)) {
        khop += t.slice(i, i + dai).reduce((s, w) => s + w.length, 0)
        con = tai + dai
        i += dai
      } else {
        // từ lẻ: chỉ tính khi đứng ngay sau con trỏ, cách tối đa KE_LE từ (khung bỏ một mẩu nhiễu ngắn của tin gốc)
        const gan = g.slice(con, con + KE_LE + 1).indexOf(t[i])
        if (gan >= 0) { khop += t[i].length; con += gan + 1 }
        i++
      }
    }
  }
  return tong === 0 ? 1 : khop / tong
}

/** E5: mọi khuôn có goc trong lát, goc không trùng, khung rút từ chính tin gốc. */
export function kiemGoc(khuon, theoBam) {
  const da = new Map()
  for (const k of khuon) {
    if (da.has(k.goc)) throw new Error(`GOC TRUNG: ${k.id} (cùng gốc với ${da.get(k.goc)})`)
    da.set(k.goc, k.id)
    const goc = theoBam.get(k.goc)
    if (goc === undefined) throw new Error(`GOC KHONG CO: ${k.id}`)
    const p = phu(k.khung, goc)
    if (p < PHU_TOI_THIEU) throw new Error(`KHUON KHONG RUT TU GOC: ${k.id} (phủ ${(p * 100).toFixed(0)}%)`)
  }
  return khuon.length
}

const SDT = /(?<![\dA-Za-z])(?:\+?84|0)\d(?:[ .]?\d){8,9}(?![\dA-Za-z])/
const URL_RE = /https?:\/\/|www\.|(?<![\p{L}\p{N}])[a-z0-9-]+\.(?:com|vn|net|org|io|me)(?![\p{L}\p{N}])/iu
const ranhGioi = (chu, ten) => {
  for (let i = chu.indexOf(ten); i >= 0; i = chu.indexOf(ten, i + 1)) {
    const truoc = chu[i - 1] ?? " ", sau = chu[i + ten.length] ?? " "
    if (!/[\p{L}\p{N}]/u.test(truoc) && !/[\p{L}\p{N}]/u.test(sau)) return true
  }
  return false
}
const chuan = (s) => (s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim()

/**
 * E6: quét chữ — SĐT VN (10–11 số, cho phép dấu cách/chấm), URL, tên người gửi, tên nhóm (so nguyên tên, có ranh giới
 * từ, tên ≥ 2 từ hoặc ≥ 6 ký tự), tên nguồn thật (so mọi độ dài). Trả danh sách lỗi theo nhãn, không kèm chữ lộ.
 */
/** Danh sách tên đem so, sau chuẩn hoá và lọc độ dài — cùng một hàm cho phép quét và đối chứng dương «khác rỗng». */
export function dsTen({ nguoi, nhom, nguon }) {
  const ten = (ds) => [...new Set(ds.map(chuan).filter((t) => t && (t.includes(" ") || t.length >= 6)))]
  return { nguoi: ten(nguoi), nhom: ten(nhom), nguon: [...new Set(nguon.map(chuan).filter((t) => t.length >= 3))] }
}

export function quetDinhDanh(chuDs, danhBa) {
  const loi = []
  const { nguoi: dsNguoi, nhom: dsNhom, nguon: dsNguon } = dsTen(danhBa)
  for (const [nhan, chu] of chuDs) {
    // băm hex 64 ký tự (goc, khuon_ban) không phải chữ người viết — bỏ trước khi tìm SĐT
    const c = chuan(chu).replace(/\b[0-9a-f]{64}\b/g, " ")
    if (SDT.test(c)) loi.push(`SDT LOT: ${nhan}`)
    if (URL_RE.test(c)) loi.push(`URL LOT: ${nhan}`)
    if (dsNguoi.some((t) => ranhGioi(c, t))) loi.push(`TEN NGUOI GUI LOT: ${nhan}`)
    if (dsNhom.some((t) => ranhGioi(c, t))) loi.push(`TEN NHOM LOT: ${nhan}`)
    if (dsNguon.some((t) => ranhGioi(c, t))) loi.push(`TEN NGUON LOT: ${nhan}`)
  }
  return loi
}

/** E8b: đếm dòng mẫu trong canonical và stg. `canonical`/`stg` là tên quan hệ — đối chứng truyền bảng VALUES cùng cột. */
export async function demMau(c, { canonical = "sale_offer_records", stg = "stg_zalo_posts" } = {}) {
  const { rows: [a] } = await c.query(
    `SELECT count(*)::int AS n FROM ${canonical}
     WHERE originating_system_key LIKE 'mau-%' OR EXISTS (SELECT 1 FROM unnest(post_ids) p WHERE p::text LIKE 'mau-%')`)
  const { rows: [b] } = await c.query(`SELECT count(*)::int AS n FROM ${stg} WHERE post_id LIKE 'mau-%'`)
  return { canonical: a.n, stg: b.n }
}

async function main() {
  const c = new pg.Client({ connectionString: URL })
  await c.connect()
  let hong = 0
  const bao = (ok, dong) => { console.log(dong); if (!ok) hong++ }
  try {
    await c.query("BEGIN READ ONLY")
    const { posts } = await loadStgPosts(c, "zalo")
    const re = new RegExp(LAT_NHOM.ocp1, "i")
    const lat = posts.filter((p) => re.test(p.group_name ?? ""))
    const theoBam = new Map()
    for (const p of lat) if (!theoBam.has(textHash(p.text))) theoBam.set(textHash(p.text), p.text)

    // E5
    try {
      const k = kiemGoc(KHUON, theoBam)
      bao(true, `GOC OK ${k}/${KHUON.length}`)
      for (const kh of KHUON) console.log(`  ${kh.id} phủ ${(phu(kh.khung, theoBam.get(kh.goc)) * 100).toFixed(0)}%`)
    } catch (e) { bao(false, e.message) }
    const doi = (ds, re2, ten) => { try { kiemGoc(ds, theoBam); bao(false, `doi chung ${ten}: KHONG BAT`) } catch (e) { bao(re2.test(e.message), `doi chung ${ten}: ${e.message}`) } }
    const [k1, k2] = KHUON
    doi([{ ...k1, goc: "0".repeat(64) }], /^GOC KHONG CO: K01$/, "goc gia")
    doi([{ ...k1, khung: KHUON.at(-1).khung }], /^KHUON KHONG RUT TU GOC: K01/, "khung tin khac")
    doi([k1, { ...k2, goc: k1.goc }], /^GOC TRUNG: K02/, "goc trung")

    // E6
    const nguoi = [...new Set(lat.map((p) => p.sender_name).filter(Boolean))]
    const nhom = [...new Set(lat.map((p) => p.group_name).filter(Boolean))]
    const { rows: src } = await c.query(`SELECT real_name, source_ids FROM source_registry`)
    const nguon = src.flatMap((r) => [r.real_name, ...(Array.isArray(r.source_ids) ? r.source_ids : [])]).filter((x) => typeof x === "string")
    const ds = [
      ["pipeline/lib/khuon-mau-ocp1.mjs", readFileSync(path.join(ROOT, "pipeline/lib/khuon-mau-ocp1.mjs"), "utf8")],
      ["pipeline/lib/tap-mau.mjs", readFileSync(path.join(ROOT, "pipeline/lib/tap-mau.mjs"), "utf8")],
      ["_acceptance/tap-nhan-mau-ocp1/mau-kiem.jsonl", readFileSync(path.join(ROOT, "_acceptance/tap-nhan-mau-ocp1/mau-kiem.jsonl"), "utf8")],
      ...SEEDS.flatMap((s) => sinhTapMau({ lat: "ocp1", n: 200, seed: s }).tin.map((t) => [t.id, t.text])),
    ]
    const danhBa = { nguoi, nhom, nguon }
    const dsSo = dsTen(danhBa)
    // đối chứng dương: ba danh sách đọc từ DB phải khác rỗng — rỗng thì «DINH DANH 0» đúng một cách vô nghĩa
    for (const [loai, ds2] of Object.entries(dsSo)) bao(ds2.length > 0, ds2.length > 0 ? `danh sach ${loai}: ${ds2.length} ten` : `DANH SACH TEN RONG: ${loai}`)
    const loi = quetDinhDanh(ds, danhBa)
    bao(loi.length === 0, loi.length === 0 ? `DINH DANH 0 (${ds.length} chữ quét · ${dsSo.nguoi.length} tên người gửi · ${dsSo.nhom.length} tên nhóm · ${dsSo.nguon.length} tên nguồn)` : loi.join("\n"))
    const xanh = quetDinhDanh([["doi-chung-xanh", "phương án thanh toán · Ocean Park 1 · OCP1"]], danhBa)
    bao(xanh.length === 0, `doi chung xanh: ${xanh.length === 0 ? "DINH DANH 0" : xanh.join(", ")}`)
    // đối chứng đỏ: chèn một SĐT và MỘT TÊN THẬT lấy từ chính danh sách DB (không thêm tên vào danh sách) cho từng loại
    const that = { nguoi: dsSo.nguoi.find((t) => t.includes(" ")) ?? dsSo.nguoi[0], nhom: dsSo.nhom[0], nguon: dsSo.nguon[0] }
    const doCa = [["SDT LOT", "Bán căn 2N liên hệ 0912 345 678"], ["TEN NGUOI GUI LOT", `gặp ${that.nguoi} nhé`],
      ["TEN NHOM LOT", `đăng ở ${that.nhom} nhé`], ["TEN NGUON LOT", `xem trên ${that.nguon} nhé`]]
    for (const [nhan, chu] of doCa) {
      const r = chu.includes("undefined") ? [] : quetDinhDanh([["doi-chung-do", chu]], danhBa)
      bao(r.some((x) => x.startsWith(nhan)), `doi chung do: ${nhan} ${r.some((x) => x.startsWith(nhan)) ? "bat" : "KHONG BAT"}`)
    }

    // E8b
    const d = await demMau(c)
    bao(d.canonical === 0 && d.stg === 0, `CANONICAL ${d.canonical} · STG ${d.stg}`)
    // đối chứng: cùng hai câu đếm trên bảng VALUES cùng cột — mỗi vế canonical (khoá, phần tử post_ids) và stg phải bắt đúng
    const dc = await demMau(c, {
      canonical: "(VALUES ('mau-ocp1-a-1'::text, ARRAY['p-1']::text[]), ('s03:p-2', ARRAY['mau-ocp1-a-2']::text[]), ('s03:p-3', ARRAY['p-3']::text[])) AS v(originating_system_key, post_ids)",
      stg: "(VALUES ('mau-thu'), ('p-123')) AS v(post_id)",
    })
    bao(dc.canonical === 2, dc.canonical === 2 ? "doi chung: MAU LOT VAO CANONICAL (cau dem bat 2 dong: khoa + post_ids)" : `doi chung canonical: cau dem ra ${dc.canonical}`)
    bao(dc.stg === 1, dc.stg === 1 ? "doi chung: MAU LOT VAO STG (cau dem bat 1 dong)" : `doi chung: cau dem ra ${dc.stg}`)
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
  if (hong) { console.error(`${hong} phep do do`); process.exit(1) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
}
