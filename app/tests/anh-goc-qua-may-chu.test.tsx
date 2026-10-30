// anh-goc-qua-may-chu.test.tsx — hồ sơ _acceptance/anh-goc-qua-may-chu: ảnh tin chỉ có URL gốc (S06, S05) đi qua máy chủ theo
// media_key; trình duyệt không nhận URL hay tên máy nguồn. Tên ca mở đầu bằng mã AC (AGM-AC-n). Không gọi mạng thật: bộ tra
// DNS và bộ tải về đều giả; tên máy giả dùng đuôi `.test`.
import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { laDiaChiChan, layAnhGoc, type DiaChi, type PhanHoiNguon, type TaiVe, type TraDns } from "../src/lib/ops/lay-anh-goc"
import { serveZaloMedia, type MediaKeyQuery, type MediaKeyRow } from "../src/lib/ops/zalo-media"

type User = import("../src/lib/auth").User
const NGUOI = {
  khach: null,
  user: { id: "1", email: "agm-user@local.test", plan: "free", role: "user" },
  viewer: { id: "2", email: "agm-viewer@local.test", plan: "free", role: "viewer" },
  ops: { id: "3", email: "agm-ops@local.test", plan: "free", role: "ops" },
  admin: { id: "4", email: "agm-admin@local.test", plan: "free", role: "admin" },
} satisfies Record<string, User | null>
type Vai = keyof typeof NGUOI

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const HOST = "anh.nguon-gia.test"
const URL_GOC = `https://${HOST}/p/anh-1.jpg`
const CONG_KHAI: DiaChi = { address: "93.184.216.34", family: 4 }
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])

const dns = (map: Record<string, string[]> = {}): TraDns => async (h) =>
  (map[h] ?? [CONG_KHAI.address]).map((address) => ({ address, family: address.includes(":") ? 6 : 4 }))

async function* than(...phan: Uint8Array[]) {
  for (const p of phan) yield p
}

const anh = (headers: Record<string, string> = {}, ...body: Uint8Array[]): PhanHoiNguon => ({
  status: 200,
  headers: new Headers({ "content-type": "image/jpeg", ...headers }),
  body: than(...(body.length ? body : [JPEG])),
})

/** Bộ tải về giả theo URL; ghi lại mọi lần gọi. */
function taiGia(theoUrl: (u: URL, n: number) => PhanHoiNguon | Promise<PhanHoiNguon>) {
  const goi: { url: string; diaChi: DiaChi }[] = []
  const tai: TaiVe = async (u, diaChi) => {
    goi.push({ url: u.href, diaChi })
    return theoUrl(u, goi.length)
  }
  return { tai, goi }
}

const chuyen = (location: string): PhanHoiNguon => ({ status: 302, headers: new Headers({ location }), body: than() })

/** Phản hồi không lộ URL hay tên máy — ở thân lẫn header. */
async function khongLo(res: Response, ...hosts: string[]) {
  const text = await res.clone().text()
  const hdr = [...res.headers].map(([k, v]) => `${k}:${v}`).join("\n")
  for (const h of [HOST, ...hosts]) {
    assert.ok(!text.includes(h), `thân phản hồi chứa tên máy ${h}`)
    assert.ok(!hdr.includes(h), `header phản hồi chứa tên máy ${h}`)
  }
  assert.ok(!text.includes("https://"), "thân phản hồi chứa URL")
}

