// khu-trung-anh.test.tsx — hồ sơ _acceptance/khu-trung-anh-tin (GT1): thẻ gắn nhãn (KTA-AC-8) và thước đối chiếu (phần NH-AC-3 của KTA-AC-7).
// Hàm thuần, route thật với tệp giả. Không DB, không mạng. Ca đỏ: bản sao đột biến chép cạnh tệp thật, nạp rồi xoá ngay.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { shaTep as shaGhi, mediaRowsFromPosts } from "../../pipeline/media-rows.mjs"
import type { User } from "../src/lib/auth"
import { chuKhongLink, danhSachAnh, shaTep } from "../src/lib/labels-anh"
import { buildMediaImages, buildOfferImages, type MediaRow, type PostMediaRow } from "../src/lib/ops/review-media"
import { serveZaloMedia, type BaiAnhRow } from "../src/lib/ops/zalo-media"

const APP = resolve(import.meta.dirname, "..")
const SNAP = "hanoi__s03__kta"
const sha = (c: string) => c.repeat(64)
const U = (n: string) => `https://img.example.test/${n}.jpg`
const tep = (n: string, s?: string) => ({ url: U(n), file: `media/${n}.jpg`, snapshotId: SNAP, ...(s ? { sha256: s } : {}) })
const OPS: User = { id: "1", email: "ops@x.vn", plan: "pro", role: "ops" }

let tmp = ""
let cu: string | undefined
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "kta-"))
  const dir = join(tmp, "snapshots", "hanoi", SNAP, "media")
  mkdirSync(dir, { recursive: true })
  for (const n of ["a", "b", "c", "d"]) writeFileSync(join(dir, `${n}.jpg`), Buffer.from([0xff, 0xd8, 0xff, 0xe0, n.charCodeAt(0)]))
  cu = process.env.SNAPSHOTS_DIR
  process.env.SNAPSHOTS_DIR = join(tmp, "snapshots")
})
after(() => {
  if (cu === undefined) delete process.env.SNAPSHOTS_DIR
  else process.env.SNAPSHOTS_DIR = cu
  rmSync(tmp, { recursive: true, force: true })
})

async function banSao(rel: string, thay: [string, string][]) {
  let src = readFileSync(join(APP, rel), "utf8")
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `đột biến không khớp mã nguồn: «${a}»`)
    src = src.replace(a, b)
  }
  const f = join(APP, rel.replace(/[^/]+$/, `.kta-${process.pid}-${Math.random().toString(36).slice(2)}.ts`))
  writeFileSync(f, src)
  try {
    return await import(pathToFileURL(f).href)
  } finally {
    rmSync(f, { force: true })
  }
}

// [tên, media_files, cột media, tệp hoặc URL mong đợi theo thứ tự]
const AC8: [string, unknown, unknown, string[]][] = [
  ["hai tệp cùng băm", [tep("a", sha("a")), tep("b", sha("a"))], null, ["media/a.jpg"]],
  ["băm viết hoa", [tep("a", sha("a")), tep("b", sha("A"))], null, ["media/a.jpg"]],
  ["thiếu băm giữ cả hai", [tep("a"), tep("b")], null, ["media/a.jpg", "media/b.jpg"]],
  ["trùng băm xen tệp thiếu băm", [tep("a", sha("a")), tep("c"), tep("b", sha("a")), tep("d", sha("d"))], null, ["media/a.jpg", "media/c.jpg", "media/d.jpg"]],
  ["URL của tệp đã khử không quay lại", [tep("a", sha("a")), tep("b", sha("a"))], [{ url: U("b") }, { url: U("u") }], ["media/a.jpg", U("u")]],
]
type Ds = typeof danhSachAnh
const kiemAc8 = (fn: Ds) => {
  for (const [ten, mf, m, mong] of AC8) {
    assert.deepEqual(fn(m, mf, SNAP).map((n) => (n.kind === "tep" ? n.file : n.url)), mong, `KTA-AC-8 lệch: ${ten}`)
  }
}
test("KTA-AC-8 danhSachAnh khử cùng luật với bên ghi", () => kiemAc8(danhSachAnh))
test("KTA-AC-8 ca đỏ: bỏ khử băm", async () => {
  const dot = await banSao("src/lib/labels-anh.ts", [[` || (sha && t.sha256 === sha)`, ""]])
  assert.throws(() => kiemAc8(dot.danhSachAnh), /KTA-AC-8 lệch: hai tệp cùng băm/)
})
test("KTA-AC-8 hai bản shaTep cùng kết quả", () => {
  for (const v of [sha("a"), sha("A"), "a".repeat(63), sha("z"), undefined, 5, ""]) {
    assert.equal(shaTep({ sha256: v }), shaGhi({ sha256: v }), `KTA-AC-8 hai bản lệch: ${String(v)}`)
  }
})

