// dq-nhan-danh-ba.test.tsx — DB2b `ho-nguoi-theo-nguon` AC-2 (E2b): dòng kiểm từ vựng của bốn bảng danh bạ Người
// (pipeline/dq-enum-vocab.mjs) hiện bằng chữ tiếng Việt trên /ops/quality, không lộ mã bảng. Không DB.
import { test } from "node:test"
import assert from "node:assert/strict"

import { htmlVisibleText } from "../../scripts/lib/ops-nhan.mjs"
import { dqCheckName, dqDetail, dqEntityLabel } from "../src/lib/dq-labels"
import { VOCAB } from "../src/lib/vocab.generated"

const MA_BANG = /\b(parties|party_roles|registry_aliases|registry_events)\b/
const KHONG_KHU = new Map<string, string>()
/** Chi tiết đúng khuôn chữ kiemEnum ghi khi 0 lệch. */
const chiTiet = (truc: keyof typeof VOCAB) => `0 giá trị ngoài vocabulary (${VOCAB[truc].join("|")})`

async function render(el: unknown): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}

// Ma trận viết trước: check_name · entity · trục của chi tiết · tên kiểm mong · đối tượng mong.
const MA_TRAN: [string, string, keyof typeof VOCAB, string, string][] = [
  ["enum-vocab:kind", "registry_aliases", "alias_kind", "Từ vựng loại bí danh", "Bí danh người"],
  ["enum-vocab:role", "party_roles", "party_role", "Từ vựng vai của người", "Vai trò của người"],
  ["enum-vocab:status", "parties", "registry_status", "Từ vựng trạng thái danh bạ", "Danh bạ người"],
  ["enum-vocab:kind", "registry_events", "registry_event_kind", "Từ vựng sự kiện danh bạ", "Sự kiện danh bạ người"],
]

test("AC-2 nhãn dòng kiểm danh bạ", async () => {
  let soAssert = 0
  for (const [check, entity, truc, ten, doiTuong] of MA_TRAN) {
    const ghim = `AC-2 dòng kiểm chưa diễn giải: ${check} · ${entity}`
    const n = dqCheckName(check, entity)
    const e = dqEntityLabel(entity, KHONG_KHU)
    const d = dqDetail(check, chiTiet(truc))
    assert.deepEqual([n, e], [{ text: ten, known: true }, { text: doiTuong, known: true }], ghim)
    assert.equal(d.known, true, ghim)
    for (const t of [n.text, e.text, d.text]) assert.doesNotMatch(t, MA_BANG, ghim)
    for (const code of VOCAB[truc]) assert.doesNotMatch(d.text, new RegExp(`\\b${code}\\b`), `${ghim} — mã giá trị ${code}`)
    soAssert++
  }
  assert.equal(soAssert, MA_TRAN.length)
  // Không truyền entity: `enum-vocab:kind` vẫn là «loại tin» của sale_offers (hành vi cũ).
  assert.deepEqual(dqCheckName("enum-vocab:kind"), { text: "Từ vựng loại tin", known: true })
  // Chiều đỏ: bảng không có nhãn.
  assert.equal(dqEntityLabel("party_roles_x", KHONG_KHU).known, false)

  const { DqChecksTable } = await import("../src/components/ops/quality/dq-checks-table")
  const rows = MA_TRAN.map(([check_name, entity, truc]) => ({
    check_name, entity, status: "pass", detail: chiTiet(truc), checked_at: "2026-10-30 12:00:00+00",
  }))
  const html = await render(<DqChecksTable rows={rows} />)
  const { text, code } = htmlVisibleText(html)
  const chu = [...text, ...code]
  assert.deepEqual(chu.filter((t: string) => MA_BANG.test(t)), [], "AC-2 bảng kiểm còn mã bảng thô")
  for (const [, , , ten] of MA_TRAN) assert.ok(chu.includes(ten), `AC-2 bảng kiểm thiếu «${ten}»`)
})