describe("AGM-AC-4 bộ lấy ảnh chặn nguồn xấu (bảng chặn của design doc)", () => {
  type Ca = { ten: string; ma: number; url?: string; dns?: Record<string, string[]>; tai?: (u: URL, n: number) => PhanHoiNguon; deps?: object }
  const RIENG = (ip: string): Ca => ({ ten: `SSRF địa chỉ riêng ${ip}`, ma: 403, dns: { [HOST]: [ip] } })
  const CA: Ca[] = [
    { ten: "URL http:", ma: 403, url: `http://${HOST}/p/anh-1.jpg` },
    RIENG("10.0.0.5"),
    RIENG("127.0.0.1"),
    RIENG("169.254.1.1"),
    RIENG("::1"),
    RIENG("fd00::1"),
    RIENG("fe80::1"),
    RIENG("::ffff:10.0.0.5"),
    {
      ten: "chuyển hướng tới địa chỉ riêng",
      ma: 403,
      dns: { "noi-bo.test": ["192.168.1.2"] },
      tai: (u) => (u.hostname === HOST ? chuyen("https://noi-bo.test/x.jpg") : anh()),
    },
    { ten: "4 chuyển hướng", ma: 502, tai: (_u, n) => chuyen(`/b${n}.jpg`) },
    { ten: "nguồn trả 404", ma: 502, tai: () => ({ ...anh(), status: 404 }) },
    { ten: "nguồn trả 500", ma: 502, tai: () => ({ ...anh(), status: 500 }) },
    { ten: "content-type text/html", ma: 502, tai: () => anh({ "content-type": "text/html" }) },
    { ten: "content-length 9 MB", ma: 502, tai: () => anh({ "content-length": String(9 * 1024 * 1024) }) },
    {
      ten: "stream quá cỡ (không khai độ dài, 9 MB)",
      ma: 502,
      tai: () => anh({}, new Uint8Array(5 * 1024 * 1024), new Uint8Array(4 * 1024 * 1024)),
    },
    {
      ten: "quá giờ",
      ma: 504,
      deps: { thoiHanMs: 40 },
      tai: () => ({ status: 200, headers: new Headers({ "content-type": "image/jpeg" }), body: treo() }),
    },
  ]

  async function* treo(): AsyncGenerator<Uint8Array> {
    await new Promise((r) => setTimeout(r, 400))
    yield JPEG
  }

  for (const ca of CA) {
    test(`AGM-AC-4 ${ca.ten} → ${ca.ma}, thân không lộ URL`, async () => {
      const { tai } = taiGia(ca.tai ?? (() => anh()))
      const res = await layAnhGoc(ca.url ?? URL_GOC, { traDns: dns(ca.dns), taiVe: tai, ...ca.deps })
      assert.equal(res.status, ca.ma)
      await khongLo(res, "noi-bo.test")
    })
  }

  // E4 liệt kê 16 ô (đếm lại chữ của E4: 1 http + 7 địa chỉ + 8 ca còn lại); con số «15» trong E4 là đếm hụt — sổ
  // quyết định ghi ở S3. Phép đo giữ đủ mọi ô E4 gọi tên.
  test("AGM-AC-4 ma trận đủ 16 ô viết trước một-một từ bảng chặn (đếm)", () => {
    assert.equal(CA.length, 16)
  })

  test("AGM-AC-4 đối chứng dương: ảnh hợp lệ qua một chuyển hướng hợp lệ → 200 đúng byte", async () => {
    const { tai, goi } = taiGia((_u, n) => (n === 1 ? chuyen(`https://cdn.nguon-gia.test/anh-1.jpg`) : anh()))
    const res = await layAnhGoc(URL_GOC, { traDns: dns(), taiVe: tai })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get("content-type"), "image/jpeg")
    await khongLo(res, "cdn.nguon-gia.test")
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), JPEG)
    assert.equal(goi.length, 2)
  })

  // Chiều đỏ: bản chép tạm của lay-anh-goc.ts đổi đúng một chỗ phải làm đúng ô của nó đỏ.
  const DOT: { ghim: string; o: string; thay: [string, string] }[] = [
    {
      ghim: "AGM-AC-4 SSRF địa chỉ riêng",
      o: "SSRF địa chỉ riêng 10.0.0.5",
      thay: ["if (diaChi.some((d) => laDiaChiChan(d.address))) return loi(403);", ""],
    },
    {
      ghim: "AGM-AC-4 stream quá cỡ",
      o: "stream quá cỡ (không khai độ dài, 9 MB)",
      thay: ["if (tong > tranByte) return loi(502);", ""],
    },
  ]
  for (const dot of DOT) {
    test(`chiều đỏ ${dot.ghim}: bản đột biến làm ô «${dot.o}» đỏ`, async () => {
      const goc = readFileSync(path.join(APP, "src/lib/ops/lay-anh-goc.ts"), "utf8")
      assert.ok(goc.includes(dot.thay[0]), "chỗ đột biến không còn trong tệp nguồn")
      const dir = mkdtempSync(path.join(APP, "tests", ".agm-dot-"))
      try {
        const f = path.join(dir, "lay-anh-goc.ts")
        writeFileSync(f, goc.replace(dot.thay[0], dot.thay[1]))
        const m = (await import(pathToFileURL(f).href)) as typeof import("../src/lib/ops/lay-anh-goc")
        const ca = CA.find((c) => c.ten === dot.o)!
        const { tai } = taiGia(ca.tai ?? (() => anh()))
        const res = await m.layAnhGoc(ca.url ?? URL_GOC, { traDns: dns(ca.dns), taiVe: tai, ...ca.deps })
        assert.notEqual(res.status, ca.ma, `${dot.ghim}: bản đột biến vẫn trả ${ca.ma} — phép đo không bắt được`)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })
  }

  test("AGM-AC-4 chuyển hướng tương đối ghép với URL hiện tại rồi kiểm lại", async () => {
    const { tai, goi } = taiGia((_u, n) => (n === 1 ? chuyen("/p/anh-2.jpg") : anh()))
    const res = await layAnhGoc(URL_GOC, { traDns: dns(), taiVe: tai })
    assert.equal(res.status, 200)
    assert.equal(goi[1].url, `https://${HOST}/p/anh-2.jpg`)
  })

  test("AGM-AC-4 chuyển hướng không có Location → 502", async () => {
    const { tai } = taiGia(() => ({ status: 302, headers: new Headers(), body: than() }))
    assert.equal((await layAnhGoc(URL_GOC, { traDns: dns(), taiVe: tai })).status, 502)
  })

  test("AGM-AC-4 nối bằng đúng địa chỉ đã kiểm; một địa chỉ riêng trong tập trả về là chặn", async () => {
    const { tai, goi } = taiGia(() => anh())
    assert.equal((await layAnhGoc(URL_GOC, { traDns: dns({ [HOST]: [CONG_KHAI.address, "10.0.0.1"] }), taiVe: tai })).status, 403)
    assert.equal(goi.length, 0, "không được nối khi có địa chỉ chặn")
    let lan = 0
    const doiDns: TraDns = async () => [{ address: lan++ === 0 ? CONG_KHAI.address : "127.0.0.1", family: 4 }]
    await layAnhGoc(URL_GOC, { traDns: doiDns, taiVe: tai })
    assert.equal(lan, 1, "chỉ tra DNS một lần mỗi bước")
    assert.equal(goi[0].diaChi.address, CONG_KHAI.address)
  })

  test("AGM-AC-4 laDiaChiChan: công khai qua, dải chặn bị chặn", () => {
    for (const ip of ["93.184.216.34", "8.8.8.8", "2606:4700::1111"]) assert.equal(laDiaChiChan(ip), false, ip)
    for (const ip of ["0.0.0.0", "100.64.0.1", "224.0.0.1", "::", "ff02::1", "::ffff:7f00:1", "not-an-ip"]) assert.equal(laDiaChiChan(ip), true, ip)
  })
})

