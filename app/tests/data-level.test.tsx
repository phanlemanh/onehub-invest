// data-level.test.tsx — bậc của một tin theo thang FRAMING §3.4 viết lại 08/11 (thang-bac-moi-b0-b5): B1 chỉ khi đủ năm
// trường lõi, B2 khi tin đã định vị vào danh bạ; nằm trong cụm không phải một bậc.
import assert from "node:assert/strict"
import { describe, test } from "node:test"

import { coreFields, levelOf, type LevelInput } from "../src/lib/data-level"

const FULL: LevelInput = { kind: "sale", propertyType: "apartment", priceVnd: 3_200_000_000, areaM2: 81, ward: "Bảy Hiền", located: false }

describe("bậc nghiêm theo năm trường lõi", () => {
  test("đủ năm trường, chưa định vị → B1 Tin", () => {
    assert.equal(levelOf(FULL), "B1")
  })
  test("đủ năm trường và đã định vị vào danh bạ → B2 Định vị", () => {
    assert.equal(levelOf({ ...FULL, located: true }), "B2")
  })
  test("thiếu một trường bất kỳ → B0, kể cả khi đã định vị", () => {
    const thieu: Partial<LevelInput>[] = [
      { kind: null },
      { propertyType: "unknown" },
      { propertyType: null },
      { priceVnd: null },
      { priceVnd: 0 },
      { areaM2: null },
      { ward: null },
    ]
    for (const t of thieu) assert.equal(levelOf({ ...FULL, ...t, located: true }), "B0", JSON.stringify(t))
  })
  test("tin S03 điển hình (loại hình chưa rõ, chưa gắn phường) → B0, thiếu đúng hai trường", () => {
    const r = { ...FULL, propertyType: "unknown", ward: null }
    assert.equal(levelOf(r), "B0")
    assert.deepEqual(coreFields(r).filter((f) => !f.ok).map((f) => f.key), ["propertyType", "ward"])
  })
})