test("KTA-AC-8 mỗi số anh trả đúng tệp của vị trí đó, ngoài khoảng 404", async () => {
  const bai: BaiAnhRow = { media: null, media_files: [tep("a", sha("a")), tep("b", sha("a")), tep("c", sha("c")), tep("d")], snapshot_id: SNAP }
  const goi = (anh: number) =>
    serveZaloMedia(new Request(`http://localhost/api/zalo-media?nhan=1&anh=${anh}`), OPS, {
      traBai: async () => bai,
      layAnh: (async () => new Response("khong duoc goi", { status: 599 })) as never,
    })
  for (const [i, n] of ["a", "c", "d"].entries()) {
    const r = await goi(i)
    assert.equal(r.status, 200, `KTA-AC-8 số anh ${i}`)
    assert.equal(Buffer.from(await r.arrayBuffer()).at(-1), n.charCodeAt(0), `KTA-AC-8 số anh ${i} sai tệp`)
  }
  assert.equal((await goi(3)).status, 404, "KTA-AC-8 ngoài khoảng phải 404")
})

test("KTA-AC-8 dữ liệu thẻ không mang băm", () => {
  // Bên dựng thẻ chỉ dùng số thứ tự và chữ; chữ qua chuKhongLink không được chứa băm, mã nguồn thẻ không đọc trường băm.
  const anh = danhSachAnh(null, [tep("a", sha("a"))], SNAP)
  assert.equal((anh[0] as { sha256?: string }).sha256, sha("a"), "đối chứng: bên máy chủ có băm")
  assert.doesNotMatch(JSON.stringify(chuKhongLink("Bán căn", anh)), /a{64}/, "KTA-AC-8 lộ băm qua chữ")
  for (const rel of ["src/lib/labels-queries.ts", "src/lib/labels-luot-hai.ts"]) {
    const src = readFileSync(join(APP, rel), "utf8")
    assert.match(src, /anh: nguon\.map\(\(_, i\) => duongAnh\(/, `KTA-AC-8 ${rel} không còn dựng đường ảnh theo thứ tự`)
    assert.doesNotMatch(src, /sha256/, `KTA-AC-8 ${rel} đọc trường băm`)
  }
})

// Phần tương đương của KTA-AC-7: dòng rút từ bên ghi thật, so với thước đã ký.
const bai = (id: string, media_files: unknown, media: unknown = null): PostMediaRow & { post_id: string } => ({ offer_id: "o1", post_id: id, snapshot_id: SNAP, media, media_files })
const qua = (posts: PostMediaRow[]): MediaRow[] =>
  mediaRowsFromPosts("o1", "S03", posts).map((r: { media_key: string; media_url: string | null; local_file: string | null }) => ({ offer_id: "o1", media_key: r.media_key, media_url: r.media_url, local_file: r.local_file }))
const chiTep = (imgs: { src: string; origin: string }[]) => imgs.filter((i) => i.origin === "local").map((i) => i.src)
const MA_TRAN: [string, PostMediaRow[]][] = [
  ["trùng băm giữa hai bài", [bai("p1", [tep("a", sha("a"))]), bai("p2", [tep("b", sha("a")), tep("c", sha("c"))])]],
  ["13 băm, 20 tệp", [bai("p1", Array.from({ length: 20 }, (_, i) => tep(`n${i}`, (i % 13).toString(16).repeat(64))))]],
  ["thiếu băm và trùng băm", [bai("p1", [tep("a"), tep("b", sha("b")), tep("c", sha("b"))])]],
]
const kiemTuongDuong = (fn: typeof buildOfferImages) => {
  for (const [ten, posts] of MA_TRAN) assert.deepEqual(chiTep(buildMediaImages(qua(posts))), chiTep(fn(posts)), `KTA-AC-7 thước lệch bên ghi: ${ten}`)
}
test("KTA-AC-7 buildOfferImages đổi theo cùng luật, khớp bên ghi trên ma trận", () => kiemTuongDuong(buildOfferImages))
test("KTA-AC-7 ca đỏ: thước không khử băm thì lệch bên ghi", async () => {
  const dot = await banSao("src/lib/ops/review-media.ts", [[`if (!sha || !daCoSha.has(sha)) push(`, `push(`]])
  assert.throws(() => kiemTuongDuong(dot.buildOfferImages), /KTA-AC-7 thước lệch bên ghi: trùng băm giữa hai bài/)
})