// ---------- chế độ ?media= của serveZaloMedia (AC-1, 2, 3, 6) ----------
const K_GOC = "0123456789abcdef0123456789abcdef"
const K_LOCAL = "fedcba9876543210fedcba9876543210"
const K_VANG = "00000000000000000000000000000000"
const MEDIA_URL = "https://anh.nguon-gia.test/a.jpg"
const SNAP = "hanoi__s06-gia__2026-10-31T000000"
const BA_BYTE = new Uint8Array([0xff, 0xd8, 0xff])

const goc = mkdtempSync(path.join(os.tmpdir(), "agm-snap-"))
mkdirSync(path.join(goc, "hanoi", SNAP, "media"), { recursive: true })
writeFileSync(path.join(goc, "hanoi", SNAP, "media", "a.jpg"), JPEG)
const ngoai = mkdtempSync(path.join(os.tmpdir(), "agm-ngoai-"))
writeFileSync(path.join(ngoai, "bi-mat.jpg"), JPEG)
symlinkSync(path.join(ngoai, "bi-mat.jpg"), path.join(goc, "hanoi", SNAP, "media", "lien-ket.jpg"))
process.env.SNAPSHOTS_DIR = goc
process.on("exit", () => {
  rmSync(goc, { recursive: true, force: true })
  rmSync(ngoai, { recursive: true, force: true })
})

const BANG: Record<string, MediaKeyRow> = {
  [K_GOC]: { media_url: MEDIA_URL, local_file: null },
  [K_LOCAL]: { media_url: MEDIA_URL, local_file: `${SNAP}/media/a.jpg` },
}

function gia(bang: Record<string, MediaKeyRow> = BANG, nem?: unknown) {
  const dem = { db: 0, mang: 0 }
  const traMedia: MediaKeyQuery = async (k) => {
    dem.db++
    if (nem) throw nem
    return bang[k] ?? null
  }
  const layAnh = (async () => {
    dem.mang++
    return new Response(BA_BYTE, { headers: { "content-type": "image/jpeg" } })
  }) as typeof layAnhGoc
  return { dem, deps: { traMedia, layAnh } }
}

const goi = (key: string) => new Request(`http://localhost/api/zalo-media?media=${encodeURIComponent(key)}`)

type Serve = typeof serveZaloMedia
/** Bản chép tạm của zalo-media.ts đổi đúng một chỗ; import tương đối trỏ về src. */
async function banDot(thay: [string, string][]): Promise<{ serve: Serve; xoa: () => void }> {
  let src = readFileSync(path.join(APP, "src/lib/ops/zalo-media.ts"), "utf8")
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `chỗ đột biến không còn trong zalo-media.ts: ${a}`)
    src = src.replace(a, b)
  }
  src = src.replace(`from "./lay-anh-goc"`, `from ${JSON.stringify(path.join(APP, "src/lib/ops/lay-anh-goc.ts"))}`)
  const dir = mkdtempSync(path.join(APP, "tests", ".agm-dot-"))
  const f = path.join(dir, "zalo-media.ts")
  writeFileSync(f, src)
  const m = (await import(pathToFileURL(f).href)) as typeof import("../src/lib/ops/zalo-media")
  return { serve: m.serveZaloMedia, xoa: () => rmSync(dir, { recursive: true, force: true }) }
}

describe("AGM-AC-1 ảnh chỉ có URL gốc đi qua máy chủ, không lộ URL", () => {
  test("AGM-AC-1 vai ops, khoá chỉ URL gốc → 200 đúng 3 byte image/jpeg, không lộ tên máy", async () => {
    const { dem, deps } = gia()
    const res = await serveZaloMedia(goi(K_GOC), NGUOI.ops, deps)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get("content-type"), "image/jpeg")
    await khongLo(res, "nguon-gia")
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), BA_BYTE)
    assert.equal(dem.mang, 1)
  })

  test("chiều đỏ AGM-AC-1 lộ URL gốc: bản đột biến chép media_url vào header x-goc → phép đo bắt", async () => {
    const { serve, xoa } = await banDot([
      ["return layAnh(row.media_url);", `{ const r = await layAnh(row.media_url); const h = new Headers(r.headers); h.set("x-goc", row.media_url); return new Response(r.body, { status: r.status, headers: h }); }`],
    ])
    try {
      const res = await serve(goi(K_GOC), NGUOI.ops, gia().deps)
      await assert.rejects(khongLo(res, "nguon-gia"), /header phản hồi chứa tên máy/, "AGM-AC-1 lộ URL gốc: phép đo không bắt được")
    } finally {
      xoa()
    }
  })
})

describe("AGM-AC-2 ma trận 5 vai × 3 khoá", () => {
  const KHOA = { goc: K_GOC, local: K_LOCAL, vang: K_VANG } as const
  const DUOC: Vai[] = ["ops", "admin"]
  const O: { vai: Vai; khoa: keyof typeof KHOA; ma: number }[] = (Object.keys(NGUOI) as Vai[]).flatMap((vai) =>
    (Object.keys(KHOA) as (keyof typeof KHOA)[]).map((khoa) => ({ vai, khoa, ma: DUOC.includes(vai) && khoa !== "vang" ? 200 : 404 })),
  )
  test("AGM-AC-2 đủ 15 ô viết trước", () => assert.equal(O.length, 15))
  for (const o of O) {
    test(`AGM-AC-2 ${o.vai} × khoá ${o.khoa} → ${o.ma}`, async () => {
      const { dem, deps } = gia()
      const res = await serveZaloMedia(goi(KHOA[o.khoa]), NGUOI[o.vai], deps)
      assert.equal(res.status, o.ma)
      if (!DUOC.includes(o.vai)) assert.deepEqual(dem, { db: 0, mang: 0 }, "vai dưới Vận hành không được chạm DB hay mạng")
    })
  }

  test("chiều đỏ AGM-AC-2 viewer nhận ảnh: bản đột biến đổi xemNoiDungTin thành canAccessOps → ô viewer đỏ", async () => {
    const { serve, xoa } = await banDot([
      [`import { isAdmin, xemNoiDungTin } from "@/lib/ops-access";`, `import { canAccessOps, isAdmin, xemNoiDungTin } from "@/lib/ops-access";`],
      ["if (!xemNoiDungTin(user)) return notFound();", "if (!canAccessOps(user)) return notFound();"],
    ])
    try {
      const res = await serve(goi(K_GOC), NGUOI.viewer, gia().deps)
      assert.notEqual(res.status, 404, "AGM-AC-2 viewer nhận ảnh: phép đo không bắt được")
    } finally {
      xoa()
    }
  })
})

describe("AGM-AC-3 khoá hỏng, khoá vắng, cloud thiếu bảng → 404, không gọi mạng", () => {
  const CA: [string, string, unknown?][] = [
    ["khoá '../x'", "../x"],
    ["khoá rỗng", ""],
    ["khoá có ký tự ngoài khuôn", "0123456789abcdef0123456789abcdeg"],
    ["khoá viết hoa", K_GOC.toUpperCase()],
    ["khoá không có dòng", K_VANG],
    ["truy vấn DB ném 42P01 (cloud)", K_GOC, Object.assign(new Error("relation does not exist"), { code: "42P01" })],
  ]
  for (const [ten, key, nem] of CA) {
    test(`AGM-AC-3 ${ten} → 404, fetch 0 lần`, async () => {
      const { dem, deps } = gia(BANG, nem)
      const res = await serveZaloMedia(goi(key), NGUOI.ops, deps)
      assert.equal(res.status, 404)
      assert.equal(dem.mang, 0)
    })
  }
  test("AGM-AC-3 đối chứng dương: khoá có thật → 200", async () => {
    assert.equal((await serveZaloMedia(goi(K_GOC), NGUOI.ops, gia().deps)).status, 200)
  })
})

describe("AGM-AC-6 dòng có local_file phục vụ từ đĩa qua hai lớp kiểm", () => {
  test("AGM-AC-6 local_file hợp lệ → 200 đúng byte, fetch 0 lần", async () => {
    const { dem, deps } = gia()
    const res = await serveZaloMedia(goi(K_LOCAL), NGUOI.ops, deps)
    assert.equal(res.status, 200)
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), JPEG)
    assert.equal(dem.mang, 0)
  })
  for (const [ten, lf] of [
    ["local_file thoát gốc (../)", `${SNAP}/media/../../../../etc/a.jpg`],
    ["local_file là symlink ra ngoài", `${SNAP}/media/lien-ket.jpg`],
  ]) {
    test(`AGM-AC-6 ${ten} → 403, fetch 0 lần`, async () => {
      const { dem, deps } = gia({ [K_LOCAL]: { media_url: MEDIA_URL, local_file: lf } })
      const res = await serveZaloMedia(goi(K_LOCAL), NGUOI.ops, deps)
      assert.equal(res.status, 403)
      assert.equal(dem.mang, 0)
    })
  }
})
